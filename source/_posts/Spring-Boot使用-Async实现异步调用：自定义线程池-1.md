title: Spring Boot使用@Async实现异步调用：自定义线程池
author: RolandLee
date: 2019-08-21 10:53:58
toc: true
tags:
---
## Spring Boot使用@Async实现异步调用：自定义线程池

> 如果通过自定义线程池的方式来控制异步调用的并发。


### 定义线程池

第一步，先在Spring Boot主类中定义一个线程池，比如：


<!--more-->

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @EnableAsync
    @Configuration
    class TaskPoolConfig {
       @Bean("asyncExecutor")
        public Executor taskExecutor() {
            ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
            //设置核心线程数
            executor.setCorePoolSize(10);
            //设置最大线程数
            executor.setMaxPoolSize(20);
            //线程池所使用的缓冲队列
            executor.setQueueCapacity(200);
            executor.setKeepAliveSeconds(60);
            //  线程名称前缀
            executor.setThreadNamePrefix("asyncExecutor-");
            executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
            //用来设置线程池关闭的时候等待所有任务都完成再继续销毁其他的Bean，这样这些异步任务的销毁就会先于Redis线程池的销毁。 //等待任务在关机时完成--表明等待所有线程执行完
            executor.setWaitForTasksToCompleteOnShutdown(true);
            //该方法用来设置线程池中任务的等待时间，如果超过这个时候还没有销毁就强制销毁，以确保应用最后能够被关闭，而不是阻塞住。 // 等待时间 （默认为0，此时立即停止），并没等待xx秒后强制停止
            executor.setAwaitTerminationSeconds(180);
            // 初始化线程
            executor.initialize();
            return executor;
        }

}
```

上面我们通过使用`ThreadPoolTaskExecutor`创建了一个线程池，同时设置了以下这些参数：

- 核心线程数10：线程池创建时候初始化的线程数
- 最大线程数20：线程池最大的线程数，只有在缓冲队列满了之后才会申请超过核心线程数的线程
- 缓冲队列200：用来缓冲执行任务的队列
- 允许线程的空闲时间60秒：当超过了核心线程出之外的线程在空闲时间到达之后会被销毁
- 线程池名的前缀：设置好了之后可以方便我们定位处理任务所在的线程池
- 线程池对拒绝任务的处理策略：这里采用了`CallerRunsPolicy`策略，当线程池没有处理能力的时候，该策略会直接在 execute 方法的调用线程中运行被拒绝的任务；如果执行程序已关闭，则会丢弃该任务


### 使用线程池

在定义了线程池之后，我们如何让异步调用的执行任务使用这个线程池中的资源来运行呢？方法非常简单，我们只需要在`@Async`注解中指定线程池名即可，比如：

```java
@Slf4j
@Component
public class Task {

    public static Random random = new Random();

    @Async("taskExecutor")
    public void doTaskOne() throws Exception {
        log.info("开始做任务一");
        long start = System.currentTimeMillis();
        Thread.sleep(random.nextInt(10000));
        long end = System.currentTimeMillis();
        log.info("完成任务一，耗时：" + (end - start) + "毫秒");
    }

    @Async("taskExecutor")
    public void doTaskTwo() throws Exception {
        log.info("开始做任务二");
        long start = System.currentTimeMillis();
        Thread.sleep(random.nextInt(10000));
        long end = System.currentTimeMillis();
        log.info("完成任务二，耗时：" + (end - start) + "毫秒");
    }

    @Async("taskExecutor")
    public void doTaskThree() throws Exception {
        log.info("开始做任务三");
        long start = System.currentTimeMillis();
        Thread.sleep(random.nextInt(10000));
        long end = System.currentTimeMillis();
        log.info("完成任务三，耗时：" + (end - start) + "毫秒");
    }

}
```


### 单元测试

最后，我们来写个单元测试来验证一下

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
public class ApplicationTests {

    @Autowired
    private Task task;

    @Test
    public void test() throws Exception {

        task.doTaskOne();
        task.doTaskTwo();
        task.doTaskThree();
        Thread.currentThread().join();
    }

}
```

执行上面的单元测试，我们可以在控制台中看到所有输出的线程名前都是之前我们定义的线程池前缀名开始的，说明我们使用线程池来执行异步任务的试验成功了！


```java
2018-03-27 22:01:15.620  INFO 73703 --- [ taskExecutor-1] com.didispace.async.Task                 : 开始做任务一
2018-03-27 22:01:15.620  INFO 73703 --- [ taskExecutor-2] com.didispace.async.Task                 : 开始做任务二
2018-03-27 22:01:15.620  INFO 73703 --- [ taskExecutor-3] com.didispace.async.Task                 : 开始做任务三
2018-03-27 22:01:18.165  INFO 73703 --- [ taskExecutor-2] com.didispace.async.Task                 : 完成任务二，耗时：2545毫秒
2018-03-27 22:01:22.149  INFO 73703 --- [ taskExecutor-3] com.didispace.async.Task                 : 完成任务三，耗时：6529毫秒
2018-03-27 22:01:23.912  INFO 73703 --- [ taskExecutor-1] com.didispace.async.Task                 : 完成任务一，耗时：8292毫秒
```

### 完整示例：

读者可以根据喜好选择下面的两个仓库中查看`Chapter4-1-3`项目：

- [Github：https://github.com/dyc87112/SpringBoot-Learning/](<https://github.com/dyc87112/SpringBoot-Learning/>)
- [Gitee：https://gitee.com/didispace/SpringBoot-Learning/](<https://gitee.com/didispace/SpringBoot-Learning/>)

<!-- -->

