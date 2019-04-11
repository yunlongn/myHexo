title: 实现一个免费的图片上传Web Server（带域名，科学上网）
author: RolandLee
tags:
  - heroku
categories:
  - nodejs
date: 2019-04-11 16:52:00
---
#### 一. 框架
- 选用express框架

```
npm init
npm install express --save
```
##### 二. 简单测试请求
- 在当前目录新建index.js文件

```
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("Hello Node.js");
});

const port = 3000;
app.listen(port);
```
- 复制代码在终端输入： <font color="#dd0000">node index.js</font><br /> 

- 在浏览器中打开 <font color="#dd0000">127.0.0.1:3000</font><br /> 

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170434.png)
<!-- more -->
#### 三.使用form上传图片

```
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>upload</title>
</head>
<body>
  <form action="http://127.0.0.1:3000/upload" method="post" enctype="multipart/form-data">
    <div>
      <input type="file" name="avatar" accept="image/*">
    </div>
    <input type="submit" value="上传">
  </form>
</body>
</html>
```

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170445.png)


将index.js中的接口更新成
```
app.post("/upload", (req, res) => {
  res.send('上传成功')
});
```

注意：index.js中的文件只要改了，就要重新启动服务

试着上传一下：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170451.png)

#### 四. 将前端发送的图片储存在服务器中
- 这里需要用到一个叫multer的库

```
npm install multer --save
```

- 根据他的文档，改一下index.js:

```
const express = require("express");
const multer = require("multer");

// 这里定义图片储存的路径，是以当前文件为基本目录
const upload = multer({ dest: "uploads/" });
const app = express();
/* 
  upload.single('avatar') 接受以avatar命名的文件，也就是input中的name属性的值
  avatar这个文件的信息可以冲req.file中获取
*/
app.post("/upload", upload.single("avatar"), (req, res) => {
  console.log(req.file);
  res.send("上传成功");
});

const port = 3000;
app.listen(port);
```

改完之后重新启动服务，再重新上传：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170456.png)

可以看到req.file中就是上传的文件信息。

同时，你会发现当前目录下，会多一个文件夹叫uoloads

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170459.png)

那个很长名字的文件，就是刚刚前端传的图片。只要改一下后缀名就可以预览了：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170501.png)



#### 五. 将储存的图片名返回给前端

一般上传完头像会有一个预览功能，那么只需要后端将上传后的图片名发送给前端，前端重新请求一下图片就好了，前面都是用form默认的提交，这个提交存在一个问题就是，提交完成后页面会发生跳转。所以现在一般都是用ajax进行上传。

```
// js代码
upload.addEventListener('submit', (e) => {
  // 阻止form 的默认行为
  e.preventDefault();
  
  // 创建FormData对象
  var formData = new FormData();
  var fileInput = document.querySelector('input[name="avatar"]');
  formData.append(fileInput.name, fileInput.files[0]);
  
  // 创建XMLHttpRequest
  var xhr = new XMLHttpRequest();
  xhr.open('POST', upload.action);
  xhr.onload = function() {
    console.log(xhr.response)
  }
  xhr.send(formData);
})
```

 小提示：如果HTML的元素有id属性，那么可以不用document.querySelector去选中它，可以直接使用，就像全局变量一样。

```
// index.js
app.post("/upload", upload.single("avatar"), (req, res) => {
  res.json({name: req.file.filename }); // 使用json格式返回数据。 
});
```

这时候重新发送，会出现一个问题：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411170505.png)

由于代码是写在 JS Bin上的，使用AJAX请求不同域名的接口，会出现跨域情况，解决这个问题需要，在index.js中加上一个头部，就是报错信息中的Access-Control-Allow-Origin：
```
app.post("/upload", upload.single("avatar"), (req, res) => {
  res.set('Access-Control-Allow-Origin', '*'); 
  res.json({name: req.file.filename });
});
```
- \* 表示所有其他域名都可访问，也可以将*改为其他允许的域名。

重新发送：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411171237.png)

- 这样成功的上传了图片，并且拿到了上传后的图片名。
- 这里可以使用一个库cors，来完成添加响应头的操作：
- npm install cors --save

修改index.js

```
const express = require("express");
const multer = require("multer");
const cors = require('cors');  // 新增
// 这里定义图片储存的路径，是以当前文件为基本目录
const upload = multer({ dest: "uploads/" });
const app = express();

app.use(cors());  // 新增
/* 
  upload.single('avatar') 接受以avatar命名的文件，也就是input中的name属性的值
  avatar这个文件的信息可以冲req.file中获取
*/
app.post("/upload", upload.single("avatar"), (req, res) => {
  res.json({name: req.file.filename });
});

const port = 3000;
app.listen(port);
```
#### 六. 展示上传后的图片

新定义一个接口：

```
app.get("/preview/:name", (req, res) => {
  res.sendFile(`uploads/${req.params.name}`, {
    root: __dirname,
    headers:{
      'Content-Type': 'image/jpeg',
    },
  }, (error)=>{
    if(error){
      res.status(404).send('Not found')
    }
  });
});
```

/preview:name  这种方式定义接口的路径，请求过来的时候，就可以从  req.params.name  中拿到 /preview/xxxx 中的xxxx了。
修改下HTML:
```
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>JS Bin</title>
</head>
<body>
  <form id="upload" action="http://127.0.0.1:3000/upload" method="post" enctype="multipart/form-data">
    <div>
      <input type="file" name="avatar" accept="image/*">
    </div>
    <input type="submit" value="上传">
  </form>
  <img src="" id="avatarImg">  <!-- 新增 -->
</body>
</html>
```
改下js
```
upload.addEventListener('submit', (e) => {
  // 阻止form 的默认行为
  e.preventDefault();
  
  // 创建FormData对象
  var formData = new FormData();
  var fileInput = document.querySelector('input[name="avatar"]');
  formData.append(fileInput.name, fileInput.files[0]);
  
  // 创建XMLHttpRequest
  var xhr = new XMLHttpRequest();
  xhr.open('POST', upload.action);
  xhr.onload = function() {
    var imgName = JSON.parse(xhr.response).name;  // 新增
    avatarImg.setAttribute('src', 'http://127.0.0.1:3000/preview/' + imgName); // 新增
  }
  xhr.send(formData);
})
```
结果：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411171242.png)

#### 六. 将代码部署到Heroku

- Heroku是一个支持多种编程语言的云平台即服务。最重要的它是免费的。这是他的官方网站Heroku，注意不科学上网的话，可会超级慢或者进不去。而且科学上网要全局模式..


 1. 在部署的时候，有三个选择，我选择选择GitHub
 ![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411171246.png)
 2. 由于选择GitHub，那么还需要创建一个仓库，把代码放上去。
 3. 放上去之间还要改一下代码：
 4. 因为部署是交给heroku的，所以端口号不能写死：
 5. const port = process.env.PORT || 3000;
 6. 在package.json添加一个npm start命令

```
"start": "node index.js"
```
 7.在GitHub上创建仓库并上传代码，过程略,别忘了写.gitignore文件
 8.这是我的仓库地址
 9.在heroku中选择仓库并且选择分支master，部署
 
 ![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411172450.png)

 10.预览

 ![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411172454.png)
 
 
 ![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411172457.png)
这个就是部署好的域名了。

用这个域名试一试
![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190411172459.png)

大功告成。可惜的就是heroku得科学上网才行。