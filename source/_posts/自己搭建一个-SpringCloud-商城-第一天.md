title: 自己搭建一个 SpringCloud 商城 --- 第一天
author: RolandLee
tags: []
categories:
  - SpringCloud商城
date: 2019-05-31 17:06:00
---
- 最近看到了一个 微服务制作的商城 onemall [https://gitee.com/zhijiantianya/onemall](https://gitee.com/zhijiantianya/onemall)
- 这是一个未完善的商城。
- 突然 自己也想搭建一个SpringCloud 商城
<!--more-->
# 搭建项目环境
- 创建项目

```
├─nnmall----------------------------父项目，公共依赖
│  │
│  ├─nnmall-eureka-----------------------微服务配置中心
│  │
│  ├─nnmall-system
│  │  │
│  │  ├─nnmall-system-api-------------------管理员api
│  │  │
│  │  ├─nnmall-system-impl------------------管理员实现类
│  │  │
│  │  ├─nnmall-system-sdk-------------------管理员提供的权限拦截注解
│  │  │
│  │  └─nnmall-system-web-------------------管理员web
│  │
│  ├─nnmall-common--------------------------公共包
│  │  │
│  │  ├─mall-spring-core--------------------核心包 全局异常拦截与拦截器
│  │  │
│  │  └─nnmall-common-core------------------一些常用对象和类
```
- 创建gitlab仓库

# 权限服务
- 先完成商城后台管理
- 加入管理员权限拦截
- 增加、删除、更改、查询

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/权限服务.jpg)


## 记录遇到的种种坑

- 一定要注意扫包的路径 
- 在springboot 扫包路径最好是填写一下 不然他不扫你的jar包里面的注解

```
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(scanBasePackages = {"cn.yunlongn.mall.admin", "cn.yunlongn.mall.spring.core"})
@EnableAsync(proxyTargetClass = true)
@EnableEurekaClient
@EnableFeignClients(basePackages = {"cn.yunlongn.mall.admin"})
public class SystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(SystemApplication.class, args);
    }

}
```

- 在feign的调用中遇到的问题有
- - 如果你的服务返回了错误信息。那么你的返回结果可能就不一定会有错误提示。
- - 最好是转发一下你服务的错误提示。
- - 转发方法如下 继承feign 的异常处理类
- 使用feign的时候 最好是能做一个fallback处理使用hystrix 的熔断机制。当服务不能即时响应的时候 可以自己设置一个返回信息 （请参考[https://blog.csdn.net/asdfsadfasdfsa/article/details/79286960](ttps://blog.csdn.net/asdfsadfasdfsa/article/details/79286960)）

```
import cn.yunlongn.mall.common.core.exception.ServiceException;
import com.alibaba.fastjson.JSONException;
import com.alibaba.fastjson.JSONObject;
import feign.Response;
import feign.Util;
import feign.codec.ErrorDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/**
 * 定义feign的异常处理类 在feign出异常的时候进入此类
 * 例如feign的密码错误
 */
@Configuration
public class FeignErrorDecoder implements ErrorDecoder {

    @Override

    public Exception decode(String methodKey, Response response) {
        try {
            // 这里直接拿到我们抛出的异常信息
            String message = Util.toString(response.body().asReader());
            try {
                JSONObject jsonObject = JSONObject.parseObject(message);
                return new ServiceException(jsonObject.getInteger("code"),jsonObject.getString("message"));
            } catch (JSONException e) {
                e.printStackTrace();
            }

        } catch (IOException ignored) {

        }
        return decode(methodKey, response);
    }
}
```

