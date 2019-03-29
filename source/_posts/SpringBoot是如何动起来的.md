---
title: SpringBoot是如何动起来的
date: 2019-03-28 09:40:08
tags:
- Java
categories:
- Spring Boot
---

### 程序入口
<!-- more -->

```
## SpringBoot是如何动起来的

### 程序入口
```
 SpringApplication.run(BeautyApplication.class, args);
```

#### 执行此方法来加载整个SpringBoot的环境。

### 1. 从哪儿开始？
- SpringApplication.java
```
    	/**
	 * Run the Spring application, creating and refreshing a new
	 * {@link ApplicationContext}.
	 * @param args the application arguments (usually passed from a Java main method)
	 * @return a running {@link ApplicationContext}
	 */
	public ConfigurableApplicationContext run(String... args) {
		//...
  }
```
#### 调用SpringApplication.java 中的 run 方法，目的是加载Spring Application，同时返回 ApplicationContext。

### 2. 执行了什么？
#### 2.1 计时
##### 记录整个Spring Application的加载时间！
```
StopWatch stopWatch = new StopWatch();
stopWatch.start();
// ...
stopWatch.stop();
if (this.logStartupInfo) {
	new StartupInfoLogger(this.mainApplicationClass)
			.logStarted(getApplicationLog(), stopWatch);
}
```
#### 2.2 声明
##### 指定 java.awt.headless，默认是true 一般是在程序开始激活headless模式，告诉程序，现在你要工作在Headless mode下，就不要指望硬件帮忙了，你得自力更生，依靠系统的计算能力模拟出这些特性来。

```
private void configureHeadlessProperty() {
	System.setProperty(SYSTEM_PROPERTY_JAVA_AWT_HEADLESS, System.getProperty(
			SYSTEM_PROPERTY_JAVA_AWT_HEADLESS, Boolean.toString(this.headless)));
}
```
#### 2.4 配置监听并发布应用启动事件
##### SpringApplicationRunListener 负责加载 ApplicationListener事件。
```
SpringApplicationRunListeners listeners = getRunListeners(args);
// 开始
listeners.starting();
// 处理所有 property sources 配置和 profiles 配置，准备环境，分为标准 Servlet 环境和标准环境
ConfigurableEnvironment environment = prepareEnvironment(listeners,applicationArguments);
// 准备应用上下文
prepareContext(context, environment, listeners, applicationArguments,printedBanner);
// 完成
listeners.started(context);
// 异常
handleRunFailure(context, ex, exceptionReporters, listeners);
// 执行
listeners.running(context);


```
##### getRunListeners 中根据 type = SpringApplicationRunListener.class 去拿到了所有的 Listener 并根据优先级排序。
对应的就是 META-INF/spring.factories 文件中的 org.springframework.boot.SpringApplicationRunListener=org.springframework.boot.context.event.EventPublishingRunListener

```
private <T> Collection<T> getSpringFactoriesInstances(Class<T> type,
			Class<?>[] parameterTypes, Object... args) {
		ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
		// Use names and ensure unique to protect against duplicates
		Set<String> names = new LinkedHashSet<>(
				SpringFactoriesLoader.loadFactoryNames(type, classLoader));
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes,
				classLoader, args, names);
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}
复制代码
```

##### 在 ApplicationListener 中 , 可以针对任何一个阶段插入处理代码。

```
public interface SpringApplicationRunListener {

	/**
	 * Called immediately when the run method has first started. Can be used for very
	 * early initialization.
	 */
	void starting();

	/**
	 * Called once the environment has been prepared, but before the
	 * {@link ApplicationContext} has been created.
	 * @param environment the environment
	 */
	void environmentPrepared(ConfigurableEnvironment environment);

	/**
	 * Called once the {@link ApplicationContext} has been created and prepared, but
	 * before sources have been loaded.
	 * @param context the application context
	 */
	void contextPrepared(ConfigurableApplicationContext context);

	/**
	 * Called once the application context has been loaded but before it has been
	 * refreshed.
	 * @param context the application context
	 */
	void contextLoaded(ConfigurableApplicationContext context);

	/**
	 * The context has been refreshed and the application has started but
	 * {@link CommandLineRunner CommandLineRunners} and {@link ApplicationRunner
	 * ApplicationRunners} have not been called.
	 * @param context the application context.
	 * @since 2.0.0
	 */
	void started(ConfigurableApplicationContext context);

	/**
	 * Called immediately before the run method finishes, when the application context has
	 * been refreshed and all {@link CommandLineRunner CommandLineRunners} and
	 * {@link ApplicationRunner ApplicationRunners} have been called.
	 * @param context the application context.
	 * @since 2.0.0
	 */
	void running(ConfigurableApplicationContext context);

	/**
	 * Called when a failure occurs when running the application.
	 * @param context the application context or {@code null} if a failure occurred before
	 * the context was created
	 * @param exception the failure
	 * @since 2.0.0
	 */
	void failed(ConfigurableApplicationContext context, Throwable exception);

}

```
#### 3. 每个阶段执行的内容
##### 3.1 listeners.starting();
###### 在加载Spring Application之前执行，所有资源和环境未被加载。
##### 3.2 prepareEnvironment(listeners, applicationArguments);
###### 创建 ConfigurableEnvironment； 将配置的环境绑定到Spring Application中；
```
private ConfigurableEnvironment prepareEnvironment(
			SpringApplicationRunListeners listeners,
			ApplicationArguments applicationArguments) {
		// Create and configure the environment
		ConfigurableEnvironment environment = getOrCreateEnvironment();
		configureEnvironment(environment, applicationArguments.getSourceArgs());
		listeners.environmentPrepared(environment);
		bindToSpringApplication(environment);
		if (this.webApplicationType == WebApplicationType.NONE) {
			environment = new EnvironmentConverter(getClassLoader())
					.convertToStandardEnvironmentIfNecessary(environment);
		}
		ConfigurationPropertySources.attach(environment);
		return environment;
	}
```
##### 3.3 prepareContext
###### 配置忽略的Bean；
```
private void configureIgnoreBeanInfo(ConfigurableEnvironment environment) {
		if (System.getProperty(
				CachedIntrospectionResults.IGNORE_BEANINFO_PROPERTY_NAME) == null) {
			Boolean ignore = environment.getProperty("spring.beaninfo.ignore",
					Boolean.class, Boolean.TRUE);
			System.setProperty(CachedIntrospectionResults.IGNORE_BEANINFO_PROPERTY_NAME,
					ignore.toString());
		}
	}
```
###### 打印日志-加载的资源
```
Banner printedBanner = printBanner(environment);
```
###### 根据不同的WebApplicationType创建Context
```
context = createApplicationContext();
```
##### 3.4 refreshContext
###### 支持定制刷新
```
/**
	 * Register a shutdown hook with the JVM runtime, closing this context
	 * on JVM shutdown unless it has already been closed at that time.
	 * <p>This method can be called multiple times. Only one shutdown hook
	 * (at max) will be registered for each context instance.
	 * @see java.lang.Runtime#addShutdownHook
	 * @see #close()
	 */
	void registerShutdownHook();
```
##### 3.5 afterRefresh
###### 刷新后的实现方法暂未实现
```
/**
	 * Called after the context has been refreshed.
	 * @param context the application context
	 * @param args the application arguments
	 */
	protected void afterRefresh(ConfigurableApplicationContext context,
			ApplicationArguments args) {
	}
```
##### 3.6 listeners.started(context);
###### 到此为止， Spring Application的环境和资源都加载完毕了； 发布应用上下文启动完成事件； 执行所有 Runner 运行器 - 执行所有 ApplicationRunner 和 CommandLineRunner 这两种运行器

```
// 启动
callRunners(context, applicationArguments);
```
##### 3.7 listeners.running(context);
###### 触发所有 SpringApplicationRunListener 监听器的 running 事件方法