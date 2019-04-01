---
title: MyBatis二级缓存使用
date: 2019-03-27 09:40:08
tags:
- Java
categories:
- Spring Boot
---
- 注意点：
- 在最新的3.x版本，实现二级缓存的配置也有了一些改变。
- 官方建议在service使用缓存，但是你也可以直接在mapper层缓存，这里的二级缓存就是直接在Mapper层进行缓存操作
<!-- more -->
#### Mybatis的二级缓存实现也十分简单，只要在springboot的配置文件打开二级缓存，即
```
mybatis-plus:
  configuration:
    cache-enabled: true
```
#### 缓存接口的实现 
```
public class MybatisRedisCache implements Cache {


    // 读写锁
    private final ReadWriteLock readWriteLock = new ReentrantReadWriteLock(true);

	//这里使用了redis缓存，使用springboot自动注入
	@Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private String id;

    public MybatisRedisCache(final String id) {
        if (id == null) {
            throw new IllegalArgumentException("Cache instances require an ID");
        }
        this.id = id;
    }

    @Override
    public String getId() {
        return this.id;
    }

    @Override
    public void putObject(Object key, Object value) {
        if (redisTemplate == null) {
        //由于启动期间注入失败，只能运行期间注入，这段代码可以删除
            redisTemplate = (RedisTemplate<String, Object>) ApplicationContextRegister.getApplicationContext().getBean("RedisTemplate");
        }
        if (value != null) {
            redisTemplate.opsForValue().set(key.toString(), value);
        }
    }

    @Override
    public Object getObject(Object key) {
        try {
            if (key != null) {
                return redisTemplate.opsForValue().get(key.toString());
            }
        } catch (Exception e) {
            log.error("缓存出错 ");
        }
        return null;
    }

    @Override
    public Object removeObject(Object key) {
        if (key != null) {
            redisTemplate.delete(key.toString());
        }
        return null;
    }

    @Override
    public void clear() {
        log.debug("清空缓存");
        if (redisTemplate == null) {
            redisTemplate = (RedisTemplate<String, Object>) ApplicationContextRegister.getApplicationContext().getBean("functionDomainRedisTemplate");
        }
        Set<String> keys = redisTemplate.keys("*:" + this.id + "*");
        if (!CollectionUtils.isEmpty(keys)) {
            redisTemplate.delete(keys);
        }
    }

    @Override
    public int getSize() {
        Long size = redisTemplate.execute((RedisCallback<Long>) RedisServerCommands::dbSize);
        return size.intValue();
    }

    @Override
    public ReadWriteLock getReadWriteLock() {
        return this.readWriteLock;
    }
}
```

#### mapper.xml文件声明缓存，这里3.x只需要这样配置
```
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.zsy.mapper.CarouselMapper">
    <cache-ref namespace="com.zsy.mapper.CarouselMapper"/>
</mapper>
```

##### Mapper接口使用注解
```
@Repository
@CacheNamespace(implementation=MybatisRedisCache.class,eviction=MybatisRedisCache.class)
public interface CarouselMapper extends BaseMapper<Carousel> {}
```
