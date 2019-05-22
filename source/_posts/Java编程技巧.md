title: Java编程技巧
author: RolandLee
tags:
  - 技巧
categories:
  - java
date: 2019-05-22 10:11:00
---
> 这世上有三样东西是别人抢不走的：一是吃进胃里的食物，二是藏在心中的梦想，三是读进大脑的书



## 如何在整数左填充0

### 问题
如何在整数左填充0
举例 1 = "0001"

<!--more-->

### 答案一，String.format
```
    String.format("%05d", yournumber);
```
用0填充，总长度为5
https://docs.oracle.com/javase/8/docs/api/java/util/Formatter.html

### 答案二，ApacheCommonsLanguage
如果需要在Java 1.5前使用，可以利用 Apache Commons Language 方法
```
    org.apache.commons.lang.StringUtils.leftPad(String str, int size, '0')
```
### 答案三，DecimalFormat
```
    import java.text.DecimalFormat;
    class TestingAndQualityAssuranceDepartment
    {
        public static void main(String [] args)
        {
            int x=1;
            DecimalFormat df = new DecimalFormat("00");
            System.out.println(df.format(x));
        }
    }
```

### 答案四，自己实现
如果效率很重要的话，相比于 String.format 函数的可以自己实现
```
    /**
     * @param in The integer value
     * @param fill The number of digits to fill
     * @return The given value left padded with the given number of digits
     */
    public static String lPadZero(int in, int fill){

        boolean negative = false;
        int value, len = 0;

        if(in >= 0){
            value = in;
        } else {
            negative = true;
            value = - in;
            in = - in;
            len ++;
        }

        if(value == 0){
            len = 1;
        } else{         
            for(; value != 0; len ++){
                value /= 10;
            }
        }

        StringBuilder sb = new StringBuilder();

        if(negative){
            sb.append('-');
        }

        for(int i = fill; i > len; i--){
            sb.append('0');
        }

        sb.append(in);

        return sb.toString();       
    }
```
 效率对比
```
    public static void main(String[] args) {
        Random rdm;
        long start;

        // Using own function
        rdm = new Random(0);
        start = System.nanoTime();

        for(int i = 10000000; i != 0; i--){
            lPadZero(rdm.nextInt(20000) - 10000, 4);
        }
        System.out.println("Own function: " + ((System.nanoTime() - start) / 1000000) + "ms");

        // Using String.format
        rdm = new Random(0);        
        start = System.nanoTime();

        for(int i = 10000000; i != 0; i--){
            String.format("%04d", rdm.nextInt(20000) - 10000);
        }
        System.out.println("String.format: " + ((System.nanoTime() - start) / 1000000) + "ms");
    }
```
  - 结果
  - - 自己的实现：1697ms
  - - String.format：38134ms

### 答案，Google Guava
Maven：
```
    <dependency>
         <artifactId>guava</artifactId>
         <groupId>com.google.guava</groupId>
         <version>14.0.1</version>
    </dependency>
    ```
样例：
```
    Strings.padStart("7", 3, '0') returns "007"
    Strings.padStart("2020", 3, '0') returns "2020"
    ```
注意：
Guava 是非常有用的库，它提供了很多有用的功能，包括了Collections, Caches, Functional idioms, Concurrency, Strings, Primitives, Ranges, IO, Hashing, EventBus等


## 如何用一行代码初始化一个ArrayList

### 问题
为了测试，我需要临时快速创建一个list。一开始我这样做：
```java
ArrayList<String> places = new ArrayList<String>();
places.add("Buenos Aires");
places.add("Córdoba");
places.add("La Plata");
```
之后我重构了下
```java
ArrayList<String> places = new ArrayList<String>(
    Arrays.asList("Buenos Aires", "Córdoba", "La Plata"));
```
是否有更加简便的方法呢？

### 回答

#### 常见方式
实际上，也许“最好”的方式，就是你写的这个方式，因为它不用再创建新的`List`:
```
ArrayList<String> list = new ArrayList<String>();
list.add("A");
list.add("B");
list.add("C");
```
只是这个方式看上去要多写些代码，让人郁闷

#### 匿名内部类
当然，还有其他方式，例如,写一个匿名内部类，然后在其中做初始化（也被称为 brace initialization）：
```
ArrayList<String> list = new ArrayList<String>() {{
    add("A");
    add("B");
    add("C");
}};
```
但是，我不喜欢这个方式。只是为了做个初始化，却要在`ArrayList`的同一行后面加这么一坨代码。

#### Arrays.asList
```
List<String> places = Arrays.asList("Buenos Aires", "Córdoba", "La Plata");
```
#### Collections.singletonList
```
List<String> places = Collections.singletonList("Buenos Aires");
```
注意：后面的这两种方式，得到的是一个定长的`List`(如果add操作会抛异常）。如果你需要一个不定长的`List`,可以这样做：
```
ArrayList<String> places = new ArrayList<>(Arrays.asList("Buenos Aires", "Córdoba", "La Plata"));

```

## 为什么在java中存放密码更倾向于char[]而不是String

### 问题

在Swing中，password字段有一个getPassword()方法（返回char[]），而不是通常的getText()方法(返回String字符串)。同样的，我看到一个建议说不要使用字符串处理密码。
为什么在涉及passwords时，都说字符串会对安全构成威胁？感觉使用char[]不是那么的方便。

### 回答
String是不可变的。虽然String加载密码之后可以把这个变量扔掉，但是字符串并不会马上被GC回收，一但进程在GC执行到这个字符串之前被dump，dump出的的转储中就会含有这个明文的字符串。那如果我去“修改”这个字符串，比如把它赋一个新值，那么是不是就没有这个问题了？答案是否定的，因为String本身是不可修改的，任何基于String的修改函数都是返回一个新的字符串，原有的还会在内存里。

然而对于数组，你可以在抛弃它之前直接修改掉它里面的内容或者置为乱码，密码就不会存在了。但是如果你什么也不做直接交给gc的话，也会存在上面一样的问题。

所以，这是一个安全性的问题--但是，即使使用char[]也仅仅是降低了攻击者攻击的机会，而且仅仅对这种特定的攻击有效。

# 初始化静态map #

## 问题 ##

怎么在Java中初始化一个静态的map

我想到的两种方法如下，大家是否有更好的建议呢？

**方法一**：static初始化器

**方法二**：实例初始化（匿名子类）

下面是描述上面两种方法的例子
```
	import java.util.HashMap;
	import java.util.Map;
	public class Test{
		private static final Map<Integer, String> myMap = new HashMap<Integer, String>();
		static {
			myMap.put(1, "one");
			myMap.put(2, "two");
		}

		private static final Map<Integer, String> myMap2 = new HashMap<Integer, String>(){
			{
				put(1, "one");
				put(2, "two");
			}
		};
	}
```
    

## 答案 ##

### 答案1 ###

匿名子类初始化器是java的语法糖，我搞不明白为什么要用匿名子类来初始化，而且，如果类是final的话，它将不起作用

我使用static初始化器来创建一个固定长度的静态map
```
	public class Test{
		private static final Map<Integer, String> myMap;
		static{
			Map<Integer, String> aMap = ...;
			aMap.put(1,"one");
			aMap.put(2,"two");
			myMap = Collections.unmodifiableMap(aMap);
		}
	}
```

### 答案2 ###

我喜欢用Guava（是 Collection 框架的增强）的方法初始化一个静态的，不可改变的map

```
    static final Map<Integer, String> MY_MAP = ImmutableMap.of(
	    1, "one",
	    2, "two"
    )
    
```


- 当map的 entry个数超过5个时，你就不能使用`ImmutableMap.of`。可以试试`ImmutableMap.bulider()`


```
    static final Map<Integer, String> MY_MAP = ImmutableMap.<Integer, String>builder()
            .put(1, "one")
            .put(2, "two")
            // ...
            .put(15, "fifteen")
            .build();
	
```

## 给3个布尔变量，当其中有2个或者2个以上为true才返回true

### 问题
给3个boolean变量，a,b,c，当其中有2个或2个以上为true时才返回true？
* 最笨的方法：
```java
boolean atLeastTwo(boolean a, boolean b, boolean c) 
{
    if ((a && b) || (b && c) || (a && c)) 
    {
        return true;
    }
    else
    {
        return false;
    }
}
```
* 优雅解法1
```java
    return a ? (b || c) : (b && c);
```

* 优雅解法2
```java
    return (a==b) ? a : c;
```

* 优雅解法3
```java
   return a ^ b ? c : a
```

* 优雅解法4
```java
    return a ? (b || c) : (b && c);
```

## 获取完整的堆栈信息

### 问题
捕获了异常后，如何获取完整的堆栈轨迹（stack trace）

### 回答

```java
String fullStackTrace = org.apache.commons.lang.exception.ExceptionUtils.getFullStackTrace(e)
```

````java
Thread.currentThread().getStackTrace();
````
