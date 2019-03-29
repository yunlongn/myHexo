---
title: 使用nio进行大文件复制
date: 2019-03-29 12:01:51
tags:
- nio
categories:
- Spring Boot
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


### Buffer的概述

1）容量（capacity）：表示Buffer最大数据容量，缓冲区容量不能为负，并且建立后不能修改。
2）限制（limit）：第一个不应该读取或者写入的数据的索引，即位于limit后的数据不可以读写。缓冲区的限制不能为负，并且不能大于其容量（capacity）。
3）位置（position）：下一个要读取或写入的数据的索引。缓冲区的位置不能为负，并且不能大于其限制（limit）。
4）标记（mark）与重置（reset）：标记是一个索引，通过Buffer中的mark()方法指定Buffer中一个特定的position，之后可以通过调用reset()方法恢复到这个position。


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