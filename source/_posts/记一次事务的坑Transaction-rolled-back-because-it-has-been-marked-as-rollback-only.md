title: 记一次事务的坑 Transaction rolled back because it has been marked as rollback-only
author: RolandLee
tags:
  - 事务
categories:
  - 事务
date: 2019-05-06 19:55:00
---
最近在项目中发现了一则报错：“org.springframework.transaction.UnexpectedRollbackException: Transaction rolled back because it has been marked as rollback-only”。根据报错信息来看是spring框架中的事务管理报错：事务回滚了，因为它被标记为回滚状态。

#### 报错原因


**多层嵌套事务中，如果使用了默认的事务传播方式，当内层事务抛出异常，外层事务捕捉并正常执行完毕时，就会报出rollback-only异常。**
<!--more-->

spring框架是使用AOP的方式来管理事务，如果一个被事务管理的方法正常执行完毕，方法结束时spring会将方法中的sql进行提交。如果方法执行过程中出现异常，则回滚。spring框架的默认事务传播方式是PROPAGATION_REQUIRED：如果当前没有事务，就新建一个事务，如果已经存在一个事务中，加入到这个事务中。
在项目中，一般我们都会使用默认的传播方式，这样无论外层事务和内层事务任何一个出现异常，那么所有的sql都不会执行。在嵌套事务场景中，内层事务的sql和外层事务的sql会在外层事务结束时进行提交或回滚。如果内层事务抛出异常e，在内层事务结束时，spring会把事务标记为“rollback-only”。这时如果外层事务捕捉了异常e，那么外层事务方法还会继续执行代码，直到外层事务也结束时，spring发现事务已经被标记为“rollback-only”，但方法却正常执行完毕了，这时spring就会抛出“org.springframework.transaction.UnexpectedRollbackException: Transaction rolled back because it has been marked as rollback-only”。
代码示例如下：

```
Class ServiceA {
    @Resource(name = "serviceB")
    private ServiceB b;
    
    @Transactional
    public void a() {
        try {
            b.b()
        } catch (Exception ignore) {
        }
    }
}

Class ServiceB {
    @Transactional
    public void b() {
        throw new RuntimeException();
    }
}
```


当调用a()时，就会报出“rollback-only”异常。


#### 解决方案
- 如果希望内层事务抛出异常时中断程序执行，直接在外层事务的catch代码块中抛出e.
- 如果希望程序正常执行完毕，并且希望外层事务结束时全部提交，需要在内层事务中做异常捕获处理。
- 如果希望内层事务回滚，但不影响外层事务提交，需要将内层事务的传播方式指定为PROPAGATION_NESTED。注：PROPAGATION_NESTED基于数据库savepoint实现的嵌套事务，外层事务的提交和回滚能够控制嵌内层事务，而内层事务报错时，可以返回原始savepoint，外层事务可以继续提交。



在我的项目中之所以会报“rollback-only”异常的根本原因是代码风格不一致的原因。外层事务对错误的处理方式是返回true或false来告诉上游执行结果，而内层事务是通过抛出异常来告诉上游（这里指外层事务）执行结果，这种差异就导致了“rollback-only”异常。虽然最后事务依然是回滚了，不影响程序对sql的处理，但外层事务的上游本期望返回true和false，却收到了UnexpectedRollbackException异常，(╯￣Д￣)╯︵ ┻━┻。


##### 附：事务传播方式
------
@see org.springframework.transaction.annotation.Propagation


| 事务传播方式  |	说明  | 
| --------    | -----  |
| PROPAGATION_REQUIRED     |   如果当前没有事务，就新建一个事务，如果已经存在一个事务中，加入到这个事务中。这是默认的传播方式  |
| PROPAGATION_SUPPORTS        |    支持当前事务，如果当前没有事务，就以非事务方式执行
   |
| PROPAGATION_MANDATORY |  使用当前的事务，如果当前没有事务，就抛出异常 |
| PROPAGATION_REQUIRES_NEW |  新建事务，如果当前存在事务，把当前事务挂起 |
| PROPAGATION_NOT_SUPPORTED |  以非事务方式执行操作，如果当前存在事务，就把当前事务挂起 |
| PROPAGATION_NEVER |  	以非事务方式执行，如果当前存在事务，则抛出异常 |
| PROPAGATION_SUPPORTS |  	支持当前事务，如果当前没有事务，就以非事务方式执行。 |
| PROPAGATION_NESTED |  	如果当前存在事务，则在嵌套事务内执行。如果当前没有事务，则执行与PROPAGATION_REQUIRED类似的操作。 |