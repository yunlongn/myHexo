title: 启动时查看配置文件application.yml
author: RolandLee
tags: []
categories: []
date: 2020-03-02 09:29:00
---
## Spring Boot Application 事件和监听器
- 在多环境的情况下。 可能需要切换配置文件的一个对应的属性来切换环境
- 面临的问题就是 如何在springboot加载完配置文件的时候就可以立即校验对应的属性值

### SmartApplicationListener实现监听解耦
- 我们只需在加载完成之后去加入一个监听器。 就可以得到application.yml的内容。 不然再这个事件之前。都是拿不到对应的内容的

<!--more-->

### 一、SmartApplicationListener介绍
- Spring ApplicationEvent以及对应的Listener提供了一个事件监听、发布订阅的实现，内部实现方式是观察者模式，可以解耦业务系统之间的业务，提供系统的可拓展性、复用性以及可维护性。
- 在application.yml文件读取完会触发一个事件ConfigFileApplicationListener 该监听器实现文件的读取。
- SmartApplicationListener是高级监听器，是ApplicationListener的子类，能够实现有序监听
- SmartApplicationListener提供了两个方法：

```java
/**
 *  指定支持哪些类型的事件
 */
boolean supportsEventType(Class<? extends ApplicationEvent> var1);

/**
 *  指定支持发生事件所在的类型
 */
boolean supportsSourceType(Class<?> var1);
```
### 二、ConfigFileApplicationListener
- ConfigFileApplicationListener是用来 读取配置文件的。 可以这样来粗劣的介绍一下
- 详情可以请看 [springboot启动时是如何加载配置文件application.yml文件](https://blog.csdn.net/chengkui1990/article/details/79866499)

### 三、直奔主题
- 新增一个监听器 既然我们要在配置文件加载之后搞事情那么我们直接复制ConfigFileApplicationListener 的实现方式
- 删除一下不需要处理的操作（大概就是以下代码） 并且order在ConfigFileApplicationListener 之后

```java
public class AfterConfigListener implements SmartApplicationListener,Ordered {

    public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
        return ApplicationEnvironmentPreparedEvent.class.isAssignableFrom(eventType) || ApplicationPreparedEvent.class.isAssignableFrom(eventType);
    }
    public void onApplicationEvent(ApplicationEvent event) {
        if (event instanceof ApplicationEnvironmentPreparedEvent) {
        }
        if (event instanceof ApplicationPreparedEvent) {
        }
    }
    @Override
    public int getOrder() {
        // 写在加载配置文件之后
        return ConfigFileApplicationListener.DEFAULT_ORDER + 1;
    }
}
```

- 这样子就完成了配置文件之后的代码监听。 SmartApplicationListener又是实现了ApplicationListener的监听的，那么我们可以在onApplicationEvent执行代码。
- 完善代码如下。 监听并且获取配置文件内容

```java
public class AfterConfigListener implements SmartApplicationListener,Ordered {

    public boolean supportsEventType(Class<? extends ApplicationEvent> eventType) {
        return ApplicationEnvironmentPreparedEvent.class.isAssignableFrom(eventType) || ApplicationPreparedEvent.class.isAssignableFrom(eventType);
    }

    public void onApplicationEvent(ApplicationEvent event) {

        if (event instanceof ApplicationEnvironmentPreparedEvent) {
            String banks = ((ApplicationEnvironmentPreparedEvent) event).getEnvironment().getProperty("spring.name");
            if (ToolUtil.isEmpty(BankEnum.getValue(banks))) {
                throw new RuntimeException("请检查  com.enums.BankEnum  中是否拥有该banks环境名字！");
            }
        }

        if (event instanceof ApplicationPreparedEvent) {
        }	
    }
    @Override
    public int getOrder() {
        // 写在加载配置文件之后
        return ConfigFileApplicationListener.DEFAULT_ORDER + 1;
    }

}
```

- 并且在main方法中加入该监听器

```
public class XProApplication {

    public static void main(String[] args) {
        SpringApplication springApplication = new SpringApplication(XProApplication.class);
        springApplication.addListeners(new AfterConfigListener());
        springApplication.run(args);
    }

}
```