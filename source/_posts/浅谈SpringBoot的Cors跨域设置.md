title: 浅谈SpringBoot的Cors跨域设置
author: RolandLee
tags: []
categories:
  - Spring Boot
date: 2019-06-12 16:15:00
---

> 这世上有三样东西是别人抢不走的：一是吃进胃里的食物，二是藏在心中的梦想，三是读进大脑的书

# 1、什么是跨越？

- 一个网页向另一个不同域名/不同协议/不同端口的网页请求资源，这就是跨域。
- 跨域原因产生：在当前域名请求网站中，默认不允许通过ajax请求发送其他域名。

# SpringBoot的Cors跨域设置

- SpringBoot可以基于Cors解决跨域问题，Cors是一种机制，告诉我们的后台，哪边（origin ）来的请求可以访问服务器的数据。

- 全局配置

- 配置实例如下：
<!--more-->

```
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("*")
            .allowCredentials(true)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .maxAge(3600);
    }
}
```

首先实现了WebMvcConfigurer 接口，WebMvcConfigurer 这个接口十分强大，里面还有很多可用的方法，在SpringBoot2.0里面可以解决WebMvcConfigurerAdapter曾经的部分任务。其中一个方法就是addCorsMappings()，是专门为开发人员解决跨域而诞生的接口。其中构造参数为CorsRegistry。


看下CorsRegistry源码，十分简单：

```
public class CorsRegistry {

   private final List<CorsRegistration> registrations = new ArrayList<>();

   public CorsRegistration addMapping(String pathPattern) {
      CorsRegistration registration = new CorsRegistration(pathPattern);
      this.registrations.add(registration);
      return registration;
   }
   
   protected Map<String, CorsConfiguration> getCorsConfigurations() {
      Map<String, CorsConfiguration> configs = new LinkedHashMap<>(this.registrations.size());
      for (CorsRegistration registration : this.registrations) {
         configs.put(registration.getPathPattern(), registration.getCorsConfiguration());
      }
      return configs;
   }

}
```

可以看出CorsRegistry 有个属性registrations ，按道理可以根据不同的项目路径进行定制访问行为，但是我们示例直接将pathPattern 设置为 `/**`，也就是说已覆盖项目所有路径，只需要创建一个CorsRegistration就好。getCorsConfigurations(),这个方法是获取所有CorsConfiguration的Map集合，key值为传入路径pathPattern。

回到示例代码CorsConfig中，registry对象addMapping()增加完传入路径pathPattern之后，return了一个CorsRegistration对象，是进行更多的配置，看一下CorsRegistration的代码，看看我们能配些什么？


```
public class CorsRegistration {
    //传入的路径
   private final String pathPattern;
    //配置信息实体类
   private final CorsConfiguration config;
    //构造方法
   public CorsRegistration(String pathPattern) {
      this.pathPattern = pathPattern;
      //原生注释看到了一个 @CrossOrigin 这个注解，待会看看是什么
      // Same implicit default values as the @CrossOrigin annotation + allows simple methods
      this.config = new CorsConfiguration().applyPermitDefaultValues();
   }
    //允许哪些源网站访问，默认所有
   public CorsRegistration allowedOrigins(String... origins) {
      this.config.setAllowedOrigins(Arrays.asList(origins));
      return this;
   }
    //允许何种方式访问，默认简单方式，即：GET，HEAD，POST
   public CorsRegistration allowedMethods(String... methods) {
      this.config.setAllowedMethods(Arrays.asList(methods));
      return this;
   }
    //设置访问header，默认所有
   public CorsRegistration allowedHeaders(String... headers) {
      this.config.setAllowedHeaders(Arrays.asList(headers));
      return this;
   }
    //设置response headers，默认没有（什么都不设置）
   public CorsRegistration exposedHeaders(String... headers) {
      this.config.setExposedHeaders(Arrays.asList(headers));
      return this;
   }
    //是否浏览器应该发送credentials，例如cookies Access-Control-Allow-Credentials
   public CorsRegistration allowCredentials(boolean allowCredentials) {
      this.config.setAllowCredentials(allowCredentials);
      return this;
   }
    //设置等待时间，默认1800秒
   public CorsRegistration maxAge(long maxAge) {
      this.config.setMaxAge(maxAge);
      return this;
   }

   protected String getPathPattern() {
      return this.pathPattern;
   }

   protected CorsConfiguration getCorsConfiguration() {
      return this.config;
   }

}
```

局部配置

- 刚才遇到一个@CrossOrigin这个注解，看看它是干什么的？

```
@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CrossOrigin {

   /** @deprecated as of Spring 5.0, in favor of {@link CorsConfiguration#applyPermitDefaultValues} */
   @Deprecated
   String[] DEFAULT_ORIGINS = { "*" };

   /** @deprecated as of Spring 5.0, in favor of {@link CorsConfiguration#applyPermitDefaultValues} */
   @Deprecated
   String[] DEFAULT_ALLOWED_HEADERS = { "*" };

   /** @deprecated as of Spring 5.0, in favor of {@link CorsConfiguration#applyPermitDefaultValues} */
   @Deprecated
   boolean DEFAULT_ALLOW_CREDENTIALS = false;

   /** @deprecated as of Spring 5.0, in favor of {@link CorsConfiguration#applyPermitDefaultValues} */
   @Deprecated
   long DEFAULT_MAX_AGE = 1800

   /**
    * Alias for {@link #origins}.
    */
   @AliasFor("origins")
   String[] value() default {};

   @AliasFor("value")
   String[] origins() default {};

   String[] allowedHeaders() default {};

   String[] exposedHeaders() default {};

   RequestMethod[] methods() default {};

   String allowCredentials() default "";

   long maxAge() default -1;
}
```

这个注解可以作用于方法或者类上，实现局部跨域，你会发现除了设置路径（因为没必要了，都定位到局部了）其他的参数与全局类似。




 
