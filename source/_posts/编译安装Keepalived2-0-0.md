title: 编译安装Keepalived2.0.0
author: RolandLee
tags:
  - linux
categories:
  - 服务器
date: 2019-04-25 16:05:00
---
### 简介

> Keepalived是基于vrrp协议的一款高可用软件。Keepailived有一台主服务器和多台备份服务器，在主服务器和备份服务器上面部署相同的服务配置，使用一个虚拟IP地址对外提供服务，当主服务器出现故障时，虚拟IP地址会自动漂移到备份服务器。
> 
> VRRP（Virtual Router Redundancy Protocol，虚拟路由器冗余协议），VRRP是为了解决静态路由的高可用。VRRP的基本架构虚拟路由器由多个路由器组成，每个路由器都有各自的IP和共同的VRID(0-255)，其中一个VRRP路由器通过竞选成为MASTER，占有VIP，对外提供路由服务，其他成为BACKUP，MASTER以IP组播（组播地址：224.0.0.18）形式发送VRRP协议包，与BACKUP保持心跳连接，若MASTER不可用（或BACKUP接收不到VRRP协议包），则BACKUP通过竞选产生新的MASTER并继续对外提供路由服务，从而实现高可用。


### vrrp协议的相关术语

> 虚拟路由器：Virtual Router 
> 虚拟路由器标识：VRID(0-255)
> 物理路由器：
   > - master  ：主设备
   > - backup  ：备用设备
   > - priority：优先级
> 
> VIP：Virtual IP 
> VMAC：Virutal MAC (00-00-5e-00-01-VRID)
> GraciousARP
<!--more-->

### 安全认证


- 简单字符认证、HMAC机制，只对信息做认证
- MD5（leepalived不支持）

### 工作模式

- 主/备：单虚拟路径器
- 主/主：主/备（虚拟路径器），备/主（虚拟路径器）


### 工作类型

- 抢占式：当出现比现有主服务器优先级高的服务器时，会发送通告抢占角色成为主服务器
- 非抢占式：

### 核心组件

- vrrp stack：vrrp协议的实现
- ipvs wrapper：为集群内的所有节点生成IPVS规则
- checkers：对IPVS集群的各RS做健康状态检测
- 控制组件：配置文件分析器，用来实现配置文件的分析和加载
- IO复用器
- 内存管理组件，用来管理keepalived高可用是的内存管理

### 注意

- 各节点时间必须同步
- 确保各节点的用于集群服务的接口支持MULTICAST通信（组播）


### 安装

```

[root@masga ~]# yum install openssl-devel popt-devel libnl libnl-devel libnfnetlink-devel gcc -y
[root@masga ~]# cd /usr/local/src/
[root@masga src]# wget http://www.keepalived.org/software/keepalived-2.0.0.tar.gz
[root@masga src]# tar zxvf keepalived-2.0.0.tar.gz
[root@masga src]# mkdir -p ../keepalived
[root@masga src]# cd keepalived-2.0.0
[root@masga keepalived-2.0.0]# ./configure --prefix=/usr/local/keepalived
Keepalived configuration
------------------------
Keepalived version       : 2.0.0
Compiler                 : gcc
Preprocessor flags       :  
Compiler flags           : -Wall -Wunused -Wstrict-prototypes -Wextra -Winit-self -g -O2 -D_GNU_SOURCE -fPIE -Wformat -We
rror=format-security -Wp,-D_FORTIFY_SOURCE=2 -fexceptions -fstack-protector-strong --param=ssp-buffer-size=4 -grecord-gcc-switches Linker flags             :  -pie
Extra Lib                :  -lcrypto  -lssl  -lnl
Use IPVS Framework       : Yes
IPVS use libnl           : Yes
IPVS syncd attributes    : No
IPVS 64 bit stats        : No
fwmark socket support    : Yes
Use VRRP Framework       : Yes
Use VRRP VMAC            : Yes
Use VRRP authentication  : Yes
With ip rules/routes     : Yes
Use BFD Framework        : No
SNMP vrrp support        : No
SNMP checker support     : No
SNMP RFCv2 support       : No
SNMP RFCv3 support       : No
DBUS support             : No
SHA1 support             : No
Use Json output          : No
libnl version            : 1
Use IPv4 devconf         : No
Use libiptc              : No
Use libipset             : No
init type                : systemd
Build genhash            : Yes
Build documentation      : No
[root@masga keepalived-2.0.0]# make && make install
[root@masga keepalived-2.0.0]# cp /usr/local/src/keepalived-2.0.0/keepalived/etc/init.d/keepalived /etc/init.d/
[root@masga keepalived-2.0.0]# cp /usr/local/keepalived/etc/sysconfig/keepalived /etc/sysconfig/
[root@masga keepalived-2.0.0]# mkdir /etc/keepalived
[root@masga keepalived-2.0.0]# cp /usr/local/keepalived/etc/keepalived/keepalived.conf /etc/keepalived/
[root@masga keepalived-2.0.0]# cp /usr/local/keepalived/sbin/keepalived /usr/sbin/
[root@masga keepalived-2.0.0]# echo "/etc/init.d/keepalived start" >> /etc/rc.local
[root@masga keepalived-2.0.0]# chmod +x /etc/rc.d/init.d/keepalived
[root@masga keepalived-2.0.0]# chkconfig keepalived on

```







