title: 使用nio进行大文件复制
tags:
  - nio
categories:
  - Spring Boot
date: 2019-03-29 12:01:00
toc: true
---
### NIO概述
#### 什么是NIO?
- Java NIO(New IO)是一个可以替代标准Java IO API的IO API（从Java 1.4开始)，Java NIO提供了与标准IO不同的IO工作方式。
- Java NIO: Channels and Buffers（通道和缓冲区）
- 标准的IO基于字节流和字符流进行操作的，而NIO是基于通道（Channel）和缓冲区（Buffer）进行操作，数据总是从通道读取到缓冲区中，或者从缓冲区写入到通道中。
- Java NIO: Non-blocking IO（非阻塞IO）
- Java NIO可以让你非阻塞的使用IO，例如：当线程从通道读取数据到缓冲区时，线程还是可以进行其他事情。当数据被写入到缓冲区时，线程可以继续处理它。从缓冲区写入通道也类似。
- Java NIO: Selectors（选择器）
- Java NIO引入了选择器的概念，选择器用于监听多个通道的事件（比如：连接打开，数据到达）。因此，单个的线程可以监听多个数据通道。
-  注意:传统IT是单向。 NIO类似
<!-- more -->

### NIO概述
#### 什么是NIO?
- Java NIO(New IO)是一个可以替代标准Java IO API的IO API（从Java 1.4开始)，Java NIO提供了与标准IO不同的IO工作方式。
- Java NIO: Channels and Buffers（通道和缓冲区）
- 标准的IO基于字节流和字符流进行操作的，而NIO是基于通道（Channel）和缓冲区（Buffer）进行操作，数据总是从通道读取到缓冲区中，或者从缓冲区写入到通道中。
- Java NIO: Non-blocking IO（非阻塞IO）
- Java NIO可以让你非阻塞的使用IO，例如：当线程从通道读取数据到缓冲区时，线程还是可以进行其他事情。当数据被写入到缓冲区时，线程可以继续处理它。从缓冲区写入通道也类似。
- Java NIO: Selectors（选择器）
- Java NIO引入了选择器的概念，选择器用于监听多个通道的事件（比如：连接打开，数据到达）。因此，单个的线程可以监听多个数据通道。
-  注意:传统IT是单向。 NIO类似
![paste image](http://pp4bsxgau.bkt.clouddn.com/1553850146774url1xgpc.png?imageslim)
![paste image](http://pp4bsxgau.bkt.clouddn.com/15538501523300p9s7yv7.png?imageslim)

### Buffer的概述

1）容量（capacity）：表示Buffer最大数据容量，缓冲区容量不能为负，并且建立后不能修改。
2）限制（limit）：第一个不应该读取或者写入的数据的索引，即位于limit后的数据不可以读写。缓冲区的限制不能为负，并且不能大于其容量（capacity）。
3）位置（position）：下一个要读取或写入的数据的索引。缓冲区的位置不能为负，并且不能大于其限制（limit）。
4）标记（mark）与重置（reset）：标记是一个索引，通过Buffer中的mark()方法指定Buffer中一个特定的position，之后可以通过调用reset()方法恢复到这个position。

```
/**
 * (缓冲区)buffer 用于NIO存储数据 支持多种不同的数据类型 <br>
 * 1.byteBuffer <br>
 * 2.charBuffer <br>
 * 3.shortBuffer<br>
 * 4.IntBuffer<br>
 * 5.LongBuffer<br> 
 * 6.FloatBuffer <br>
 * 7.DubooBuffer <br>
 * 上述缓冲区管理的方式 几乎<br>
 * 通过allocate（） 获取缓冲区 <br>
 * 二、缓冲区核心的方法 put 存入数据到缓冲区 get <br> 获取缓冲区数据 flip 开启读模式
 * 三、缓冲区四个核心属性<br>
 * capacity:缓冲区最大容量，一旦声明不能改变。 limit:界面(缓冲区可以操作的数据大小) limit后面的数据不能读写。
 * position:缓冲区正在操作的位置
 */
public class Test004 {

	public static void main(String[] args) {
		// 1.指定缓冲区大小1024
		ByteBuffer buf = ByteBuffer.allocate(1024);
		System.out.println("--------------------");
		System.out.println(buf.position());
		System.out.println(buf.limit());
		System.out.println(buf.capacity());
		// 2.向缓冲区存放5个数据
		buf.put("abcd1".getBytes());
		System.out.println("--------------------");
		System.out.println(buf.position());
		System.out.println(buf.limit());
		System.out.println(buf.capacity());
		// 3.开启读模式
		buf.flip();
		System.out.println("----------开启读模式...----------");
		System.out.println(buf.position());
		System.out.println(buf.limit());
		System.out.println(buf.capacity());
		byte[] bytes = new byte[buf.limit()];
		buf.get(bytes);
		System.out.println(new String(bytes, 0, bytes.length));
		System.out.println("----------重复读模式...----------");
		// 4.开启重复读模式
		buf.rewind();
		System.out.println(buf.position());
		System.out.println(buf.limit());
		System.out.println(buf.capacity());
		byte[] bytes2 = new byte[buf.limit()];
		buf.get(bytes2);
		System.out.println(new String(bytes2, 0, bytes2.length));
		// 5.clean 清空缓冲区  数据依然存在,只不过数据被遗忘
		System.out.println("----------清空缓冲区...----------");
		buf.clear();
		System.out.println(buf.position());
		System.out.println(buf.limit());
		System.out.println(buf.capacity());
		System.out.println((char)buf.get());
	}

}
```
#### 直接缓冲区与非直接缓冲耗时计算
```

package com.itmayiedu;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.FileChannel.MapMode;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

import org.junit.Test;

public class Test003 {

	//直接缓冲区
	@Test
	public void test002() throws IOException {
		long statTime=System.currentTimeMillis();
		//创建管道
		FileChannel   inChannel=	FileChannel.open(Paths.get("f://1.mp4"), StandardOpenOption.READ);
		FileChannel   outChannel=	FileChannel.open(Paths.get("f://2.mp4"), StandardOpenOption.READ,StandardOpenOption.WRITE, StandardOpenOption.CREATE);
	    //定义映射文件
		MappedByteBuffer inMappedByte = inChannel.map(MapMode.READ_ONLY,0, inChannel.size());
		MappedByteBuffer outMappedByte = outChannel.map(MapMode.READ_WRITE,0, inChannel.size());
		//直接对缓冲区操作
		byte[] dsf=new byte[inMappedByte.limit()];
		inMappedByte.get(dsf);
		outMappedByte.put(dsf);
		inChannel.close();
		outChannel.close();
		long endTime=System.currentTimeMillis();
		System.out.println("操作直接缓冲区耗时时间:"+(endTime-statTime));
	}

	// 非直接缓冲区 读写操作
	@Test
	public void test001() throws IOException {
		long statTime=System.currentTimeMillis();
		// 读入流
		FileInputStream fst = new FileInputStream("f://1.mp4");
		// 写入流
		FileOutputStream fos = new FileOutputStream("f://2.mp4");
		// 创建通道
		FileChannel inChannel = fst.getChannel();
		FileChannel outChannel = fos.getChannel();
		// 分配指定大小缓冲区
		ByteBuffer buf = ByteBuffer.allocate(1024);
		while (inChannel.read(buf) != -1) {
			// 开启读取模式
			buf.flip();
			// 将数据写入到通道中
			outChannel.write(buf);
			buf.clear();
		}
		// 关闭通道 、关闭连接
		inChannel.close();
		outChannel.close();
		fos.close();
		fst.close();
		long endTime=System.currentTimeMillis();
		System.out.println("操作非直接缓冲区耗时时间:"+(endTime-statTime));
	}

}

```