title: 什么是Servlet(原理，从访问到方法)
author: RolandLee
tags:
  - servlet
categories:
  - java
date: 2019-04-17 15:15:00
---
# Servlet简介

Servlet是SUN公司提供的一门用于开发动态WEB资源的技术。SUN公司在其API中提供了一个Servlet接口，用户若想开发一个动态WEB资源(即开发一个Java程序向浏览器输出数据)，需要完成以下2个步骤：

- 编写一个Java类，实现Servlet接口；
- 把开发好的Java类部署到WEB服务器中。

那么我们不仅要问，写好的Servlet会在WEB应用中的什么位置上呢？位置如下如所示。
<!--more-->
![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417151743.png)

提示：按照一种约定俗成的称呼习惯，通常我们也把实现了Servlet接口的Java程序，称之为Servlet。


# Servlet快速入门——使用Servlet向浏览器输出“Hello World” 

阅读Servlet API文档，文档地址是[https://tomcat.apache.org/tomcat-8.5-doc/servletapi/index.html](https://tomcat.apache.org/tomcat-8.5-doc/servletapi/index.html)。文档里面有对Servlet接口的详细描述，如下。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417151950.png)

借助有道翻译为：

> 定义了所有Servlet必须实现的方法。
> Servlet是运行在一个Web服务器里的一个小型Java程序。Servlets通常通过HTTP(超文本传输协议)接收并响> 应来自Web客户端的请求。
> 要实现这个接口，您可以编写一个继承了javax.servlet.GenericServlet的一般的Servlet，或者继承了javax.servlet.http.HttpServlet的HTTP Servlet。
> 这个接口定义了方法来初始化一个Servlet，服务请求，并从服务器删除Servlet。这些被称为生命周期方法> 并且按以下顺序依次调用：
> * Servlet被构造，然后用init方法初始化；
> * 任何来自客户机的请求在service方法中处理；
> * Servlet从服务中移除，调用destroy方法销毁，然后垃圾收集和完成。
> 
> 除了生命周期方法，该接口提供了getServletConfig方法(Servlet可以使用它来得到任何启动信息)和getServletInfo方法(它允许Servlet返回自身的基本信息，比如作者、版本和版权)。


这里面有一个专业术语——**life-cycle methods**，解释过来就是与生命周期相关的方法，即生命周期中的某个特定时刻必定会执行的方法。那么什么是对象的生命周期？什么又是与生命周期相关的方法呢？**对象从创建到销毁经历的过程，称之为对象的生命周期。在对象生命周期过程中，在特定时刻肯定会执行一些特定的方法，这些方法称之为与生命周期相关的方法**。例如，人从出生到死亡经历的过程，为人的一个生命周期，在人生命周期过程中，必定有一些与生命周期息息相关的方法，例如吃饭、上学、结婚等，这些方法在人生命周期过程中某个特定时刻必定会执行，所以这些方法是人生命周期相关的方法。但不是说对象中的所有方法都与生命周期相关，例如人自杀，这个方法不是在生命周期中必定会执行的。
阅读完Servlet API，我们需要解决两个问题：

- 输出Hello Servlet的Java代码应该写在Servlet的哪个方法内？
- 如何向浏览器输出数据？

答案很明显：

- 输出Hello Servlet的Java代码应该写在Servlet的service方法中；
- 通过ServletResponse接口的实例中的getOutputStream方法获得输出流，向http响应对象中写入数据，服务器将http响应对象回送给浏览器，浏览器解析数据并显示。

下面我们正式编写一个入门级的Servlet。首先在Tomcat服务器webapps目录下新建一个Web应用，比如myWeb(Web应用所在目录)，在myWeb目录中新建一个WEB-INF目录，接着在WEB-INF目录下新建一个classes目录，在classes目录中新建一个Java应用程序——FirstServlet.java，代码如下：

```
package cn.liayun;

import java.io.*;
import javax.servlet.*;

public class FirstServlet extends GenericServlet {
	
	public void service(ServletRequest req, ServletResponse res) throws ServletException, java.io.IOException {
		OutputStream out = res.getOutputStream();
		out.write("Hello Servlet!!!".getBytes());
	}
	
}
```

着编译Java应用程序，如图：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417152808.png)

所以，我们需要将Servlet所用Jar包加载到classpath路径下，如下图所示。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417152833.png)

再在WEB-INF目录中新建一个web.xml文件，配置Servlet的访问对外路径。

```
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee
                      http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
  version="3.1">
  
	<servlet>
        <servlet-name>FirstServlet</servlet-name>
        <servlet-class>cn.liayun.FirstServlet</servlet-class>
    </servlet>
	
	<servlet-mapping>
        <servlet-name>FirstServlet</servlet-name>
        <url-pattern>/FirstServlet</url-pattern>
    </servlet-mapping>
	
</web-app>

```

最后启动Tomcat，通过Chrome浏览器进行访问。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417152912.png)

# Servlet的运行过程

Servlet程序是由Web服务器调用的，Web服务器收到客户端的Servlet访问请求后：

- ①Web服务器首先检查是否已经装载并创建了该Servlet的实例对象。如果是，则直接执行第④步，否则，执行第②步；
- ②装载并创建该Servlet的一个实例对象；
- ③调用Servlet实例对象的init()方法；
- ④创建一个用于封装HTTP请求消息的HttpServletRequest对象和一个代表HTTP响应消息的HttpServletResponse对象，然后调用Servlet的service()方法并将请求和响应对象作为参数传递进去；
- ⑤Web应用程序被停止或重新启动之前，Servlet引擎将卸载Servlet，并在卸载之前调用Servlet的destroy()方法。

用动图来描述以上调用过程：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190324155210143.gif)

如果是用UML时序图来描述以上调用过程，则如下：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153309.png)

注意：上图并没画出destory()方法。destory()方法会在Web容器移除Servlet时执行，客户机第一次访问服务器时，服务器会创建Servlet实例对象，它就永远驻留在内存里面了，等待客户机第二次访问，这时有一个用户访问完Servlet之后，此Servlet对象并不会被摧毁，destory()方法也就不会被执行。

# 一道面试题：请说出Servlet的生命周期

Servlet对象是用户第一次访问时创建，对象创建之后就驻留在内存里面了，响应后续的请求。Servlet对象一旦被创建，init()方法就会被执行，客户端的每次请求导致service()方法被执行，Servlet对象被摧毁时(Web服务器停止后或者Web应用从服务器里删除时)，destory()方法就会被执行。

## 在Eclipse中开发Servlet

在Eclipse中新建一个Dynamic Web Project工程，Eclipse会自动创建下图所示目录结构：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153410.png)

### Servlet接口实现类

对于Servlet接口，SUN公司定义了两个默认实现类，分别为GenericServlet和HttpServlet。HttpServlet指能够处理HTTP请求的Servlet，它在原有Servlet接口上添加了一些与HTTP协议相关的处理方法，它比Servlet接口的功能更为强大。因此开发人员在编写Servlet时，通常应继承这个类，而避免直接去实现Servlet接口。HttpServlet在实现Servlet接口时，覆写了service方法，该方法体内的代码会自动判断用户的请求方式，如为GET请求，则调用HttpServlet的doGet方法，如为Post请求，则调用doPost方法。因此，开发人员在编写Servlet时，通常只需要覆写doGet或doPost方法，而不要去覆写service方法(温馨提示：可阅读HttpServlet API文档)。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153443.png)

借助有道翻译为：

> 提供了一个抽象类派生子类来创建一个适合于一个网站的HTTP Servlet。HttpServlet的子类必须覆盖至少一个方法，通常是其中一个：
> 
> * doGet，如果Servlet支持HTTP GET请求
> * doPost，HTTP POST请求
> * doPut，HTTP PUT请求
> * doDelete，HTTP DELETE请求
> * 初始化和销毁，管理Sevlet生命中被掌握的资源
> * getServletInfo，Servlet用来提供关于其自身信息
> 
> 几乎没有理由覆盖service()方法。service()方法会处理标准HTTP请求，通过派遣他们每个HTTP请求类型的处理程序方法(上述doMethod方法)。
同样，几乎没有理由覆盖doOptions和doTrace方法。

## 通过Eclipse创建和编写Servlet

选中cn.liayun包，右键→New→Servlet，在Eclipse中创建和编写Servlet可参考下面一系列步骤：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153623.png)

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153627.png)

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153629.png)

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417153635.png)

这样，我们就通过Eclipse帮我们创建好一个名字为ServletSample的Servlet，创建好的ServletSample里面会有如下代码：

```
package cn.liayun;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet implementation class ServletSample
 */
@WebServlet("/ServletSample")
public class ServletSample extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		response.getWriter().append("Served at: ").append(request.getContextPath());
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
```

这些代码都是Eclipse自动生成的，而web.xml文件中也多了`<servlet></servlet>`和`<servlet-mapping></servlet-mapping>`两对标签，这两对标签是配置ServletSample的，应如下所示：

```
<servlet>
	<servlet-name>ServletSample</servlet-name>
	<servlet-class>cn.liayun.ServletSample</servlet-class>
</servlet>
<servlet-mapping>
	<servlet-name>ServletSample</servlet-name>
	<url-pattern>/ServletSample</url-pattern>
</servlet-mapping>
```

注意：照理说，web.xml文件中会多`<servlet></servlet>`和`<servlet-mapping></servlet-mapping>`这两对标签，但是我的就没有，而且使用的是注解@WebServlet("/ServletSample")，好像因为我使用的是Servlet3.1规范的缘故。
最后我们就可以通过浏览器访问ServletSample这个Servlet了，访问的URL地址是http://localhost:8080/day05/ServletSample。

# Servlet开发注意细节
如果你的Eclipse中有一个动态web项目TomcatTest，当你使用Eclipse导入一个外部项目，恰好这个项目名就是TomcatTest，这时你为了避免重名，需要修改导入的项目名，比如修改为t_ TomcatTest，然后你将其部署到Tomcat服务器中的webapps目录中，该项目映射的虚拟目录名称仍然是TomcatTest，所以你需要修改其虚拟目录。步骤如下：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154011.png)

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154014.png)

# Servlet访问URL映射配置
由于客户端是通过URL地址访问Web服务器中的资源，所以Servlet程序若想被外界访问，必须把Servlet程序映射到一个URL地址上，这个工作在web.xml文件中使用`<servlet>`元素和`<servlet-mapping>`元素完成。`<servlet>`元素用于注册Servlet，它包含有两个主要的子元素：`<servlet-name>`和`<servlet-class>`，分别用于设置Servlet的注册名称和Servlet的完整类名。一个`<servlet-mapping>`元素用于映射一个已注册的Servlet的一个对外访问路径，它包含有两个子元素：`<servlet-name>`和`<url-pattern>`，分别用于指定Servlet的注册名称和Servlet的对外访问路径。例如：

```
<servlet>
    <servlet-name>ServletDemo1</servlet-name>
    <servlet-class>cn.itcast.ServletDemo1</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>ServletDemo1</servlet-name>
    <url-pattern>/ServletDemo1</url-pattern>
</servlet-mapping>
```

同一个Servlet可以被映射到多个URL上，即多个`<servlet-mapping>`元素的`<servlet-name>`子元素的设置值可以是同一个Servlet的注册名。例如：

```
<servlet>
    <servlet-name>ServletDemo1</servlet-name>
    <servlet-class>cn.itcast.ServletDemo1</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>ServletDemo1</servlet-name>
    <url-pattern>/ServletDemo1</url-pattern>
</servlet-mapping>
<servlet-mapping>
    <servlet-name>ServletDemo1</servlet-name>
    <url-pattern>/aa</url-pattern>
</servlet-mapping>
<servlet-mapping>
    <servlet-name>ServletDemo1</servlet-name>
    <url-pattern>/1.html</url-pattern> <!-- 伪静态，明显是一个动态Web资源，但将其映射成静态Web资源的名称 -->
</servlet-mapping>
```

温馨提示：一个Web应用的web.xml文件内容一经修改，不需要重新发布，服务器会自动监测web.xml的改动，只要web.xml文件的内容修改，服务器就会自动加载。原因是在Tomcat服务器的conf/context.xml文件中，有如下关键代码：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154219.png)

根据Tomcat服务器文档可知，在conf/context.xml文件中，Context元素信息被所有的Web应用加载。即Context元素的配置信息会被所有Web应用程序所共享。所以所有的Web应用会监测web.xml的改动，只要web.xml文件的内容一旦修改，服务器就会自动重新加载。
通过上面的配置，当我们想访问名称是ServletDemo1的Servlet时，可以使用如下的几个地址去访问：

- http://localhost:8080/day05/ServletDemo1；
- http://localhost:8080/day05/aa；
- http://localhost:8080/day05/1.html。

ServletDemo1被映射到了多个URL上。

# Servlet访问URL使用*通配符映射

在Servlet映射到的URL中也可以使用`*`通配符，但是只能有两种固定的格式：一种格式是“`*`.扩展名”，另一种格式是以正斜杠（/）开头并以“`*`”结尾。例如：

```
<servlet-mapping>
    <servlet-name>AnyName</servlet-name>
    <url-pattern>*.do</url-pattern>
</servlet-mapping>

<servlet-mapping>
    <servlet-name>AnyName</servlet-name>
    <url-pattern>/action/*</url-pattern>
</servlet-mapping>

```

对于如下的一些映射关系：

- Servlet1映射到`/abc/*`；
- Servlet2映射到`/*`；
- Servlet3映射到`/abc`；
- Servlet4映射到`*.do`。

有如下问题：

- 当请求URL为“`/abc/a.html`”，“`/abc/*`”和“`/*`”都匹配，哪个Servlet响应？——Servlet引擎将调用Servlet1；
- 当请求URL为“`/abc`”时，“`/abc/*`”、“`/*`”和“`/abc`”都匹配，哪个Servlet响应？——Servlet引擎将调用Servlet3；
- 当请求URL为“`/abc/a.do`”时，“`/abc/*`”、“`/*`”和“`*.do`”都匹配，哪个Servlet响应？——Servlet引擎将调用Servlet1；
- 当请求URL为“`/a.do`”时，“`/*`”和“`*.do`”都匹配，哪个Servlet响应？——Servlet引擎将调用Servlet2；
- 当请求URL为“`/xxx/yyy/a.do`”时，“`/*`”和“`*.do`”都匹配，哪个Servlet响应？——Servlet引擎将调用Servlet2。

**结论：匹配的原则就是"谁长得更像就找谁"，“`*.do`”——这种*在前面的时候优先级最低。**


# Servlet与普通Java类的区别

Servlet是一个供其他Java程序（Servlet引擎）调用的Java类，它不能独立运行，它的运行完全由Servlet引擎来控制和调度。针对客户端的多次Servlet请求，通常情况下，服务器只会创建一个Servlet实例对象，也就是说Servlet实例对象一旦创建，它就会驻留在内存中，为后续的其它请求服务，直至Web容器退出，Servlet实例对象才会销毁。验证如下：

- 新建一个Servlet——ServletDemo3，并覆盖init()和destroy()方法；

```
package cn.liayun;

import java.io.IOException;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ServletDemo3 extends HttpServlet {
	private static final long serialVersionUID = 1L;

	@Override
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		System.out.println("init");
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.getOutputStream().write("haha".getBytes());
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}
	
	@Override
	public void destroy() {
		System.out.println("destroy");
	}

}
```

- 将项目部署到服务器中，启动服务器，发现没有输出init，说明启动服务器时，Servlet实例对象并没有被创建。此时，通过浏览器进行访问，会发现控制台输出init，如下：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154730.png)

此时再打开一个浏览器进行访问，仍然只会输出一个init，说明针对客户端的多次Servlet请求，通常情况下，服务器只会创建一个Servlet实例对象。

- 当Web服务器停止后或者Web应用从服务器里删除时，destroy()方法就会被执行；

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154734.png)

在Web服务器停止前，Servlet实例对象就会被摧毁。

在Servlet的整个生命周期内，Servlet的init方法只被调用一次。而对一个Servlet的每次访问请求都导致Servlet引擎调用一次Servlet的service方法。对于每次访问请求，Servlet引擎都会创建一个新的HttpServletRequest请求对象和一个新的HttpServletResponse响应对象，然后将这两个对象作为参数传递给它调用的Servlet的service()方法，service方法再根据请求方式分别调用doXXX方法。
如果在<servlet>元素中配置了一个<load-on-startup>元素，那Web应用程序在启动时，就会装载并创建Servlet的实例对象、以及调用Servlet实例对象的init()方法。例如：

```
<servlet>
    <servlet-name>ServletDemo3</servlet-name>
    <servlet-class>cn.itcast.ServletDemo3</servlet-class>
    <load-on-startup>1</load-on-startup>
</servlet>
```

此时在启动服务器的过程中，会在控制台看到：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154739.png)

温馨提示：`<load-on-startup>`元素配置的数必须为正整数，数字越小，Servlet越优先创建。它的用途：可为Web应用写一个InitServlet，这个Servlet配置为启动时装载，为整个Web应用创建必要的数据库表和数据。

# 缺省Servlet

如果某个Servlet的映射路径仅仅为一个正斜杠（/），那么这个Servlet就成为当前Web应用程序的缺省Servlet。凡是在web.xml文件中找不到匹配的`<servlet-mapping>`元素的URL，它们的访问请求都将交给缺省Servlet处理，也就是说，缺省Servlet用于处理所有其他Servlet都不处理的访问请求。例如：

```
<servlet>
    <servlet-name>ServletDemo3</servlet-name>
    <servlet-class>cn.itcast.ServletDemo3</servlet-class>
    <load-on-startup>1</load-on-startup>
</servlet>
<!-- 将ServletDemo3配置成缺省Servlet -->
<servlet-mapping>
    <servlet-name>ServletDemo3</servlet-name>
    <url-pattern>/</url-pattern>
</servlet-mapping>
```

当访问不存在的Servlet时，就使用配置的默认Servlet进行处理，如下图所示：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154743.png)

在`<Tomcat的安装目录>\conf\web.xml`文件中，注册了一个名称为org.apache.catalina.servlets.DefaultServlet的Servlet，并将这个Servlet设置为了缺省Servlet。

```
<servlet>
	<servlet-name>default</servlet-name>
	<servlet-class>org.apache.catalina.servlets.DefaultServlet</servlet-class>
	<init-param>
		<param-name>debug</param-name>
		<param-value>0</param-value>
	</init-param>
	<init-param>
		<param-name>listings</param-name>
		<param-value>false</param-value>
	</init-param>
	<load-on-startup>1</load-on-startup>
</servlet>

<!-- The mapping for the default servlet -->
<servlet-mapping>
	<servlet-name>default</servlet-name>
	<url-pattern>/</url-pattern>
</servlet-mapping>

```

当访问Tomcat服务器中的某个静态HTML文件和图片时，实际上是在访问这个缺省Servlet(服务器中的html文件数据的读取由缺省Servlet完成)。

# Servlet的线程安全问题

当多个客户端并发访问同一个Servlet时，Web服务器会为每一个客户端的访问请求创建一个线程，并在这个线程上调用Servlet的service方法，因此service方法内如果访问了同一个资源的话，就有可能引发线程安全问题。下面我会举例来说明。

# 当Servlet不存在线程安全问题时

下面是不存在线程安全问题的代码。

```
package cn.liayun;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/ServletSample")
public class ServletSample extends HttpServlet {

	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		int i = 0;
		i++;
		response.getOutputStream().write((i + "").getBytes());
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response);
	}

}

```

当多线程并发访问这个方法里面的代码时，会存在线程安全问题吗？显然不会，i变量被多个线程并发访问，但是没有线程安全问题，因为i是doGet方法里面的局部变量，当有多个线程并发访问doGet方法时，每一个线程里面都有自己的i变量，各个线程操作的都是自己的i变量，所以不存在线程安全问题。多线程并发访问某一个方法的时候，如果在方法内部定义了一些资源(变量，集合等)，那么每一个线程都有这些东西，所以就不存在线程安全问题。

# 当Servlet存在线程安全问题时

下面是存在线程安全问题的代码。

```
package cn.liayun;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/ServletSample")
public class ServletSample extends HttpServlet {
	
	private int i = 0;

	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		i++;

		try {
			Thread.sleep(1000 * 10);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		response.getOutputStream().write((i + "").getBytes());
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response);
	}

}
```

把i定义成全局变量，当多个线程并发访问变量i时，就会存在线程安全问题了。线程安全问题只存在多个线程并发操作同一个资源的情况下，所以在编写Servlet的时候，如果并发访问某一个资源(变量，集合等)，就会存在线程安全问题，那么该如何解决这个问题呢？可使用同步代码块。

```
package cn.liayun;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/ServletSample")
public class ServletSample extends HttpServlet {
	
	private int i = 0;//共享资源

	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		i++;

		synchronized (this) {
			try {
				Thread.sleep(1000 * 10);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		response.getOutputStream().write((i + "").getBytes());
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		doGet(request, response);
	}

}

```
加了synchronized后，并发访问i时就不存在线程安全问题了，为什么加了synchronized后就没有线程安全问题了呢？原因：假如现在有一个线程访问Servlet对象，那么它就先拿到了Servlet对象的那把锁，等到它执行完之后才会把锁还给Servlet对象，由于是它先拿到了Servlet对象的那把锁，所以当有别的线程来访问这个Servlet对象时，由于锁已经被之前的线程拿走了，后面的线程只能排队等候了。
以上这种做法是给Servlet对象加了一把锁，保证任何时候都只有一个线程在访问该Servlet对象里面的资源，这样就不存在线程安全问题了。这种做法虽然解决了线程安全问题，但是编写Servlet却万万不能用这种方式处理线程安全问题，假如有9999个人同时访问这个Servlet，那么这9999个人必须按先后顺序排队轮流访问。
针对Servlet的线程安全问题，SUN公司是提供有解决方案的：让Servlet去实现一个SingleThreadModel接口，如果某个Servlet实现了SingleThreadModel接口，那么Servlet引擎将以单线程模式来调用其service方法。查看Sevlet的API可以看到，SingleThreadModel接口中没有定义任何方法和常量，在Java中，把没有定义任何方法和常量的接口称之为标记接口，经常看到的一个最典型的标记接口就是"Serializable"，这个接口也是没有定义任何方法和常量的，标记接口在Java中有什么用呢？主要作用就是给某个对象打上一个标志，告诉JVM，这个对象可以做什么，比如实现了"Serializable"接口的类的对象就可以被序列化，还有一个"Cloneable"接口，这个也是一个标记接口，在默认情况下，Java中的对象是不允许被克隆的，就像现实生活中的人一样，不允许克隆，但是只要实现了"Cloneable"接口，那么对象就可以被克隆了。SingleThreadModel接口中没有定义任何方法，只要在Servlet类的定义中增加实现SingleThreadModel接口的声明即可。
对于实现了SingleThreadModel接口的Servlet，Servlet引擎仍然支持对该Servlet的多线程并发访问，其采用的方式是产生多个Servlet实例对象，并发的每个线程分别调用一个独立的Servlet实例对象。实现SingleThreadModel接口并不能真正解决Servlet的线程安全问题，因为Servlet引擎会创建多个Servlet实例对象，而真正意义上解决多线程安全问题是指一个Servlet实例对象被多个线程同时调用的问题。事实上，在Servlet API 2.4中，已经将SingleThreadModel标记为Deprecated（过时的）。

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190417154750.png)

以上代码还要注意异常的处理，代码`Thread.sleep(1000*4)`;只能try不能抛，因为子类在覆盖父类的方法时，不能抛出比父类更多的异常；并且catch之后，后台记录异常的同时并给用户一个友好提示，因为用户访问的是一个网页。