title: java防止接口被篡改--接口签名(Signature）
author: RolandLee
tags:
  - 签名
categories:
  - java
date: 2019-05-14 09:29:00
---
# 前言

- 　在为第三方系统提供接口的时候，肯定要考虑接口数据的安全问题，比如数据是否被篡改，数据是否已经过时，数据是否可以重复提交等问题。其中我认为最终要的还是数据是否被篡改。在此分享一下我的关于接口签名的实践方案。

# 签名规则
- 1、线下分配**appid**和**appsecret**，针对不同的调用方分配不同的**appid**和**appsecret**
- 2、加入timestamp（时间戳），10分钟内数据有效
- 3、加入流水号nonce（防止重复提交），至少为10位。针对查询接口，流水号只用于日志落地，便于后期日志核查。 针对办理类接口需校验流水号在有效期内的唯一性，以避免重复请求。
- 4、加入signature，所有数据的签名信息。以上红色字段放在请求头中。

<!--more-->
# 签名的生成

- **signature** 字段生成规则如下。

## 数据部分

- **Path**：按照path中的顺序将所有value进行拼接
- **Query**：按照key字典序排序，将所有key=value进行拼接
- **Form**：按照key字典序排序，将所有key=value进行拼接
- **Body**：
- - Json: 按照key字典序排序，将所有key=value进行拼接（例如{"a":"a","c":"c","b":{"e":"e"}} => a=ab=e=ec=c）
- - String: 整个字符串作为一个拼接

- 如果存在多种数据形式，则按照path、query、form、body的顺序进行再拼接，得到所有数据的拼接值。
- 上述拼接的值记作 Y。

## 请求头部分

- X=”appid=xxxnonce=xxxtimestamp=xxx”

## 生成签名

- 最终拼接值=XY
- 最后将最终拼接值按照如下方法进行加密得到签名。
- signature=org.apache.commons.codec.digest.HmacUtils.hmacSha256Hex(app secret, 拼接的值);

# 签名算法实现

## 　　指定哪些接口或者哪些实体需要进行签名

```
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({TYPE, METHOD})
@Retention(RUNTIME)
@Documented
public @interface Signature {
    String ORDER_SORT = "ORDER_SORT";//按照order值排序
    String ALPHA_SORT = "ALPHA_SORT";//字典序排序
    boolean resubmit() default true;//允许重复请求
    String sort() default Signature.ALPHA_SORT;
}
```

## 　　指定哪些字段需要进行签名

```
import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Target({FIELD})
@Retention(RUNTIME)
@Documented
public @interface SignatureField {
    //签名顺序
    int order() default 0;

    //字段name自定义值
    String customName() default "";

    //字段value自定义值
    String customValue() default "";
}
```

## 　　核心算法

```
/**
 * 生成所有注有 SignatureField属性 key=value的 拼接
 */
public static String toSplice(Object object) {
    if (Objects.isNull(object)) {
        return StringUtils.EMPTY;
    }
    if (isAnnotated(object.getClass(), Signature.class)) {
        Signature sg = findAnnotation(object.getClass(), Signature.class);
        switch (sg.sort()) {
            case Signature.ALPHA_SORT:
                return alphaSignature(object);
            case Signature.ORDER_SORT:
                return orderSignature(object);
            default:
                return alphaSignature(object);
        }
    }
    return toString(object);
}

private static String alphaSignature(Object object) {
    StringBuilder result = new StringBuilder();
    Map<String, String> map = new TreeMap<>();
    for (Field field : getAllFields(object.getClass())) {
        if (field.isAnnotationPresent(SignatureField.class)) {
            field.setAccessible(true);
            try {
                if (isAnnotated(field.getType(), Signature.class)) {
                    if (!Objects.isNull(field.get(object))) {
                        map.put(field.getName(), toSplice(field.get(object)));
                    }
                } else {
                    SignatureField sgf = field.getAnnotation(SignatureField.class);
                    if (StringUtils.isNotEmpty(sgf.customValue()) || !Objects.isNull(field.get(object))) {
                        map.put(StringUtils.isNotBlank(sgf.customName()) ? sgf.customName() : field.getName()
                                , StringUtils.isNotEmpty(sgf.customValue()) ? sgf.customValue() : toString(field.get(object)));
                    }
                }
            } catch (Exception e) {
                LOGGER.error("签名拼接(alphaSignature)异常", e);
            }
        }
    }

    for (Iterator<Map.Entry<String, String>> iterator = map.entrySet().iterator(); iterator.hasNext(); ) {
        Map.Entry<String, String> entry = iterator.next();
        result.append(entry.getKey()).append("=").append(entry.getValue());
        if (iterator.hasNext()) {
            result.append(DELIMETER);
        }
    }
    return result.toString();
}

/**
 * 针对array, collection, simple property, map做处理
 */
private static String toString(Object object) {
    Class<?> type = object.getClass();
    if (BeanUtils.isSimpleProperty(type)) {
        return object.toString();
    }
    if (type.isArray()) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Array.getLength(object); ++i) {
            sb.append(toSplice(Array.get(object, i)));
        }
        return sb.toString();
    }
    if (ClassUtils.isAssignable(Collection.class, type)) {
        StringBuilder sb = new StringBuilder();
        for (Iterator<?> iterator = ((Collection<?>) object).iterator(); iterator.hasNext(); ) {
            sb.append(toSplice(iterator.next()));
            if (iterator.hasNext()) {
                sb.append(DELIMETER);
            }
        }
        return sb.toString();
    }
    if (ClassUtils.isAssignable(Map.class, type)) {
        StringBuilder sb = new StringBuilder();
        for (Iterator<? extends Map.Entry<String, ?>> iterator = ((Map<String, ?>) object).entrySet().iterator(); iterator.hasNext(); ) {
            Map.Entry<String, ?> entry = iterator.next();
            if (Objects.isNull(entry.getValue())) {
                continue;
            }
            sb.append(entry.getKey()).append("=").append(toSplice(entry.getValue()));
            if (iterator.hasNext()) {
                sb.append(DELIMETER);
            }
        }
        return sb.toString();
    }
    return NOT_FOUND;
}
```

## 签名的校验

### header中的参数如下

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190514101137.png)


### 签名实体
```
import com.google.common.base.MoreObjects;
import com.google.common.collect.Sets;
import org.hibernate.validator.constraints.NotBlank;

import java.util.Set;

@ConfigurationProperties(prefix = "wmhopenapi.validate", exceptionIfInvalid = false)
@Signature
public class SignatureHeaders {
    public static final String SIGNATURE_HEADERS_PREFIX = "wmhopenapi-validate";

    public static final Set<String> HEADER_NAME_SET = Sets.newHashSet();

    private static final String HEADER_APPID = SIGNATURE_HEADERS_PREFIX + "-appid";
    private static final String HEADER_TIMESTAMP = SIGNATURE_HEADERS_PREFIX + "-timestamp";
    private static final String HEADER_NONCE = SIGNATURE_HEADERS_PREFIX + "-nonce";
    private static final String HEADER_SIGNATURE = SIGNATURE_HEADERS_PREFIX + "-signature";

    static {
        HEADER_NAME_SET.add(HEADER_APPID);
        HEADER_NAME_SET.add(HEADER_TIMESTAMP);
        HEADER_NAME_SET.add(HEADER_NONCE);
        HEADER_NAME_SET.add(HEADER_SIGNATURE);
    }

    /**
     * 线下分配的值
     * 客户端和服务端各自保存appId对应的appSecret
     */
    @NotBlank(message = "Header中缺少" + HEADER_APPID)
    @SignatureField
    private String appid;
    /**
     * 线下分配的值
     * 客户端和服务端各自保存，与appId对应
     */
    @SignatureField
    private String appsecret;
    /**
     * 时间戳，单位: ms
     */
    @NotBlank(message = "Header中缺少" + HEADER_TIMESTAMP)
    @SignatureField
    private String timestamp;
    /**
     * 流水号【防止重复提交】; (备注：针对查询接口，流水号只用于日志落地，便于后期日志核查； 针对办理类接口需校验流水号在有效期内的唯一性，以避免重复请求)
     */
    @NotBlank(message = "Header中缺少" + HEADER_NONCE)
    @SignatureField
    private String nonce;
    /**
     * 签名
     */
    @NotBlank(message = "Header中缺少" + HEADER_SIGNATURE)
    private String signature;

    public String getAppid() {
        return appid;
    }

    public void setAppid(String appid) {
        this.appid = appid;
    }

    public String getAppsecret() {
        return appsecret;
    }

    public void setAppsecret(String appsecret) {
        this.appsecret = appsecret;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getNonce() {
        return nonce;
    }

    public void setNonce(String nonce) {
        this.nonce = nonce;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }

    @Override
    public String toString() {
        return MoreObjects.toStringHelper(this)
                .add("appid", appid)
                .add("appsecret", appsecret)
                .add("timestamp", timestamp)
                .add("nonce", nonce)
                .add("signature", signature)
                .toString();
    }
}
```

### 　　根据request 中 header值生成SignatureHeaders实体

```
private SignatureHeaders generateSignatureHeaders(Signature signature, HttpServletRequest request) throws Exception {//NOSONAR
    Map<String, Object> headerMap = Collections.list(request.getHeaderNames())
            .stream()
            .filter(headerName -> SignatureHeaders.HEADER_NAME_SET.contains(headerName))
            .collect(Collectors.toMap(headerName -> headerName.replaceAll("-", "."), headerName -> request.getHeader(headerName)));
    PropertySource propertySource = new MapPropertySource("signatureHeaders", headerMap);
    SignatureHeaders signatureHeaders = RelaxedConfigurationBinder.with(SignatureHeaders.class)
            .setPropertySources(propertySource)
            .doBind();
    Optional<String> result = ValidatorUtils.validateResultProcess(signatureHeaders);
    if (result.isPresent()) {
        throw new ServiceException("WMH5000", result.get());
    }
    //从配置中拿到appid对应的appsecret
    String appSecret = limitConstants.getSignatureLimit().get(signatureHeaders.getAppid());
    if (StringUtils.isBlank(appSecret)) {
        LOGGER.error("未找到appId对应的appSecret, appId=" + signatureHeaders.getAppid());
        throw new ServiceException("WMH5002");
    }

    //其他合法性校验
    Long now = System.currentTimeMillis();
    Long requestTimestamp = Long.parseLong(signatureHeaders.getTimestamp());
    if ((now - requestTimestamp) > EXPIRE_TIME) {
        String errMsg = "请求时间超过规定范围时间10分钟, signature=" + signatureHeaders.getSignature();
        LOGGER.error(errMsg);
        throw new ServiceException("WMH5000", errMsg);
    }
    String nonce = signatureHeaders.getNonce();
    if (nonce.length() < 10) {
        String errMsg = "随机串nonce长度最少为10位, nonce=" + nonce;
        LOGGER.error(errMsg);
        throw new ServiceException("WMH5000", errMsg);
    }
    if (!signature.resubmit()) {
        String existNonce = redisCacheService.getString(nonce);
        if (StringUtils.isBlank(existNonce)) {
            redisCacheService.setString(nonce, nonce);
            redisCacheService.expire(nonce, (int) TimeUnit.MILLISECONDS.toSeconds(RESUBMIT_DURATION));
        } else {
            String errMsg = "不允许重复请求, nonce=" + nonce;
            LOGGER.error(errMsg);
            throw new ServiceException("WMH5000", errMsg);
        }
    }
　　 //设置appsecret
    signatureHeaders.setAppsecret(appSecret);
    return signatureHeaders;
}
```

- 生成签名前需要几个步骤，如下。
- - （1）、appid是否合法
- - （2）、根据appid从配置中心中拿到appsecret
- - （3）、请求是否已经过时，默认10分钟
- - （4）、随机串是否合法
- - （5）、是否允许重复请求

### 生成header信息参数拼接

```
String headersToSplice = SignatureUtils.toSplice(signatureHeaders);
```

### 生成header中的参数，mehtod中的参数的拼接
```
private List<String> generateAllSplice(Method method, Object[] args, String headersToSplice) {
    List<String> pathVariables = Lists.newArrayList(), requestParams = Lists.newArrayList();
    String beanParams = StringUtils.EMPTY;
    for (int i = 0; i < method.getParameterCount(); ++i) {
        MethodParameter mp = new MethodParameter(method, i);
        boolean findSignature = false;
        for (Annotation anno : mp.getParameterAnnotations()) {
            if (anno instanceof PathVariable) {
                if (!Objects.isNull(args[i])) {
                    pathVariables.add(args[i].toString());
                }
                findSignature = true;
            } else if (anno instanceof RequestParam) {
                RequestParam rp = (RequestParam) anno;
                String name = mp.getParameterName();
                if (StringUtils.isNotBlank(rp.name())) {
                    name = rp.name();
                }
                if (!Objects.isNull(args[i])) {
                    List<String> values = Lists.newArrayList();
                    if (args[i].getClass().isArray()) {
                        //数组
                        for (int j = 0; j < Array.getLength(args[i]); ++j) {
                            values.add(Array.get(args[i], j).toString());
                        }
                    } else if (ClassUtils.isAssignable(Collection.class, args[i].getClass())) {
                        //集合
                        for (Object o : (Collection<?>) args[i]) {
                            values.add(o.toString());
                        }
                    } else {
                        //单个值
                        values.add(args[i].toString());
                    }
                    values.sort(Comparator.naturalOrder());
                    requestParams.add(name + "=" + StringUtils.join(values));
                }
                findSignature = true;
            } else if (anno instanceof RequestBody || anno instanceof ModelAttribute) {
                beanParams = SignatureUtils.toSplice(args[i]);
                findSignature = true;
            }

            if (findSignature) {
                break;
            }
        }
        if (!findSignature) {
            LOGGER.info(String.format("签名未识别的注解, method=%s, parameter=%s, annotations=%s", method.getName(), mp.getParameterName(), StringUtils.join(mp.getMethodAnnotations())));
        }
    }
    List<String> toSplices = Lists.newArrayList();
    toSplices.add(headersToSplice);
    toSplices.addAll(pathVariables);
    requestParams.sort(Comparator.naturalOrder());
    toSplices.addAll(requestParams);
    toSplices.add(beanParams);
    return toSplices;
}
```

#### 对最终的拼接结果重新生成签名信息
```
SignatureUtils.signature(allSplice.toArray(new String[]{}), signatureHeaders.getAppsecret());
```

#### 依赖第三方工具包
```
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework</groupId>
  <artifactId>spring-beans</artifactId>
</dependency>
```

# 使用示例
## 生成签名
```
//初始化请求头信息
SignatureHeaders signatureHeaders = new SignatureHeaders();
signatureHeaders.setAppid("111");
signatureHeaders.setAppsecret("222");
signatureHeaders.setNonce(SignatureUtils.generateNonce());
signatureHeaders.setTimestamp(String.valueOf(System.currentTimeMillis()));
List<String> pathParams = new ArrayList<>();
//初始化path中的数据
pathParams.add(SignatureUtils.encode("18237172801", signatureHeaders.getAppsecret()));
//调用签名工具生成签名
signatureHeaders.setSignature(SignatureUtils.signature(signatureHeaders, pathParams, null, null));
System.out.println("签名数据: " + signatureHeaders);
System.out.println("请求数据: " + pathParams);
```

## 输出结果

```
拼接结果: appid=111^_^appsecret=222^_^nonce=c9e778ba668c8f6fedf35634eb493af6304d54392d990262d9e7c1960b475b67^_^timestamp=1538207443910^_^w8rAwcXDxcDKwsM=^_^
签名数据: SignatureHeaders{appid=111, appsecret=222, timestamp=1538207443910, nonce=c9e778ba668c8f6fedf35634eb493af6304d54392d990262d9e7c1960b475b67, signature=0a7d0b5e802eb5e52ac0cfcd6311b0faba6e2503a9a8d1e2364b38617877574d}
请求数据: [w8rAwcXDxcDKwsM=]
```



此文引自 [https://www.cnblogs.com/hujunzheng/p/9725168.html](https://www.cnblogs.com/hujunzheng/p/9725168.html)