title: docker命令
author: RolandLee
tags:
  - 基本命令
categories:
  - docker
date: 2019-04-25 21:44:00
---
#### docker基本命令

- `docker logs` 检查排错。如果启动不起容器，可以试着检查排错

- docker安装jenkins及其相关问题解决 https://www.cnblogs.com/youcong/p/10182091.html

- systemctl stop firewalld.service  关闭防火墙

- docker inspect 容器id  查询容器信息

- docker stop 容器id  停止容器id

- docker rm 容器id  删除容器id

- systemctl restart  docker  重启docker容器

- docker exec -it 容器ID /bin/bash 进入容器 

- docker rm $(sudo docker ps -a -q) 删除所有未运行的容器

- docker search elasticsearch 搜索镜像文件 

- docker run 创建并启动一个容器，在run后面加上-d参数，则会创建一个守护式容器在后台运行。

- docker ps -a 查看已经创建的容器

- docker ps -s 查看已经启动的容器

- docker start con_name 启动容器名为con_name的容器

- docker stop con_name 停止容器名为con_name的容器

- docker rm con_name 删除容器名为con_name的容器

- docker rename old_name new_name 重命名一个容器

- docker attach con_name 将终端附着到正在运行的容器名为con_name的容器的终端上面去，前提是创建该容器时指定了相应的sh

- docker logs --tail="10" 容器名称   查询容器日志信息

