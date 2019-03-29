---
title: 个人完善的springboot拦截器
date: 2019-03-27 09:40:08
tags:
- Java
categories:
- Spring Boot
---

使用Sping Boot2.0 搭建权限拦截的时候 发现 与之前的版本不一样了
<!-- more -->

```

## 所有功能完成 配置登录认证

### 配置拦截器
###### 在spring boot2.0 之后 通过继承这个WebMvcConfigurer类   就可以完成拦截
- 新建包com.example.interceptor;
- 创建login拦截类
```java
package com.example.interceptor;

import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;


public class LoginInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {       //请求进入这个拦截器
        HttpSession session = request.getSession();
        if(session.getAttribute("user") == null){       //判断session中有没有user信息
//            System.out.println("进入拦截器");
            if("XMLHttpRequest".equalsIgnoreCase(request.getHeader("X-Requested-With"))){
                response.sendError(401);
            }
            response.sendRedirect("/");     //没有user信息的话进行路由重定向
            return false;
        }
        return true;        //有的话就继续操作
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {

    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {

    }
}

```
- 在com.example包中添加拦截控制器

```java
package com.example;


import com.example.interceptor.LoginInterceptor;
import com.example.interceptor.RightsInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;



@Configuration          //使用注解 实现拦截
public class WebAppConfigurer implements WebMvcConfigurer   {

    @Autowired
    RightsInterceptor rightsInterceptor;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //登录拦截的管理器
        InterceptorRegistration registration = registry.addInterceptor(new LoginInterceptor());     //拦截的对象会进入这个类中进行判断
        registration.addPathPatterns("/**");                    //所有路径都被拦截
        registration.excludePathPatterns("/","/login","/error","/static/**","/logout");       //添加不拦截路径

    }

}
```


- 在WebAppConfigurer.java中增加内容
```java
package com.example;


import com.example.interceptor.LoginInterceptor;
import com.example.interceptor.RightsInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;



@Configuration          //使用注解 实现拦截
public class WebAppConfigurer implements WebMvcConfigurer   {

    @Autowired
    RightsInterceptor rightsInterceptor;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //登录拦截的管理器
        InterceptorRegistration registration = registry.addInterceptor(new LoginInterceptor());     //拦截的对象会进入这个类中进行判断
        registration.addPathPatterns("/**");                    //所有路径都被拦截
        registration.excludePathPatterns("/","/login","/error","/static/**","/logout");       //添加不拦截路径
//        super.addInterceptors(registry);


        //权限拦截的管理器
        InterceptorRegistration registration1 = registry.addInterceptor(rightsInterceptor);
        registration1.addPathPatterns("/**");                    //所有路径都被拦截
        registration1.excludePathPatterns("/","/login","/error","/static/**","/logout");       //添加不拦截路径
    }

}

```