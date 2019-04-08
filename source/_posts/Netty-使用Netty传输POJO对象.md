title: Netty-使用Netty传输POJO对象
categories:
  - Netty
tags: Netty
date: 2019-04-03 15:35:00
---
## Netty-使用Netty传输POJO对象
- 使用Netty传输POJO对象，重点在于对象的序列化，序列化后的对象可以通过TCP流进行网络传输，结合Netty提供的对象编解码器，可以做到远程传输对象。
- 下面我们来看一个例子：模拟订票
- 首先Java序列化的POJO对象需要实现java.io.Serializable接口。
![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190403152256.png)
<!-- more -->

#### 火车车次和余票量POJO：
```
package bookticket;
 
import java.io.Serializable;
/**
 * 火车pojo对象
 * @author xwalker
 */
public class Train implements Serializable {
	private static final long serialVersionUID = 1510326612440404416L;
	private String number;//火车车次
	private int ticketCounts;//余票数量
	public Train(String number,int ticketCounts){
		this.number=number;
		this.ticketCounts=ticketCounts;
	}
	public String getNumber() {
		return number;
	}
	public void setNumber(String number) {
		this.number = number;
	}
	public int getTicketCounts() {
		return ticketCounts;
	}
	public void setTicketCounts(int ticketCounts) {
		this.ticketCounts = ticketCounts;
	}
 
}

```
#### 车票POJO：
```
package bookticket;
 
import java.io.Serializable;
import java.util.Date;
/**
 * 订票POJO对象
 * @author xwalker
 */
public class Ticket implements Serializable {
	private static final long serialVersionUID = 4228051882802183587L;
	private String trainNumber;//火车车次
	private int carriageNumber;//车厢编号
	private String seatNumber;//座位编号
	private String number;//车票编号
	private User user;//订票用户
	private Date bookTime;//订票时间
	private Date startTime;//开车时间
	public String getNumber() {
		return number;
	}
	public void setNumber(String number) {
		this.number = number;
	}
 
	public Date getBookTime() {
		return bookTime;
	}
	public void setBookTime(Date bookTime) {
		this.bookTime = bookTime;
	}
	public Date getStartTime() {
		return startTime;
	}
	public void setStartTime(Date startTime) {
		this.startTime = startTime;
	}
	public User getUser() {
		return user;
	}
	public void setUser(User user) {
		this.user = user;
	}
	public String getTrainNumber() {
		return trainNumber;
	}
	public void setTrainNumber(String trainNumber) {
		this.trainNumber = trainNumber;
	}
	public int getCarriageNumber() {
		return carriageNumber;
	}
	public void setCarriageNumber(int carriageNumber) {
		this.carriageNumber = carriageNumber;
	}
	public String getSeatNumber() {
		return seatNumber;
	}
	public void setSeatNumber(String seatNumber) {
		this.seatNumber = seatNumber;
	}
}

```
#### 用户POJO:
```
package bookticket;
 
import java.io.Serializable;
/**
 * 用户POJO对象
 * @author xwalker
 */
public class User implements Serializable {
	private static final long serialVersionUID = -3845514510571408376L;
	private String userId;//身份证
	private String userName;//姓名
	private String phone;//电话
	private String email;//邮箱
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String getUserName() {
		return userName;
	}
	public void setUserName(String userName) {
		this.userName = userName;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
}

```

#### 请求指令集：
```
package bookticket;
 
/**
 * 指令集
 * @author xwalker
 *
 */
public class Code {
	public static final int CODE_SEARCH=1;//查询车票余量
	public static final int CODE_BOOK=2;//订票
	public static final int CODE_NONE=-1;//错误指令 无法处理
}

```

#### 客户端发送的请求信息：
```
package bookticket;
 
import java.io.Serializable;
import java.util.Date;
/**
 * 订票人发送查询余票和订票使用的请求信息
 * @author xwalker
 *
 */
public class BookRequestMsg implements Serializable {
	private static final long serialVersionUID = -7335293929249462183L;
	private User user;//发送订票信息用户
	private String trainNumber;//火车车次
	private int code;//查询命令
	private Date startTime;//开车时间
	public User getUser() {
		return user;
	}
	public void setUser(User user) {
		this.user = user;
	}
	public String getTrainNumber() {
		return trainNumber;
	}
	public void setTrainNumber(String trainNumber) {
		this.trainNumber = trainNumber;
	}
	public Date getStartTime() {
		return startTime;
	}
	public void setStartTime(Date startTime) {
		this.startTime = startTime;
	}
	public int getCode() {
		return code;
	}
	public void setCode(int code) {
		this.code = code;
	}
 
}

```

#### 服务器接收订票和查票后处理完业务反馈客户端的信息：

```
package bookticket;
 
import java.io.Serializable;
import java.util.Date;
/**
 * 订票成功与否反馈信息
 * @author xwalker
 */
public class BookResponseMsg implements Serializable {
	private static final long serialVersionUID = -4984721370227929766L;
	private boolean success;//是否操作成功
	private User user;//请求用户
	private String msg;//反馈信息
	private int code;//请求指令
	private Train train;//火车车次
	private Date startTime;//出发时间
	private Ticket ticket;//订票成功后具体出票票据
	public boolean getSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	public String getMsg() {
		return msg;
	}
	public void setMsg(String msg) {
		this.msg = msg;
	}
	public Ticket getTicket() {
		return ticket;
	}
	public void setTicket(Ticket ticket) {
		this.ticket = ticket;
	}
	public int getCode() {
		return code;
	}
	public void setCode(int code) {
		this.code = code;
	}
	public Train getTrain() {
		return train;
	}
	public void setTrain(Train train) {
		this.train = train;
	}
	public Date getStartTime() {
		return startTime;
	}
	public void setStartTime(Date startTime) {
		this.startTime = startTime;
	}
	public User getUser() {
		return user;
	}
	public void setUser(User user) {
		this.user = user;
	}
	
}

```

#### 订票服务器：
```
package bookticket;
 
import java.util.ArrayList;
import java.util.List;
 
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.serialization.ClassResolvers;
import io.netty.handler.codec.serialization.ObjectDecoder;
import io.netty.handler.codec.serialization.ObjectEncoder;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;
 
/**
 * 订票服务器端
 * @author xwalker
 *
 */
public class BookTicketServer {
	public static List<Train> trains;
	/**
	 * 初始化 构造车次和车票余数
	 */
	public BookTicketServer() {
		trains=new ArrayList<Train>();
		trains.add(new Train("G242",500));
		trains.add(new Train("G243",200));
		trains.add(new Train("D1025",100));
		trains.add(new Train("D1235",0));
	}
	public void bind(int port) throws Exception{
		//配置NIO线程组
		EventLoopGroup bossGroup=new NioEventLoopGroup();
		EventLoopGroup workerGroup=new NioEventLoopGroup();
		try{
			//服务器辅助启动类配置
			ServerBootstrap b=new ServerBootstrap();
			b.group(bossGroup, workerGroup)
			.channel(NioServerSocketChannel.class)
			.option(ChannelOption.SO_BACKLOG, 100)
			.handler(new LoggingHandler(LogLevel.INFO))
			.childHandler(new ChannelInitializer<SocketChannel>() {
				@Override
				protected void initChannel(SocketChannel ch) throws Exception {
					//添加对象解码器 负责对序列化POJO对象进行解码 设置对象序列化最大长度为1M 防止内存溢出
					//设置线程安全的WeakReferenceMap对类加载器进行缓存 支持多线程并发访问  防止内存溢出 
					ch.pipeline().addLast(new ObjectDecoder(1024*1024,ClassResolvers.weakCachingConcurrentResolver(this.getClass().getClassLoader())));
					//添加对象编码器 在服务器对外发送消息的时候自动将实现序列化的POJO对象编码
					ch.pipeline().addLast(new ObjectEncoder());
					ch.pipeline().addLast(new BookTicketServerhandler());
				}
			});
			//绑定端口 同步等待绑定成功
			ChannelFuture f=b.bind(port).sync();
			//等到服务端监听端口关闭
			f.channel().closeFuture().sync();
		}finally{
			//优雅释放线程资源
			bossGroup.shutdownGracefully();
			workerGroup.shutdownGracefully();
		}
	}
 
	public static void main(String[] args) throws Exception {
		int port =8000;
		new BookTicketServer().bind(port);
	}
 
}

```

#### 服务器端网络IO处理器，查票订票业务处理和反馈：
```
package bookticket;
 
import java.util.Date;
import java.util.Random;
 
import io.netty.channel.ChannelHandlerAdapter;
import io.netty.channel.ChannelHandlerContext;
/**
 * 订票server端处理器
 * @author xwalker
 *
 */
public class BookTicketServerhandler extends ChannelHandlerAdapter {
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg)
			throws Exception {
		BookRequestMsg requestMsg=(BookRequestMsg) msg;
		BookResponseMsg responseMsg=null;
		switch (requestMsg.getCode()) {
		case Code.CODE_SEARCH://查询余票
			for(Train train:BookTicketServer.trains){
				//找到车次与请求车次相同的 返回车次余票
				if(requestMsg.getTrainNumber().equals(train.getNumber())){
					responseMsg=new BookResponseMsg();
					responseMsg.setUser(requestMsg.getUser());
					responseMsg.setCode(Code.CODE_SEARCH);
					responseMsg.setSuccess(true);
					responseMsg.setTrain(train);
					responseMsg.setStartTime(requestMsg.getStartTime());
					responseMsg.setMsg("火车【"+train.getNumber()+"】余票数量为【"+train.getTicketCounts()+"】");
					break;
				}
			}
			if(responseMsg==null){
				responseMsg=new BookResponseMsg();
				responseMsg.setUser(requestMsg.getUser());
				responseMsg.setCode(Code.CODE_SEARCH);
				responseMsg.setSuccess(false);
				responseMsg.setMsg("火车【"+requestMsg.getTrainNumber()+"】的信息不存在！");
			}
			break;
		case Code.CODE_BOOK://确认订票
			for(Train train:BookTicketServer.trains){
				//找到车次与请求车次相同的 返回车次余票
				if(requestMsg.getTrainNumber().equals(train.getNumber())){
					responseMsg=new BookResponseMsg();
					responseMsg.setUser(requestMsg.getUser());
					responseMsg.setSuccess(true);
					responseMsg.setCode(Code.CODE_BOOK);
					responseMsg.setMsg("恭喜您，订票成功！");
					Ticket ticket=new Ticket();
					ticket.setBookTime(new Date());
					ticket.setUser(requestMsg.getUser());
					ticket.setStartTime(requestMsg.getStartTime());
					ticket.setNumber(train.getNumber()+System.currentTimeMillis());//生成车票编号
					ticket.setCarriageNumber(new Random().nextInt(15));//随机车厢
					ticket.setUser(requestMsg.getUser());//设置订票人信息
					String[] seat=new String[]{"A","B","C","D","E"};
					Random seatRandom=new Random();
					ticket.setSeatNumber(seat[seatRandom.nextInt(5)]+seatRandom.nextInt(100));
					ticket.setTrainNumber(train.getNumber());
					train.setTicketCounts(train.getTicketCounts()-1);//余票减去一张
					responseMsg.setTrain(train);
					responseMsg.setTicket(ticket);
					break;
				}
			}
			if(responseMsg==null){
				responseMsg=new BookResponseMsg();
				responseMsg.setUser(requestMsg.getUser());
				responseMsg.setCode(Code.CODE_BOOK);
				responseMsg.setSuccess(false);
				responseMsg.setMsg("火车【"+requestMsg.getTrainNumber()+"】的信息不存在！");
			}
			break;
		default://无法处理
				responseMsg=new BookResponseMsg();
				responseMsg.setUser(requestMsg.getUser());
				responseMsg.setCode(Code.CODE_NONE);
				responseMsg.setSuccess(false);
				responseMsg.setMsg("指令无法处理！");
			break;
		}
		
		ctx.writeAndFlush(responseMsg);
	}
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
			throws Exception {
		cause.printStackTrace();
		ctx.close();
	}
}

```

#### 客户端：
```
package bookticket;
 
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.serialization.ClassResolvers;
import io.netty.handler.codec.serialization.ObjectDecoder;
import io.netty.handler.codec.serialization.ObjectEncoder;
 
/**
 * 订票客户端
 * @author xwalker
 */
public class BookTicketClient {
	public void connect(int port,String host) throws Exception{
		//配置客户端线程组
		EventLoopGroup group=new NioEventLoopGroup();
		try{
			//配置客户端启动辅助类
			Bootstrap b=new Bootstrap();
			b.group(group).channel(NioSocketChannel.class)
			.option(ChannelOption.TCP_NODELAY, true)
			.handler(new ChannelInitializer<SocketChannel>() {
				@Override
				protected void initChannel(SocketChannel ch) throws Exception {
					//添加POJO对象解码器 禁止缓存类加载器
					ch.pipeline().addLast(new ObjectDecoder(1024,ClassResolvers.cacheDisabled(this.getClass().getClassLoader())));
					//设置发送消息编码器
					ch.pipeline().addLast(new ObjectEncoder());
					//设置网络IO处理器
					ch.pipeline().addLast(new BookTicketClientHandler());
					
				}
			});
			//发起异步服务器连接请求 同步等待成功
			ChannelFuture f=b.connect(host,port).sync();
			//等到客户端链路关闭
			f.channel().closeFuture().sync();
			
		}finally{
			//优雅释放线程资源
			group.shutdownGracefully();
		}
		
	}
	
	public static void main(String[] args) throws Exception{
			new BookTicketClient().connect(8000, "127.0.0.1");
	}
 
}

```
#### 客户端处理网络IO处理器 发送查票和订票请求：
```
package bookticket;
 
import io.netty.channel.ChannelHandlerAdapter;
import io.netty.channel.ChannelHandlerContext;
 
import java.util.Calendar;
 
/**
 * 客户端处理器
 * 
 * @author xwalker
 */
public class BookTicketClientHandler extends ChannelHandlerAdapter {
	private User user;
	public BookTicketClientHandler() {
		user=new User();
		user.setUserName("xwalker");
		user.setPhone("187667*****");
		user.setEmail("909854136@qq.com");
		user.setUserId("3705231988********");
	}
	/**
	 * 链路链接成功
	 */
	@Override
	public void channelActive(ChannelHandlerContext ctx) throws Exception {
		
		// 链接成功后发送查询某车次余票的请求
		Calendar c = Calendar.getInstance();
		c.set(Calendar.YEAR, 2015);
		c.set(Calendar.MONTH, 1);
		c.set(Calendar.DATE, 2);
		c.set(Calendar.HOUR, 11);
		c.set(Calendar.MINUTE, 30);
		// G242查询余票
		BookRequestMsg requestMsg1 = new BookRequestMsg();
		requestMsg1.setCode(Code.CODE_SEARCH);
		requestMsg1.setStartTime(c.getTime());
		requestMsg1.setTrainNumber("G242");//设置查询车次
		requestMsg1.setUser(user);//设置当前登陆用户
		ctx.write(requestMsg1);
		// D1235查询余票
		BookRequestMsg requestMsg2 = new BookRequestMsg();
		requestMsg2.setCode(Code.CODE_SEARCH);
		requestMsg2.setStartTime(c.getTime());
		requestMsg2.setTrainNumber("D1235");//设置查询车次
		requestMsg2.setUser(user);
		ctx.write(requestMsg2);
		ctx.flush();
	}
 
	@Override
	public void channelRead(ChannelHandlerContext ctx, Object msg)
			throws Exception {
		BookResponseMsg responseMsg = (BookResponseMsg) msg;
		switch (responseMsg.getCode()) {
		case Code.CODE_SEARCH://收到查询结果
			System.out.println("==========火车【"+responseMsg.getTrain().getNumber()+"】余票查询结果:【"+(responseMsg.getSuccess()?"成功":"失败")+"】=========");
			System.out.println(responseMsg.getMsg());
			//查询发现有余票的话 需要发送订票指令
			if(responseMsg.getTrain().getTicketCounts()>0){
				//构造查询有余票的火车的订票指令
				BookRequestMsg requestMsg = new BookRequestMsg();
				requestMsg.setCode(Code.CODE_BOOK);
				requestMsg.setUser(user);
				requestMsg.setStartTime(responseMsg.getStartTime());
				requestMsg.setTrainNumber(responseMsg.getTrain().getNumber());
				ctx.writeAndFlush(requestMsg);
			}else{
				System.out.println("火车【"+responseMsg.getTrain().getNumber()+"】没有余票，不能订票了！");
			}
			break;
		case Code.CODE_BOOK://收到订票结果
			System.out.println("==========火车【"+responseMsg.getTrain().getNumber()+"】订票结果:【"+(responseMsg.getSuccess()?"成功":"失败")+"】=========");
			System.out.println(responseMsg.getMsg());
			System.out.println("========车票详情========");
			Ticket ticket=responseMsg.getTicket();
			System.out.println("车票票号：【"+ticket.getNumber()+"】");
			System.out.println("火车车次：【"+ticket.getTrainNumber()+"】");
			System.out.println("火车车厢：【"+ticket.getCarriageNumber()+"】");
			System.out.println("车厢座位：【"+ticket.getSeatNumber()+"】");
			System.out.println("预定时间：【"+ticket.getBookTime()+"】");
			System.out.println("出发时间：【"+ticket.getStartTime()+"】");
			System.out.println("乘客信息：【"+ticket.getUser().getUserName()+"】");
			break;
		default:
			System.out.println("==========操作错误结果=========");
			System.out.println(responseMsg.getMsg());
			break;
		}
 
	}
 
	@Override
	public void channelReadComplete(ChannelHandlerContext ctx) throws Exception {
		ctx.flush();
	}
 
	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause)
			throws Exception {
		cause.printStackTrace();
		ctx.close();
	}
}

```

#### 最后测试结果：
![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190403152803.png)

文章来源于： [https://blog.csdn.net/albertfly/article/details/51527488](https://blog.csdn.net/albertfly/article/details/51527488)

