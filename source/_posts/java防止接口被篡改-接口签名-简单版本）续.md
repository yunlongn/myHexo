title: java防止接口被篡改--接口签名(简单版本）续
author: RolandLee
tags:
  - 签名
categories:
  - java
date: 2019-05-14 10:26:00
---
# 一、前言

- 此次来说一下另一种简单粗暴的签名方案。相对于之前的签名方案，对body、paramenter、path variable的获取都做了简化的处理。也就是说这种方式针所有数据进行了签名，并不能指定某些数据进行签名。

# 二、签名规则
- 1、线下分配**appid**和**appsecret**，针对不同的调用方分配不同的**appid**和**appsecret**
- 2、加入**timestamp**（时间戳），10分钟内数据有效
- 3、加入流水号**nonce**（防止重复提交），至少为10位。针对查询接口，流水号只用于日志落地，便于后期日志核查。 针对办理类接口需校验流水号在有效期内的唯一性，以避免重复请求。
- 4、加入**signature**，所有数据的签名信息。
- 以上红色字段放在请求头中。
<!--more-->
# 三、签名的生成

-  **signature**字段生成规则如下。

## 1、数据部分
- Path Variable：按照path中的字典顺序将所有value进行拼接
- Parameter：按照key=values（多个value按照字典顺序拼接）字典顺序进行拼接
- Body：从request inputstream中获取保存为String形式
- 如果存在多种数据形式，则按照body、parameter、path variable的顺序进行再拼接，得到所有数据的拼接值。

　　上述拼接的值记作 Y。
  
## 2、请求头部分

- X=”appid=xxxnonce=xxxtimestamp=xxx”

## 3、生成签名

- 最终拼接值=XY
- 最后将最终拼接值按照如下方法进行加密得到签名。
- **signature**=org.apache.commons.codec.digest.HmacUtils.AesEncodeUtil(app secret, 拼接的值);

# 四、签名算法实现
- 注：省去了X=”appid=xxxnonce=xxxtimestamp=xxx”这部分。
## 1、自定义Request对象
#### 为什么要自定义request对象，因为我们要获取request inputstream（默认只能获取一次）

```
public class BufferedHttpServletRequest extends HttpServletRequestWrapper {

    private ByteBuf buffer;

    private final AtomicBoolean isCached = new AtomicBoolean();

    public BufferedHttpServletRequest(HttpServletRequest request, int initialCapacity) {
        super(request);
        int contentLength = request.getContentLength();
        int min = Math.min(initialCapacity, contentLength);
        if (min < 0) {
            buffer = Unpooled.buffer(0);
        } else {
            buffer = Unpooled.buffer(min, contentLength);
        }
    }


    @Override
    public ServletInputStream getInputStream() throws IOException {
        //Only returning data from buffer if it is readonly, which means the underlying stream is EOF or closed.
        if (isCached.get()) {
            return new NettyServletInputStream(buffer);
        }
        return new ContentCachingInputStream(super.getInputStream());
    }

    public void release() {
        buffer.release();
    }

    private class ContentCachingInputStream extends ServletInputStream {

        private final ServletInputStream is;

        public ContentCachingInputStream(ServletInputStream is) {
            this.is = is;
        }

        @Override
        public int read() throws IOException {
            int ch = this.is.read();
            if (ch != -1) {
                //Stream is EOF, set this buffer to readonly state
                buffer.writeByte(ch);
            } else {
                isCached.compareAndSet(false, true);
            }
            return ch;
        }

        @Override
        public void close() throws IOException {
            //Stream is closed, set this buffer to readonly state
            try {
                is.close();
            } finally {
                isCached.compareAndSet(false, true);
            }
        }

        @Override
        public boolean isFinished() {
            throw new UnsupportedOperationException("Not yet implemented!");
        }

        @Override
        public boolean isReady() {
            throw new UnsupportedOperationException("Not yet implemented!");
        }

        @Override
        public void setReadListener(ReadListener readListener) {
            throw new UnsupportedOperationException("Not yet implemented!");
        }
    }
}
```
#### 替换默认的request对象

```
@Configuration
public class FilterConfig {
    @Bean
    public RequestCachingFilter requestCachingFilter() {
        return new RequestCachingFilter();
    }

    @Bean
    public FilterRegistrationBean requestCachingFilterRegistration(
            RequestCachingFilter requestCachingFilter) {
        FilterRegistrationBean bean = new FilterRegistrationBean(requestCachingFilter);
        bean.setOrder(1);
        return bean;
    }
}
```
```
public class RequestCachingFilter extends OncePerRequestFilter {
    private static Logger LOGGER = LoggerFactory.getLogger(RequestCachingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        boolean isFirstRequest = !isAsyncDispatch(request);
        HttpServletRequest requestToUse = request;
        if (isFirstRequest && !(request instanceof BufferedHttpServletRequest)) {
            requestToUse = new BufferedHttpServletRequest(request, 1024);
        }
        try {
            filterChain.doFilter(requestToUse, response);
        } catch (Exception e) {
            LOGGER.error("RequestCachingFilter>>>>>>>>>", e);
        } finally {
            this.printRequest(requestToUse);
            if (requestToUse instanceof BufferedHttpServletRequest) {
                ((BufferedHttpServletRequest) requestToUse).release();
            }
        }
    }

    private void printRequest(HttpServletRequest request) {
        String body = StringUtils.EMPTY;
        try {
            if (request instanceof BufferedHttpServletRequest) {
                body = IOUtils.toString(request.getInputStream(), StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            LOGGER.error("printRequest 获取body异常...", e);
        }

        JSONObject requestJ = new JSONObject();
        JSONObject headers = new JSONObject();
        Collections.list(request.getHeaderNames())
                .stream()
                .forEach(name -> headers.put(name, request.getHeader(name)));
        requestJ.put("headers", headers);
        requestJ.put("parameters", request.getParameterMap());
        requestJ.put("body", body);
        requestJ.put("remote-user", request.getRemoteUser());
        requestJ.put("remote-addr", request.getRemoteAddr());
        requestJ.put("remote-host", request.getRemoteHost());
        requestJ.put("remote-port", request.getRemotePort());
        requestJ.put("uri", request.getRequestURI());
        requestJ.put("url", request.getRequestURL());
        requestJ.put("servlet-path", request.getServletPath());
        requestJ.put("method", request.getMethod());
        requestJ.put("query", request.getQueryString());
        requestJ.put("path-info", request.getPathInfo());
        requestJ.put("context-path", request.getContextPath());

        LOGGER.info("Request-Info: " + JSON.toJSONString(requestJ, SerializerFeature.PrettyFormat));
    }

}
```
## 2、签名切面

```
@Aspect
@Component
public class SignatureAspect {

    private static final Logger LOGGER = LoggerFactory.getLogger(StringUtils.class);

    @Around("execution(* com..controller..*.*(..)) " +
            "&& (@annotation(org.springframework.web.bind.annotation.RequestMapping)" +
            "|| @annotation(org.springframework.web.bind.annotation.GetMapping)" +
            "|| @annotation(org.springframework.web.bind.annotation.PostMapping)" +
            "|| @annotation(org.springframework.web.bind.annotation.DeleteMapping)" +
            "|| @annotation(org.springframework.web.bind.annotation.PatchMapping))"
    )
    public Object doAround(ProceedingJoinPoint pjp) throws Throwable {
        try {
            this.checkSign();
            return pjp.proceed();
        } catch (Throwable e) {
            LOGGER.error("SignatureAspect>>>>>>>>", e);
            throw e;
        }
    }

    private void checkSign() throws Exception {
        HttpServletRequest request = ((ServletRequestAttributes) (RequestContextHolder.currentRequestAttributes())).getRequest();
        String oldSign = request.getHeader("X-SIGN");
        if (StringUtils.isBlank(oldSign)) {
            throw new RuntimeException("取消签名Header[X-SIGN]信息");
        }
        //获取body（对应@RequestBody）
        String body = null;
        if (request instanceof BufferedHttpServletRequest) {
            body = IOUtils.toString(request.getInputStream(), StandardCharsets.UTF_8);
        }

        //获取parameters（对应@RequestParam）
        Map<String, String[]> params = null;
        if (!CollectionUtils.isEmpty(request.getParameterMap())) {
            params = request.getParameterMap();
        }

        //获取path variable（对应@PathVariable）
        String[] paths = null;
        ServletWebRequest webRequest = new ServletWebRequest(request, null);
        Map<String, String> uriTemplateVars = (Map<String, String>) webRequest.getAttribute(
                HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        if (!CollectionUtils.isEmpty(uriTemplateVars)) {
            paths = uriTemplateVars.values().toArray(new String[]{});
        }
        try {
            String newSign = SignUtil.sign(body, params, paths);
            if (!newSign.equals(oldSign)) {
                throw new RuntimeException("签名不一致...");
            }
        } catch (Exception e) {
            throw new RuntimeException("验签出错...", e);
        }
    }
}
```
- 分别获取了request inputstream中的body信息、parameter信息、path variable信息。
### 签名核心工具类

```
public class SignUtil {
    private static final String DEFAULT_SECRET = "1qaz@WSX#$%&";

    public static String sign(String body, Map<String, String[]> params, String[] paths) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.isNotBlank(body)) {
            sb.append(body).append('#');
        }

        if (!CollectionUtils.isEmpty(params)) {
            params.entrySet()
                    .stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(paramEntry -> {
                        String paramValue = String.join(",", Arrays.stream(paramEntry.getValue()).sorted().toArray(String[]::new));
                        sb.append(paramEntry.getKey()).append("=").append(paramValue).append('#');
                    });
        }

        if (ArrayUtils.isNotEmpty(paths)) {
            String pathValues = String.join(",", Arrays.stream(paths).sorted().toArray(String[]::new));
            sb.append(pathValues);
        }

        String createSign = HmacUtils.hmacSha256Hex(DEFAULT_SECRET, sb.toString());
        return createSign;
    }

    public static void main(String[] args) {
        String body = "{\n" +
                "\t\"name\": \"hjzgg\",\n" +
                "\t\"age\": 26\n" +
                "}";
        Map<String, String[]> params = new HashMap<>();
        params.put("var3", new String[]{"3"});
        params.put("var4", new String[]{"4"});

        String[] paths = new String[]{"1", "2"};

        System.out.println(sign(body, params, paths));
    }

}
```

# 五、签名验证

- 简单写了一个包含body参数，parameter参数，path variable参数的controller
```
@RestController
@RequestMapping("example")
public class ExampleController {

    @PostMapping(value = "test/{var1}/{var2}", produces = MediaType.ALL_VALUE)
    public String myController(@PathVariable String var1
            , @PathVariable String var2
            , @RequestParam String var3
            , @RequestParam String var4
            , @RequestBody User user) {
        return String.join(",", var1, var2, var3, var4, user.toString());
    }

    private static class User {
        private String name;
        private int age;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        @Override
        public String toString() {
            return new ToStringBuilder(this)
                    .append("name", name)
                    .append("age", age)
                    .toString();
        }
    }
}
```

- 通过 签名核心工具类SignUtil 的main方法生成一个签名，通过如下命令验证

```
curl -X POST \
  'http://localhost:8080/example/test/1/2?var3=3&var4=4' \
  -H 'Content-Type: application/json' \
  -H 'X-SIGN: 4955125a3aa2782ab3def51dc958a34ca46e5dbb345d8808590fb53e81cc2687' \
  -d '{
    "name": "hjzgg",
    "age": 26
}'
```

此文引自 [https://www.cnblogs.com/hujunzheng/p/10178584.html](https://www.cnblogs.com/hujunzheng/p/10178584.html)