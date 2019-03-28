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


import lombok.extern.slf4j.Slf4j;
import org.manage.management.permission.interceptor.LoginInterceptor;
import org.manage.management.permission.interceptor.RightsInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import javax.servlet.MultipartConfigElement;

@Slf4j
@Configuration          //使用注解 实现拦截
public class WebAppConfigurer implements WebMvcConfigurer {

    @Autowired
    RightsInterceptor rightsInterceptor;

    @Autowired
    LoginInterceptor loginInterceptor;
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //登录拦截的管理器
        //拦截的对象会进入这个类中进行判断
        InterceptorRegistration registration = registry.addInterceptor(loginInterceptor);
        //所有路径都被拦截
        registration.addPathPatterns("/**");
        //添加不拦截路径
        registration.excludePathPatterns("/","/m/**","/mm/**","/login","/admin/login","/error","/static/**","/logout","/images/**"
        );

        // 权限拦截的管理器
        InterceptorRegistration registration1 = registry.addInterceptor(rightsInterceptor);
        //所有路径都被拦截
        registration1.addPathPatterns("/**");
        //添加不拦截路径
        registration1.excludePathPatterns("/","/m/**","/mm/**","/login","/admin/login","/error","/static/**","/logout","/images/**");
    }

    @Value("${imagesPath}")
    private String mImagesPath;


    /**
     * 将指定路径的文件 ，映射成网站某路径下的文件
     * 例如将 /images/4.jpg  对应到 file:E://桌面/Shop/management/upload/file/images/4.jpg
     * **/
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if(mImagesPath.equals("") || mImagesPath.equals("${imagesPath}")){
            String imagesPath = WebAppConfigurer.class.getClassLoader().getResource("").getPath();
            if(imagesPath.indexOf(".jar")>0){
                imagesPath = imagesPath.substring(0, imagesPath.indexOf(".jar"));
            }else if(imagesPath.indexOf("classes")>0){
                imagesPath = "file:"+imagesPath.substring(0, imagesPath.indexOf("classes"));
            }
            imagesPath = imagesPath.substring(0, imagesPath.lastIndexOf("/"))+"/images/";
            mImagesPath = imagesPath;
        }

        System.out.println("本地路径：" + mImagesPath + "。。已经映射到路由/m/**之下");
        registry.addResourceHandler("/m/**").addResourceLocations(mImagesPath);
        registry.addResourceHandler("/mm/**").addResourceLocations(mImagesPath);
    }


}
```
