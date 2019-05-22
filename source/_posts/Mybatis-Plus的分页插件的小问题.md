title: Mybatis Plus的分页插件的小问题
author: RolandLee
tags:
  - mybatisPlus
categories:
  - Spring Boot
date: 2019-05-08 14:50:00
---
## 一、前言

在spring Boot环境下快速应用Mybatis plus，篇幅中我们使用了BaseMapper，从而可以直接使用selectPage这样的分页，但如果你够细心的话，返回的数据确实是分页后的数据，但在控制台打印的SQL语句其实并没有真正的物理分页，而是通过缓存来获得全部数据中再进行的分页，这样对于大数据量操作时是不可取的，那么接下来就叙述一下，真正实现物理分页的方法。

## 二、分页配置

官方在分页插件上如是描述：自定义查询语句分页（自己写sql/mapper），也就是针对自己在Mapper中写的方法，但经过测试，如果不配置分页插件，其默认采用的分页为RowBounds的分页即逻辑分页，也就是先把数据记录全部查询出来,然在再根据offset和limit截断记录返回（数据量大的时候会造成内存溢出），故而不可取，而通过分页插件的配置即可达到物理分页效果。
<!--more-->
新建一个**MybatisPlusConfig**配置类文件，代码如下所示：

```
package com.szss.admin.config.mybatisplus;
 
import com.baomidou.mybatisplus.plugins.PaginationInterceptor;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
 
/**
 * @author Allen
 * @date 2018/3/14
 */
@Configuration
@MapperScan("com.szss.admin.dao.*")
public class MybatisPlusConfig {
 
    /**
     * mybatis-plus分页插件<br>
     * 文档：http://mp.baomidou.com<br>
     */
    @Bean
    public PaginationInterceptor paginationInterceptor() {
        PaginationInterceptor paginationInterceptor = new PaginationInterceptor();
        return paginationInterceptor;
    }
 
}

```

至此再次对之前代码进行测试，就会发现本次生成的SQL语句有所变化，不再是直接查询所有结果而进行的逻辑分页，而是会自动根据数据库生成对应的物理分页SQL语句，具体可自行在控制台查看SQL体现，本例示例如下：



```
2018-03-14 12:27:04.459 DEBUG 6008 --- [  XNIO-2 task-7] com.szss.admin.dao.RoleDAO.selectPage    : ==>  Preparing: SELECT COUNT(1) FROM admin_role WHERE deleted = 0 
2018-03-14 12:27:04.474 DEBUG 6008 --- [  XNIO-2 task-7] com.szss.admin.dao.RoleDAO.selectPage    : ==> Parameters: 
2018-03-14 12:27:04.487 DEBUG 6008 --- [  XNIO-2 task-7] com.szss.admin.dao.RoleDAO.selectPage    : ==>  Preparing: WITH query AS (SELECT TOP 100 PERCENT ROW_NUMBER() OVER (ORDER BY CURRENT_TIMESTAMP) as __row_number__, ID AS id,role,name,description,enabled,deleted,creator_id AS creatorId,creator,date_created AS dateCreated,modifier_id AS modifierId,modifier,last_modified AS lastModified FROM admin_role WHERE deleted=0) SELECT * FROM query WHERE __row_number__ BETWEEN 6 AND 10 ORDER BY __row_number__ 
2018-03-14 12:27:04.488 DEBUG 6008 --- [  XNIO-2 task-7] com.szss.admin.dao.RoleDAO.selectPage    : ==> Parameters: 
2018-03-14 12:27:04.499 DEBUG 6008 --- [  XNIO-2 task-7] com.szss.admin.dao.RoleDAO.selectPage    : <==      Total: 3

```

而在没有配置分页属性时执行的SQL信息输出内容为：

```
2018-03-14 15:03:50.525 DEBUG 6892 --- [  XNIO-2 task-5] com.szss.admin.dao.RoleDAO.selectPage    : ==>  Preparing: SELECT ID AS id,role,name,description,enabled,deleted,creator_id AS creatorId,creator,date_created AS dateCreated,modifier_id AS modifierId,modifier,last_modified AS lastModified FROM admin_role WHERE deleted=0 
2018-03-14 15:03:50.540 DEBUG 6892 --- [  XNIO-2 task-5] com.szss.admin.dao.RoleDAO.selectPage    : ==> Parameters: 
2018-03-14 15:03:50.557 DEBUG 6892 --- [  XNIO-2 task-5] com.szss.admin.dao.RoleDAO.selectPage    : <==      Total: 8

```

通过swagger进行数据测试时返回的展示结果是一样的，但是控制台输出的SQL语句明显有所区别，当启用分页插件时，首先会进行一个count的总记录条件查询，然后再进行物理分页操作，查询结果为3条记录，而默认是直接获取8条全部数据在由Mybatis进行逻辑分页，这个在大数据量操作时显然是不可取的。

## 三、分页应用

由于我们在DAO层继承了BaseMapper接口，而我们所需要的就是通过Service层来继承ServiceImpl接口，具体代码如下：

```
package com.szss.admin.service;
 
import java.util.Date;
 
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
 
import com.baomidou.mybatisplus.mapper.EntityWrapper;
import com.baomidou.mybatisplus.plugins.Page;
import com.baomidou.mybatisplus.service.impl.ServiceImpl;
import com.szss.admin.dao.RoleDAO;
import com.szss.admin.model.domain.RoleDO;
import com.szss.admin.model.param.ListRoleParam;
import com.szss.admin.model.param.RoleParam;
 
/**
 * 角色服务
 *
 * @author Allen
 * @date 2018/3/7
 */
@Service
public class RoleService extends ServiceImpl<RoleDAO, RoleDO> {
 
 
    /**
     * 新增角色信息
     * @param roleParam 角色参数
     * @return 是否成功
     */
    public Boolean insert(RoleParam roleParam) {
        RoleDO roleDO = new RoleDO();
        roleParam.setDateCreated(new Date());
        BeanUtils.copyProperties(roleParam, roleDO);
        return insert(roleDO);
    }
 
    /**
     * 更新角色信息
     * @param roleParam 角色参数
     * @return 是否成功
     */
    public Boolean update(RoleParam roleParam) {
        RoleDO roleDO = selectById(roleParam.getId());
        roleParam.setLastModified(new Date());
        BeanUtils.copyProperties(roleParam, roleDO);
        return updateById(roleDO);
    }
 
    /**
     * 查询角色列表(分页)
     *
     * @param roleParam 角色参数
     * @return 查询角色分页列表
     */
    public Page<RoleDO> selectListPage(ListRoleParam roleParam) {
        RoleDO roleDO = new RoleDO();
        BeanUtils.copyProperties(roleParam, roleDO);
        Page<RoleDO> page = new Page<RoleDO>((int)roleParam.getPi(), (int)roleParam.getPs());
        EntityWrapper<RoleDO> eWrapper = new EntityWrapper<RoleDO>(roleDO);
        Page<RoleDO> roleDOList = selectPage(page, eWrapper);
        return roleDOList;
    }
 
}
```


这样我们就可以直接使用ServiceImpl实现类中的基本Insert、Update、Delete等操作了，而无须在Service层注入DAO来实现数据库的DML操作了。同时这里selectPage返回的是Page对象与DAO中返回的List对象是有所不同的，等于已经进行了翻页方法的封装，将需要的Page结果直接回传给页面，省去自己编写分页的操作。

## 四、注意事项

- 1、上述中在查询构造器EW中，我们采用的是new EntityWrapper<RoleDO>(roleDO)方法，而不是大多数示例的new EntityWrapper<RoleDO>().eq("name","张三")的这种方式，因为这样就意味着前台name参数是必须要传值的，而在我们大多数设置查询时，用户输入的查询条件是不固定及不明确的，所以本示例中采用如上方法来进行动态生成查询条件，当roleDO前台未传入值时，不会生成对应的where条件，而一旦使用了eq这样的方法，无论前台是否传值都会生成对应的where条件导致操作异常的错误。

- 2、在使用上述方法时domain中的RoleDO通过开启AR(ActiveRecord)模式（<Spring Boot环境下Mybatis Plus的快速应用>已有说明），即RoleDO需要继承Model方法，可直接使用roleDO来进行基本CRUD和分页查询操作。

- 3、当开启AR(ActiveRecord)模式后，对于service层就无须再继承ServiceImpl接口了，可直接进行DML和DQL操作，具体示例代码如下：

```

package com.szss.admin.service;
 
import com.baomidou.mybatisplus.mapper.EntityWrapper;
import com.baomidou.mybatisplus.plugins.Page;
import com.baomidou.mybatisplus.service.impl.ServiceImpl;
import com.szss.admin.dao.RoleDAO;
import com.szss.admin.model.domain.RoleDO;
import com.szss.admin.model.dto.ListRoleDTO;
import com.szss.admin.model.dto.PageInfo;
import com.szss.admin.model.dto.RestCodeEnum;
import com.szss.admin.model.dto.RoleDTO;
import com.szss.admin.model.param.ListRoleParam;
import com.szss.admin.model.param.RoleParam;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
 
/**
 * 角色服务
 *
 * @author Allen
 * @date 2018/3/7
 */
@Service
public class RoleService /**extends ServiceImpl<RoleDAO, RoleDO>*/ {
 
 
 
    /**
     * 新增角色信息
     *
     * @param roleParam 角色信息
     */
    public void insert(RoleParam roleParam) {
        roleParam.setDateCreated(new Date());
        RoleDO roleDO = new RoleDO();
        BeanUtils.copyProperties(roleParam, roleDO);
        roleDO.insert();
    }
 
    /**
     * 更新角色信息
     *
     * @param roleParam 角色信息
     */
    public void update(RoleParam roleParam) {
        RoleDO roleDO = new RoleDO();
        roleParam.setLastModified(new Date());
        BeanUtils.copyProperties(roleParam, roleDO);
        roleDO.updateById();
    }
 
    /**
     * 查询角色列表(分页)
     *
     * @param roleParam
     * @return
     */
    public Page<RoleDO> selectPage(ListRoleParam roleParam) {
        RoleDO roleDO = new RoleDO();
        BeanUtils.copyProperties(roleParam, roleDO);
        Page<RoleDO> page = new Page<RoleDO>(roleParam.getPi().intValue(), roleParam.getPs().intValue());
        EntityWrapper<RoleDO> eWrapper = new EntityWrapper<RoleDO>(roleDO);
        Page<RoleDO> roleDOList = roleDO.selectPage(page,eWrapper);
        return roleDOList;
    }
 
}

```


至此就可以看出AR与非AR之间的区别了，当你引用了Model以后就等于已经实现了相关CRUD和分页查询操作了。至于喜欢哪种方式或哪种更适合你，可自由根据情况进行自主选择。