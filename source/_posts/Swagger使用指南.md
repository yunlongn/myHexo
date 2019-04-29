title: Swagger使用指南
author: RolandLee
tags:
  - 工具
categories:
  - java
date: 2019-04-19 08:21:00
---
# Swagger使用指南

> 现代化的研发组织架构中，一个研发团队基本包括了产品组、后端组、前端组、APP端研发、测试组、UI组等，各个细分组织人员各司其职，共同完成产品的全周期工作。如何进行组织架构内的有效高效沟通就显得尤其重要。其中，如何构建一份合理高效的接口文档更显重要。
> 
> 接口文档横贯各个端的研发人员，但是由于接口众多，细节不一，有时候理解起来并不是那么容易，引起‘内战’也在所难免， 并且维护也是一大难题。
> 
> 类似RAP文档管理系统，将接口文档进行在线维护，方便了前端和APP端人员查看进行对接开发，但是还是存在以下几点问题：

- 文档是接口提供方手动导入的，是静态文档，没有提供接口测试功能；
- 维护的难度不小

Swagger的出现可以完美解决以上传统接口管理方式存在的痛点。本文介绍Spring Boot整合Swagger2的流程，连带填坑。
<!--more-->
**使用流程如下：**

**1）引入相应的maven包：**

```
<dependency>
  <groupId>io.springfox</groupId>
  <artifactId>springfox-swagger2</artifactId>
  <version>2.7.0</version>
</dependency>

<dependency>
  <groupId>io.springfox</groupId>
  <artifactId>springfox-swagger-ui</artifactId>
  <version>2.7.0</version>
</dependency>
```

**2）编写Swagger2的配置类：**

```
package com.trace.configuration;

import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

/**
* Created by Trace on 2018-05-16.<br/>
* Desc: swagger2配置类
*/
@SuppressWarnings({"unused"})
@Configuration @EnableSwagger2
public class Swagger2Config {
   @Value("${swagger2.enable}") private boolean enable;

   @Bean("UserApis")
   public Docket userApis() {
       return new Docket(DocumentationType.SWAGGER_2)
           .groupName("用户模块")
           .select()
           .apis(RequestHandlerSelectors.withClassAnnotation(Api.class))
           .paths(PathSelectors.regex("/user.*"))
           .build()
           .apiInfo(apiInfo())
           .enable(enable);
   }

   @Bean("CustomApis")
   public Docket customApis() {
       return new Docket(DocumentationType.SWAGGER_2)
           .groupName("客户模块")
           .select()
           .apis(RequestHandlerSelectors.withClassAnnotation(Api.class))
           .paths(PathSelectors.regex("/custom.*"))
           .build()
           .apiInfo(apiInfo())
           .enable(enable);
   }

   private ApiInfo apiInfo() {
       return new ApiInfoBuilder()
           .title("XXXXX系统平台接口文档")
           .description("提供子模块1/子模块2/子模块3的文档, 更多请关注公众号: 随行享阅")
           .termsOfServiceUrl("https://xingtian.github.io/trace.github.io/")
           .version("1.0")
           .build();
   }
}
```

- 如上可见：通过注解@EnableSwagger2开启swagger2，apiInfo是接口文档的基本说明信息，包括标题、描述、服务网址、联系人、版本等信息；
- 在Docket创建中，通过groupName进行分组，paths属性进行过滤，apis属性可以设置扫描包，或者通过注解的方式标识；通过enable属性，可以在application-{profile}.properties文件中设置相应值，主要用于控制生产环境不生成接口文档。

**3）controller层类和方法添加相关注解**
```
package com.trace.controller;

import com.trace.bind.ResultModel;
import com.trace.entity.po.Area;
import com.trace.entity.po.User;
import com.trace.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import java.util.List;

/**
 * Created by Trace on 2017-12-01.<br/>
 * Desc: 用户管理controller
 */
@SuppressWarnings("unused")
@RestController @RequestMapping("/user")
@Api(tags = "用户管理")
public class UserController {
    @Resource private UserService userService;

    @GetMapping("/query/{id}")
    @ApiOperation("通过ID查询")
    @ApiImplicitParam(name = "id", value = "用户ID", required = true, dataType = "int", paramType = "path")
    public ResultModel<User> findById(@PathVariable int id) {
        User user = userService.findById(id);
        return ResultModel.success("id查询成功", user);
    }


    @GetMapping("/query/ids")
    @ApiOperation("通过ID列表查询")
    public ResultModel<List<User>> findByIdIn(int[] ids) {
        List<User> users = userService.findByIdIn(ids);
        return ResultModel.success("in查询成功", users);
    }


    @GetMapping("/query/user")
    @ApiOperation("通过用户实体查询")
    public ResultModel<List<User>> findByUser(User user) {
        List<User> users = userService.findByUser(user);
        return ResultModel.success("通过实体查询成功", users);
    }


    @GetMapping("/query/all")
    @ApiOperation("查询所有用户")
    public ResultModel<List<User>> findAll() {
        List<User> users = userService.findAll();
        return ResultModel.success("全体查找成功", users);
    }


    @GetMapping("/query/username")
    @ApiOperation("通过用户名称模糊查询")
    @ApiImplicitParam(name = "userName", value = "用户名称")
    public ResultModel<List<User>> findByUserName(String userName) {
        List<User> users = userService.findByUserName(userName);
        return ResultModel.success(users);
    }


    @PostMapping("/insert")
    @ApiOperation("新增默认用户")
    public ResultModel<Integer> insert() {
        User user = new User();
        user.setUserName("zhongshiwen");
        user.setNickName("zsw");
        user.setRealName("钟仕文");
        user.setPassword("zsw123456");
        user.setGender("男");
        Area area = new Area();
        area.setLevel((byte) 5);
        user.setArea(area);
        userService.save(user);
        return ResultModel.success("新增用户成功", user.getId());
    }


    @PutMapping("/update")
    @ApiOperation("更新用户信息")
    public ResultModel<Integer> update(User user) {
        int row = userService.update(user);
        return ResultModel.success(row);
    }


    @PutMapping("/update/status")
    @ApiOperation("更新单个用户状态")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "用户ID", required = true),
            @ApiImplicitParam(name = "status", value = "状态", required = true)
    })
    public ResultModel<User> updateStatus(int id, byte status) {
        User user = userService.updateStatus(id, status);
        return ResultModel.success(user);
    }


    @DeleteMapping("/delete")
    @ApiOperation("删除单个用户")
    @ApiImplicitParam(value = "用户ID", required = true)
    public ResultModel<Integer> delete(int id) {
        return ResultModel.success(userService.delete(id));
    }
}
```

**4）返回对象ResultModel**

```
package com.trace.bind;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

/**
* Created by Trace on 2017-12-01.<br/>
* Desc:  接口返回结果对象
*/
@SuppressWarnings("unused")
@Getter @Setter @ApiModel(description = "返回结果")
public final class ResultModel<T> {
    @ApiModelProperty("是否成功: true or false")
    private boolean result;
    @ApiModelProperty("描述性原因")
    private String message;
    @ApiModelProperty("业务数据")
    private T data;

    private ResultModel(boolean result, String message, T data) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    public static<T> ResultModel<T> success(T data) {
        return new ResultModel<>(true, "SUCCESS", data);
    }


    public static<T> ResultModel<T> success(String message, T data) {
        return new ResultModel<>(true, message, data);
    }


    public static ResultModel failure() {
        return new ResultModel<>(false, "FAILURE", null);
    }


    public static ResultModel failure(String message) {
        return new ResultModel<>(false, message, null);
    }
}

```

**5）ApiModel属性对象 -- User实体**

```
package com.trace.entity.po;

import com.trace.mapper.base.NotPersistent;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Created by Trace on 2017-12-01.<br/>
 * Desc: 用户表tb_user
 */
@SuppressWarnings("unused")
@Data @NoArgsConstructor @AllArgsConstructor
@ApiModel
public class User {
    @ApiModelProperty("用户ID") private Integer id;
    @ApiModelProperty("账户名") private String userName;
    @ApiModelProperty("用户昵称") private String nickName;
    @ApiModelProperty("真实姓名") private String realName;
    @ApiModelProperty("身份证号码") private String identityCard;
    @ApiModelProperty("性别") private String gender;
    @ApiModelProperty("出生日期") private LocalDate birth;
    @ApiModelProperty("手机号码") private String phone;
    @ApiModelProperty("邮箱") private String email;
    @ApiModelProperty("密码") private String password;
    @ApiModelProperty("用户头像地址") private String logo;
    @ApiModelProperty("账户状态 0:正常; 1:冻结; 2:注销") private Byte status;
    @ApiModelProperty("个性签名") private String summary;
    @ApiModelProperty("用户所在区域码") private String areaCode;
    @ApiModelProperty("注册时间") private LocalDateTime registerTime;
    @ApiModelProperty("最近登录时间") private LocalDateTime lastLoginTime;

    @NotPersistent @ApiModelProperty(hidden = true)
    private transient Area area; //用户所在地区

    @NotPersistent @ApiModelProperty(hidden = true)
    private transient List<Role> roles; //用户角色列表
}
```

**简单说下Swagger2几个重要注解：**

@Api：用在请求的类上，表示对类的说明  
- tags "说明该类的作用，可以在UI界面上看到的注解" 
- value "该参数没什么意义，在UI界面上也看到，所以不需要配置" 


@ApiOperation：用在请求的方法上，说明方法的用途、作用 
- value="说明方法的用途、作用" 
- notes="方法的备注说明" 

@ApiImplicitParams：用在请求的方法上，表示一组参数说明 

@ApiImplicitParam：用在@ApiImplicitParams注解中，指定一个请求参数的各个方面
- value：参数的汉字说明、解释 
- required：参数是否必须传 
- paramType：参数放在哪个地方 
- - header --> 请求参数的获取：@RequestHeader 
- - query --> 请求参数的获取：@RequestParam 
- - path（用于restful接口）--> 请求参数的获取：@PathVariable 
- - body（不常用） 
- - form（不常用） 
- dataType：参数类型，默认String，其它值dataType="Integer" 
- defaultValue：参数的默认值 

@ApiResponses：用在请求的方法上，表示一组响应 

@ApiResponse：用在@ApiResponses中，一般用于表达一个错误的响应信息 
- code：数字，例如400 
- message：信息，例如"请求参数没填好" 
- response：抛出异常的类 

@ApiModel：主要有两种用途：
- 用于响应类上，表示一个返回响应数据的信息 
- 入参实体：使用@RequestBody这样的场景，请求参数无法使用@ApiImplicitParam注解进行描述的时候

@ApiModelProperty：用在属性上，描述响应类的属性

**最终呈现结果： **

如前所述：通过maven导入了swagger-ui：

```
<dependency>
  <groupId>io.springfox</groupId>
  <artifactId>springfox-swagger-ui</artifactId>
  <version>2.7.0</version>
</dependency>
```

那么，启动应用后，会自动生成http://{root-path}/swagger-ui.html页面，访问后，效果如下所示：

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190422114150.png)

可以在线测试接口，如通过ID查询的接口/user/query/{id}

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190422114141.png)

![](https://images-roland.oss-cn-shenzhen.aliyuncs.com//blog/20190422114145.png)

