title: SpringBoot中Shiro缓存使用Redis、Ehcache
author: RolandLee
date: 2019-08-15 10:07:54
tags:
---
## 在SpringBoot中Shiro缓存使用Redis、Ehcache实现的两种方式实例

SpringBoot 中配置redis作为session 缓存器。 让shiro引用

- 本文是建立在你是使用这shiro基础之上的补充内容

<!--more-->

### 第一种：Redis缓存，将数据存储到redis 并且开启session存入redis中。

### 引入pom

```xml
    <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.session</groupId>
            <artifactId>spring-session-data-redis</artifactId>
     </dependency>
```

### 配置redisConfig

```java
@Configuration
@EnableCaching
public class RedisConfig extends CachingConfigurerSupport {
    @Bean
    public KeyGenerator keyGenerator() {
        return new KeyGenerator() {
            @Override
            public Object generate(Object target, Method method, Object... params) {
                StringBuilder sb = new StringBuilder();
                sb.append(target.getClass().getName());
                sb.append(method.getName());
                for (Object obj : params) {
                    sb.append(obj.toString());
                }
                return sb.toString();
            }
        };
    }
    

    @Bean
    //在这里配置缓存reids配置
    public RedisCacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1)); // 设置缓存有效期一小时
        System.out.println("《========【开启redis】 ======== 》 ");
        return RedisCacheManager
                .builder(RedisCacheWriter.nonLockingRedisCacheWriter(redisConnectionFactory))
                .cacheDefaults(redisCacheConfiguration).build();
    }

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        StringRedisTemplate template = new StringRedisTemplate(factory);
        Jackson2JsonRedisSerializer jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer(Object.class);
        ObjectMapper om = new ObjectMapper();
        om.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        om.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(om);
        template.setValueSerializer(jackson2JsonRedisSerializer);
        template.afterPropertiesSet();
        return template;
    }

}

```


### 配置自定义缓存管理器，引入redis缓存管理器

- 定义自己的CacheManager

```java
/**
 * <p> 自定义cacheManage 扩张shiro里面的缓存 使用reids作缓存 </p> 
 * <description>
 *  引入自己定义的CacheManager 
 *  关于CacheManager的配置文件在spring-redis-cache.xml中
 * </description>
 */
@Component
public class ShiroSpringCacheManager implements CacheManager ,Destroyable{
    /**
     * 将之上的RedisCacheManager的Bean拿出来 注入于此
     */
    @Autowired
    private org.springframework.cache.CacheManager cacheManager;
     
    public org.springframework.cache.CacheManager getCacheManager() {
        return cacheManager;
    }

    public void setCacheManager(org.springframework.cache.CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @Override
    public void destroy() throws Exception {
        cacheManager = null;
    }

    @Override
    public <K, V> Cache<K, V> getCache(String name)  {
        if (name == null ){
            return null;
        }
        // 新建一个ShiroSpringCache 将Bean放入并实例化
        return new ShiroSpringCache<K,V>(name,getCacheManager());
    }


}
```

- 定义自己实现的Shiro的Cache,实现了Shiro包里的Cache


```java
/**
 * <p> 自定义缓存 将数据存入到redis中 </p>
 */
@SuppressWarnings("unchecked")
public class ShiroSpringCache<K,V> implements org.apache.shiro.cache.Cache<K, V>{
    private static final Logger log = LoggerFactory.getLogger(ShiroSpringCache.class);
    private CacheManager cacheManager;
    private Cache cache;

    public ShiroSpringCache(String name, CacheManager cacheManager) {
        if(name==null || cacheManager==null){
            throw new IllegalArgumentException("cacheManager or CacheName cannot be null.");
        }
        this.cacheManager = cacheManager;
        //这里首先是从父类中获取这个cache,如果没有会创建一个redisCache,初始化这个redisCache的时候
        //会设置它的过期时间如果没有配置过这个缓存的，那么默认的缓存时间是为0的，如果配置了，就会把配置的时间赋予给这个RedisCache
        //如果从缓存的过期时间为0，就表示这个RedisCache不存在了，这个redisCache实现了spring中的cache
        this.cache= cacheManager.getCache(name);
    }
    @Override
    public V get(K key) throws CacheException {
        log.info("从缓存中获取key为{}的缓存信息",key);
        if(key == null){
            return null;
        }
        ValueWrapper valueWrapper = cache.get(key);
        if(valueWrapper==null){
            return null;
        }
        return (V) valueWrapper.get();
    }

    @Override
    public V put(K key, V value) throws CacheException {
        log.info("创建新的缓存，信息为：{}={}",key,value);
        cache.put(key, value);
        return get(key);
    }

    @Override
    public V remove(K key) throws CacheException {
        log.info("干掉key为{}的缓存",key);
        V v = get(key);
        cache.evict(key);//干掉这个名字为key的缓存
        return v;
    }

    @Override
    public void clear() throws CacheException {
        log.info("清空所有的缓存");
        cache.clear();
    }

    @Override
    public int size() {
        return cacheManager.getCacheNames().size();
    }

    /**
     * 获取缓存中所的key值
     */
    @Override
    public Set<K> keys() {
        return (Set<K>) cacheManager.getCacheNames();
    }

    /**
     * 获取缓存中所有的values值
     */
    @Override
    public Collection<V> values() {
        return (Collection<V>) cache.get(cacheManager.getCacheNames()).get();
    }

    @Override
    public String toString() {
        return "ShiroSpringCache [cache=" + cache + "]";
    }
}
```

- **到此为止，使用redis做缓存，和spring的集成就完成了。**

- 可以使用以下注解将缓存放入redis

```
 @Cacheable(value = Cache.CONSTANT, key = "'" + CacheKey.DICT_NAME + "'+#name+'_'+#val")
```

### 配置spring session管理器
```
    @Bean
    @ConditionalOnProperty(prefix = "xpro", name = "spring-session-open", havingValue = "true")
    public ServletContainerSessionManager servletContainerSessionManager() {
        return new ServletContainerSessionManager();
    }
```

- 新建类 spring session设置session过期时间
```
/**
 * spring session配置
 *
 * @author xingri
 * @date 2017-07-13 21:05
 */
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 900)  //session过期时间  如果部署多机环境,需要打开注释
@ConditionalOnProperty(prefix = "xpro", name = "spring-session-open", havingValue = "true")
public class SpringSessionConfig {

}

```

### 第一种：Ehcache做缓存，可以将数据存储到磁盘中，也可以存到内存中

- 新建ehcache.xml 文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache updateCheck="false" dynamicConfig="false">
    <diskStore path="java.io.tmpdir"/>
    <!--授权信息缓存-->
    <cache name="authorizationCache"
           maxEntriesLocalHeap="2000"
           eternal="false"
           timeToIdleSeconds="1800"
           timeToLiveSeconds="1800"
           overflowToDisk="false"
           statistics="true">
    </cache>
<!--身份信息缓存-->
    <cache name="authenticationCache"
           maxEntriesLocalHeap="2000"
           eternal="false"
           timeToIdleSeconds="1800"
           timeToLiveSeconds="1800"
           overflowToDisk="false"
           statistics="true">
    </cache>
<!--session缓存-->
    <cache name="activeSessionCache"
           maxEntriesLocalHeap="2000"
           eternal="false"
           timeToIdleSeconds="1800"
           timeToLiveSeconds="1800"
           overflowToDisk="false"
           statistics="true">
    </cache>

    <!-- 缓存半小时 -->
    <cache name="halfHour"
           maxElementsInMemory="10000"
           maxElementsOnDisk="100000"
           eternal="false"
           timeToIdleSeconds="1800"
           timeToLiveSeconds="1800"
           overflowToDisk="false"
           diskPersistent="false" />

    <!-- 缓存一小时 -->
    <cache name="hour"
           maxElementsInMemory="10000"
           maxElementsOnDisk="100000"
           eternal="false"
           timeToIdleSeconds="3600"
           timeToLiveSeconds="3600"
           overflowToDisk="false"
           diskPersistent="false" />

    <!-- 缓存一天 -->
    <cache name="oneDay"
           maxElementsInMemory="10000"
           maxElementsOnDisk="100000"
           eternal="false"
           timeToIdleSeconds="86400"
           timeToLiveSeconds="86400"
           overflowToDisk="false"
           diskPersistent="false" />

    <!--
        name:缓存名称。
        maxElementsInMemory：缓存最大个数。
        eternal:对象是否永久有效，一但设置了，timeout将不起作用。
        timeToIdleSeconds：设置对象在失效前的允许闲置时间（单位：秒）。仅当eternal=false对象不是永久有效时使用，可选属性，默认值是0，也就是可闲置时间无穷大。
        timeToLiveSeconds：设置对象在失效前允许存活时间（单位：秒）。最大时间介于创建时间和失效时间之间。仅当eternal=false对象不是永久有效时使用，默认是0.，也就是对象存活时间无穷大。
        overflowToDisk：当内存中对象数量达到maxElementsInMemory时，Ehcache将会对象写到磁盘中。
        diskSpoolBufferSizeMB：这个参数设置DiskStore（磁盘缓存）的缓存区大小。默认是30MB。每个Cache都应该有自己的一个缓冲区。
        maxElementsOnDisk：硬盘最大缓存个数。
        diskPersistent：是否缓存虚拟机重启期数据 Whether the disk store persists between restarts of the Virtual Machine. The default value is false.
        diskExpiryThreadIntervalSeconds：磁盘失效线程运行时间间隔，默认是120秒。
        memoryStoreEvictionPolicy：当达到maxElementsInMemory限制时，Ehcache将会根据指定的策略去清理内存。默认策略是LRU（最近最少使用）。你可以设置为FIFO（先进先出）或是LFU（较少使用）。
        clearOnFlush：内存数量最大时是否清除。
    -->
    <defaultCache name="defaultCache"
                  maxElementsInMemory="10000"
                  eternal="false"
                  timeToIdleSeconds="600"
                  timeToLiveSeconds="600"
                  overflowToDisk="false"
                  maxElementsOnDisk="100000"
                  diskPersistent="false"
                  diskExpiryThreadIntervalSeconds="120"
                  memoryStoreEvictionPolicy="LRU"/>

</ehcache>
```


### 配置自定义缓存管理器，引入ehcache缓存管理器

```java

/**
 * ehcache配置
 *
 */
@Configuration
@EnableCaching
public class EhCacheConfig {

    /**
     * EhCache的配置
     */
    @Bean
    public EhCacheCacheManager cacheManager(CacheManager cacheManager) {
        MBeanServer mBeanServer = ManagementFactory.getPlatformMBeanServer();
        ManagementService.registerMBeans(cacheManager, mBeanServer, true, true, true, true);
        return new EhCacheCacheManager(cacheManager);
    }

    /**
     * EhCache的配置
     */
    @Bean
    public EhCacheManagerFactoryBean ehcache() {
        System.out.println("《========【开启ehcache】 ======== 》 ");
        EhCacheManagerFactoryBean ehCacheManagerFactoryBean = new EhCacheManagerFactoryBean();
        ehCacheManagerFactoryBean.setConfigLocation(new ClassPathResource("ehcache.xml"));
        return ehCacheManagerFactoryBean;
    }
    
    @Bean
    public org.apache.shiro.cache.CacheManager getCacheShiroManager(EhCacheManagerFactoryBean ehcache) {
        EhCacheManager ehCacheManager = new EhCacheManager();
        ehCacheManager.setCacheManager(ehcache.getObject());
        return ehCacheManager;
    }
}

```





# 最后 最重要的是引入shriro 中

```java

/**
 * shiro权限管理的配置
 *
 */
@Configuration
public class ShiroConfig {

    /**
     * 安全管理器
     */
    @Bean
    public DefaultWebSecurityManager securityManager(CookieRememberMeManager rememberMeManager, CacheManager cacheShiroManager, SessionManager sessionManager) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setAuthenticator(modularRealmAuthenticator());

        List<Realm> realms=new ArrayList<>();
        securityManager.setRealms(realms);

        securityManager.setCacheManager(cacheShiroManager);

        securityManager.setRememberMeManager(rememberMeManager);
        securityManager.setSessionManager(sessionManager);
        return securityManager;
    }


    /**
     * spring session管理器（多机环境）
     */
    @Bean
    public ServletContainerSessionManager servletContainerSessionManager() {
        return new ServletContainerSessionManager();
    }

    /**
     * session管理器(单机环境) 使用cookie存储缓存。。如果多级请注释
     */
    @Bean
    public DefaultWebSessionManager defaultWebSessionManager(CacheManager cacheShiroManager, XProProperties xProProperties) {
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        sessionManager.setCacheManager(cacheShiroManager);
        sessionManager.setSessionValidationInterval(xProProperties.getSessionValidationInterval() * 1000);
        sessionManager.setGlobalSessionTimeout(xProProperties.getSessionInvalidateTime() * 1000);
        sessionManager.setDeleteInvalidSessions(true);
        sessionManager.setSessionValidationSchedulerEnabled(true);
        Cookie cookie = new SimpleCookie(ShiroHttpSession.DEFAULT_SESSION_ID_NAME);
        cookie.setName("shiroCookie");
        cookie.setHttpOnly(true);
        sessionManager.setSessionIdCookie(cookie);
        return sessionManager;
    }



    /**
     * 缓存管理器 使用Ehcache实现 如果使用redis则注释下面内容！！！！ 
     */
    @Bean
    public CacheManager getCacheShiroManager(EhCacheManagerFactoryBean ehcache) {
        EhCacheManager ehCacheManager = new EhCacheManager();
        ehCacheManager.setCacheManager(ehcache.getObject());
        return ehCacheManager;
    }



    /**
     * 项目自定义的Realm
     */
    @Bean
    public ShiroDbRealm shiroDbRealm() {
        return new ShiroDbRealm();
    }

    @Bean
    public ShiroTockenRealm shiroTockenRealm( ) {
        return new ShiroTockenRealm();
    }

    @Bean
    public ShiroJwtRealm shiroJwtRealm( ) {
        return new ShiroJwtRealm();
    }

    /**
     * 系统自带的Realm管理，主要针对多realm
     * */
    @Bean
    public ModularRealmAuthenticator modularRealmAuthenticator(){
        ModularRealmAuthenticator modularRealmAuthenticator=new ModularRealmAuthenticator();
        modularRealmAuthenticator.setAuthenticationStrategy(new AtLeastOneSuccessfulStrategy());
        return modularRealmAuthenticator;
    }
    /**
     * rememberMe管理器, cipherKey生成见{@code Base64Test.java}
     */
    @Bean
    public CookieRememberMeManager rememberMeManager(SimpleCookie rememberMeCookie) {
        CookieRememberMeManager manager = new CookieRememberMeManager();
        manager.setCipherKey(Base64.decode("Z3VucwAAAAAAAAAAAAAAAA=="));
        manager.setCookie(rememberMeCookie);
        return manager;
    }

    /**
     * 记住密码Cookie
     */
    @Bean
    public SimpleCookie rememberMeCookie() {
        SimpleCookie simpleCookie = new SimpleCookie("rememberMe");
        simpleCookie.setHttpOnly(true);
        simpleCookie.setMaxAge(7 * 24 * 60 * 60);//7天
        return simpleCookie;
    }


    /**
     * 在方法中 注入 securityManager,进行代理控制
     */
    @Bean
    public MethodInvokingFactoryBean methodInvokingFactoryBean(DefaultWebSecurityManager securityManager) {
        MethodInvokingFactoryBean bean = new MethodInvokingFactoryBean();
        bean.setStaticMethod("org.apache.shiro.SecurityUtils.setSecurityManager");
        bean.setArguments(new Object[]{securityManager});
        return bean;
    }

    /**
     * 保证实现了Shiro内部lifecycle函数的bean执行
     */
    @Bean
    public LifecycleBeanPostProcessor lifecycleBeanPostProcessor() {
        return new LifecycleBeanPostProcessor();
    }

    /**
     * 启用shrio授权注解拦截方式，AOP式方法级权限检查
     */
    @Bean
    @DependsOn(value = "lifecycleBeanPostProcessor") //依赖其他bean的初始化
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        return new DefaultAdvisorAutoProxyCreator();
    }

    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(DefaultWebSecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor =
                new AuthorizationAttributeSourceAdvisor();
        authorizationAttributeSourceAdvisor.setSecurityManager(securityManager);
        return authorizationAttributeSourceAdvisor;
    }

}

```





