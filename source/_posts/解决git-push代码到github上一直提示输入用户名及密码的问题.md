title: 解决git push代码到github上一直提示输入用户名及密码的问题
author: RolandLee
tags: []
categories:
  - git
date: 2019-04-29 10:12:00
---
### 我们将github上的工程clone到本地后，修改完代码后想要push到github，但一直会有提示输入用户名及密码.

#### 原因分析

- 出现这种情况的原因是我们使用了http的方式clone代码到本地，相应的，也是使用http的方式将代码push到服务器。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190429101327.png)

如图所示，在github系统上克隆代码的地址默认采用的是http的方式，我们一般这样clone代码：

`git clone https://github.com/yychuyu/linux-system-programming.git`

这就容易导致这个问题的出现。

而如果采用ssh方式的话，是这样clone代码的：

`git clone git@github.com:yychuyu/linux-system-programming.git`


<!--more-->
### 解决办法

- 解决办法很简单，将http方式改为ssh方式即可。

- 先查看当前方式：

 `git remote -v`
 
 
 ![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190429101533.png)
 
 
- 把http方式改为ssh方式。先移除旧的http的origin：


`git remote rm origin`

 

- 再添加新的ssh方式的origin：

`git remote add origin git@github.com:yunlongn/myHexo.git`

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190429101705.png)

- 改动完之后直接执行git push是无法推送代码的，需要设置一下上游要跟踪的分支，与此同时会自动执行一次git push命令，此时已经不用要求输入用户名及密码啦！

`git push --set-upstream origin master `