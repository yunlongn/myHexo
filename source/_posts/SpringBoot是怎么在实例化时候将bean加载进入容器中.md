title: SpringBoot是怎么在实例化时候将bean加载进入容器中
author: RolandLee
tags:
  - SpringBoot
categories:
  - java
date: 2019-04-23 09:34:00
---
之前写过的很多spring文章，都是基于应用方面的，这次的话，就带大家来一次对spring的源码追踪，看一看spring到底是怎么进行的初始化，如何创建的bean，相信很多刚刚接触spring的朋友，或者没什么时间的朋友都很想知道spring到底是如何工作的。

 

首先，按照博主一贯的作风，当然是使用最新的spring版本，这次就使用spring4.2.5...其次，也是为了方便，采用spring-boot-1.3.3进行追踪，和spring 4.2.5是相同的。

不用担心框架不同，大家如果是使用的xml方式进行配置的话，可以去你的ContextListener里面进行追踪，spring-boot只是对 spring所有框架进行了一个集成，如果实在进行不了前面几个步骤的话，可以从文章第6步的AbstractApplicationContext开始看起， 这里就是spring最最重要的部分。
<!--more-->
 

1、默认的spring启动器，DemoApplication：

该方法是spring-boot的启动器，我们进入。

 

2、进入了SpringApplication.java：

 

这里创建了一个SpringApplication，执行run方法，返回的是一个ConfigurableApplicationContext，这只是一个接口而已，根据名称来看，称作可配置的应用程序上下文。

 

3、我们不看new SpringApplication(Sources)过程了，有兴趣可以自己研究一下，里面主要是判断了当前的运行环境是否为web，当然，博主这次的环境是web，然后看run：

try语句块内的内容最为重要，因为创建了我们的context对象，此时需要进入的方法为

context = createAndRefreshContext(listeners, applicationArguments)

 

4、 接着往下看，看到context = createApplicationContext这行，进入，因为我们刚刚在创建SpringApplication时并没有给 this.applicationContextClass赋值，所以此时this.applicationContextClass = null，那么便会创建指定的两个applicationContext中的一个，返回一个刚刚创建的context，这个context便是我们的基 础，因为门现在为web环境，所以创建的context为 AnnotationConfigEmbeddedWebApplicationContext。

 

5、第4步创建了一个context，需要指出的是，context里面默认带有一个beanFactory，而这个beanFactory的类型为DefaultListableBeanFactory。

然后继续看我们的createAndRefreshContext方法，忽略别的代码，最重要的地方为refresh(context)：

 

6、进入refresh(context)，不管你进入那个实现类，最终进入的都是AbstractApplicationContext.java：

该方法中，我们这次需要注意的地方有两个：

1、invokeBeanFactoryPostProcessors(beanFactory);

2、finishBeanFactoryInitialization(beanFactory);

两处传入的beanFactory为上面的context中的DefaultListableBeanFactory。

 

7、进入invokeBeanFactoryPostProcessors(beanFactory)：

然后找到第98行的invokeBeanDefinitionRegistryPostProcessors(priorityOrderedPostProcessors, registry)，该方法看名字就是注册bean，进入。

 

8、 该方法内部有一个for循环，进入内部方法 postProcessor.postProcesBeanDefinitionRegistry(registry)，此时传入的registry就是我们context中的beanfactory，因为其实现了BeanDefinitionRegistry接口。而此时的postProcessor实现类为ConfigurationClassPostProcessor.java。

 

 

9、进入之后直接看最后面的一个方法，名称为processConfigBeanDefinitions(registry)，翻译过来就是配置beanDefinitions的流程。

 

10、在processConfigBeanDefinitions(registry)里，314行创建了一个parser解析器，用来解析bean。并在第321行进行了调用，那么我们进入parse方法。

 

11、进入parse方法之后，会发现内层还有parse方法，不要紧，继续进入内层的parse，然后会发现它们均调用了processConfigurationClass(ConfigurationClass configClass)方法：


12、 在processConfigurationClass(ConfigurationClass configClass)方法内，找到do循环，然后进入doProcessConfigurationClass方法，此时，便会出现许多我们常用的注 解了，spring会找到这些注解，并对它们进行解析。例如第268行的componentScanParser.parse方法，在这里会扫描我们的注 解类，并将带有@bean注解的类进行registry。

 

13、进入 componentScanParser.parse，直接进入结尾的scannner.doScan，然后便会扫描basepackages，并将扫描 到的bean生成一个一个BeanDefinitionHolder，BeanDefinitionHolder中包含有我们bean的一些相关信息、以 及spring赋予其的额外信息，例如别名：

 

14、 虽然已经创建了BeanDefinitionHolder，但并没有添加到我们的beanFactory中，所以需要执行263行的 registerBeanDefinition(definitionHolder, this.registry)，进入后继续跳转：

然后看registry.registerBeanDefinition方法，因为我们的beanFactory为DefaultListableBeanFactory，所以进入对应的实现类。

 

15、在进入的registry.registerBeanDefinition方法中，关键点在851行或871行：

this.beanDefinitionMap.put(beanName, beanDefinition);

这个方法将扫描到的bean存放到了一个beanName为key、beanDefinition为value的map中，以便执行DI(dependency inject)。

 

16、现在我们回到第6步的第二条分支，此处是非懒加载的bean初始化位置，注意，我们之前只是对bean的信息进行了获取，然后创建的对象为BeanDefinition，却不是bean的实例，而现在则是创建bean的实例。

进入方法后找到829行的getBean(weaverAwareName)：

 

17、getBean => getBeanFactory.getBean => doGetBean，然后找到306行的createBean，这里不讲语法，不要奇怪为什么这个createBean不能进入实现代码。

 

18、这之后的代码都比较容易追踪，直接给一条调用链：

doCreateBean(482) => createBeanInstance(510) => autowireConstructor(1034,1046) => autowireConstructor(1143) => instantiate(267) => instantiateClass(122) => newInstance(147)

括号内的数字代表行号，方便大家进行追踪，最后看到是反射newInstance取得的对象实例：

 

平时总说spring反射获取bean，其实也就是听别人这么说而已，还是自己见到才踏实，万一别人问你是不是通过Class.forName获取的呢？

 

19、属性注入，位于第18条的doCreateBean方法内，找到第543行，populateBean便译为填充Bean，进入后便能看到和我们平时代码对应的条件了，例如byType注入、byName注入：

这里还没有进行依赖注入，仅仅是准备一些必要的信息，找到1214行的ibp.postProcessPropertyValues方法
 
20、这里有很多实现类可以选择，因为博主平时是使用@Autowired注解，所以这里选择AutowiredAnnotationBeanPostProcessor，如果你使用@Resource的话，就选择CommonBeanPostProcessor：

 
21、进入该方法后，首先获取一些元信息metadata，通过findAutowiringMetadata获取，然后调用metadata.inject进行注入：

 
22、继续进入inject方法后，继续找到88行的element.inject方法并进入，实现类选择AutowiredFieldElement，该类是一个内部类：

在这个方法中，最重要的内容在第567~570行内，我们可以看到，这里其实也就是jdk的反射特性。
至此，spring的 bean初始化->注入 便完成了。

这次的博客内容很长(其实是自己追踪代码时间太久)，感谢大家耐心看完，能有所收获的话便最好不过了。另外，若是有什么补充的话欢迎进行回复。