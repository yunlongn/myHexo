title: SpringBoot Jar包瘦身 - 跟大文件说再见！
author: RolandLee
tags: []
categories:
  - Spring Boot
date: 2019-07-18 17:20:00
---
# 前言

SpringBoot部署起来配置非常少，如果服务器部署在公司内网，上传速度还行，但是如果部署在公网（阿里云等云服务器上），部署起来实在头疼、就是 编译出来的 Jar 包很大，如果工程引入了许多开源组件（SpringCloud等），那就更大了。这个时候如果想要对线上运行工程有一些微调，则非常痛苦

## 可以用以下方法减少jar内容

## 瘦身准备
### 1、首先我们要对Jar包有一个初步认识，它的内部结构如下

```
example.jar
 |
 +-META-INF
 |  +-MANIFEST.MF
 +-org
 |  +-springframework
 |     +-boot
 |        +-loader
 |           +-<spring boot loader classes>
 +-BOOT-INF
    +-classes
    |  +-mycompany
    |     +-project
    |        +-YourClasses.class
    +-lib  // 依赖库的包
       +-dependency1.jar
       +-dependency2.jar
```
<!--more-->
运行该Jar时默认从BOOT-INF/classes加载class，从BOOT-INF/lib加载所依赖的Jar包。如果想要加入外部的依赖Jar，可以通过设置环境变量LOADER_PATH来实现。


### 如此一来，就可以确认我们的思路了： 

1. 把那些不变的依赖Jar包（比如spring依赖、数据库Driver等，这些在不升级版本的情况下是不会更新的）从Flat Jar中抽离到单独的目录，如libs 

2. 在启动Jar时，设置LOADER_PATH使用上一步的libs
```
java -Dloader.path="libs/" -jar ht-ui-web.jar
```

这样，我们最终打包的jar包体积就大大减少，每次迭代后只需要更新这个精简版的Jar即可。

## 需要在pom文件配置忽略的依赖包。
- 关键需要配置`MANIFEST.MF` 文件中加入lib路径。
- 然后正常启动jar包就可以了。


```
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <configuration>
                    <!--不打包资源文件-->
                    <!--<excludes>-->
                    <!--<exclude>*.**</exclude>-->
                    <!--<exclude>*/*.xml</exclude>-->
                    <!--</excludes>-->
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                            <!--MANIFEST.MF 中 Class-Path 加入前缀-->
                            <classpathPrefix>lib/</classpathPrefix>
                            <!--jar包不包含唯一版本标识-->
                            <useUniqueVersions>false</useUniqueVersions>
                            <!--指定入口类-->
                            <mainClass>com.XProApplication</mainClass>
                        </manifest>
                        <!--<manifestEntries>-->
                        <!--&lt;!&ndash;MANIFEST.MF 中 Class-Path 加入资源文件目录&ndash;&gt;-->
                        <!--<Class-Path>./resources/</Class-Path>-->
                        <!--</manifestEntries>-->
                    </archive>
                    <outputDirectory>${project.build.directory}</outputDirectory>
                </configuration>
            </plugin>
```
## 完整pom文件的内容如下。。
### 配置完毕打包项目就会将lib包和项目包分开放到target中。然后分开上传内容。  以后就可以上传精简的jar包了


````
   <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.1</version>
            <!--打包jar-->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-jar-plugin</artifactId>
                <configuration>
                    <!--不打包资源文件-->
                    <!--<excludes>-->
                    <!--<exclude>*.**</exclude>-->
                    <!--<exclude>*/*.xml</exclude>-->
                    <!--</excludes>-->
                    <archive>
                        <manifest>
                            <addClasspath>true</addClasspath>
                            <!--MANIFEST.MF 中 Class-Path 加入前缀-->
                            <classpathPrefix>lib/</classpathPrefix>
                            <!--jar包不包含唯一版本标识-->
                            <useUniqueVersions>false</useUniqueVersions>
                            <!--指定入口类-->
                            <mainClass>com.XProApplication</mainClass>
                        </manifest>
                        <!--<manifestEntries>-->
                        <!--&lt;!&ndash;MANIFEST.MF 中 Class-Path 加入资源文件目录&ndash;&gt;-->
                        <!--<Class-Path>./resources/</Class-Path>-->
                        <!--</manifestEntries>-->
                    </archive>
                    <outputDirectory>${project.build.directory}</outputDirectory>
                </configuration>
            </plugin>

            <!--拷贝依赖 copy-dependencies-->
            <!--也可以执行mvn copy-dependencies 命令打包依赖-->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-dependencies</id>
                        <phase>package</phase>
                        <goals>
                            <goal>copy-dependencies</goal>
                        </goals>
                        <configuration>
                            <outputDirectory>
                                ${project.build.directory}/lib/
                            </outputDirectory>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

<!--&lt;!&ndash;            拷贝资源文件 copy-resources&ndash;&gt;-->
<!--            <plugin>-->
<!--                <artifactId>maven-resources-plugin</artifactId>-->
<!--                <executions>-->
<!--                    <execution>-->
<!--                        <id>copy-resources</id>-->
<!--                        <phase>package</phase>-->
<!--                        <goals>-->
<!--                            <goal>copy-resources</goal>-->
<!--                        </goals>-->
<!--                        <configuration>-->
<!--                            <resources>-->
<!--                                <resource>-->
<!--                                    <directory>src/main/resources</directory>-->
<!--                                </resource>-->
<!--                            </resources>-->
<!--                            <outputDirectory>${project.build.directory}/resources</outputDirectory>-->
<!--                        </configuration>-->
<!--                    </execution>-->
<!--                </executions>-->
<!--            </plugin>-->

            <!--spring boot repackage，依赖 maven-jar-plugin 打包的jar包 重新打包成 spring boot 的jar包-->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <!--重写包含依赖，包含不存在的依赖，jar里没有pom里的依赖-->
                    <includes>
                        <include>
                            <groupId>null</groupId>
                            <artifactId>null</artifactId>
                        </include>
                    </includes>
                    <layout>ZIP</layout>
                    <!--使用外部配置文件，jar包里没有资源文件-->
                    <addResources>true</addResources>
                    <outputDirectory>${project.build.directory}</outputDirectory>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                        <configuration>
                            <!--配置jar包特殊标识 配置后，保留原文件，生成新文件 *-run.jar -->
                            <!--配置jar包特殊标识 不配置，原文件命名为 *.jar.original，生成新文件 *.jar -->
                            <!--<classifier>run</classifier>-->
                        </configuration>
                    </execution>
                </executions>
            </plugin>
  
    </build>
```