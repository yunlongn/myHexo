title: 教你你快捷编程 --- 将List<User> 对象的id快速抽取出来
author: RolandLee
date: 2019-06-01 20:33:40
tags:
---

- 在编程过程中 我们总是会遇到 需要将某个集合中的对象的id或者某个属性快速抽取出来。
- 那么我们使用jdk8 的方法 快速的抽取你想要的属性集合
- 啥也不说了  上代码！


- `List<Admin> adminList ->  Set<Integer> adminSet  (id)` 

<!--more-->

```
@Data
public class Admin {
    
    private Integer id;
    private Integer name;
}

 public static void main(String[] args) {
 	    
      List<Admin> adminList = new ArrayList<>();
      Admin adminRoleDO = new Admin();
      adminList.add(adminRoleDO);
      adminList.add(adminRoleDO);
      adminList.add(adminRoleDO);
      adminList.add(adminRoleDO);
      
      
      // 我们需要将这个对象的id 抽取出来变成一个集合。
      // 假设我们需要一个不重复的 id集合  
      Set<Integer> adminSet = adminRoleList.stream().map(Admin::getId).collect(Collectors.toSet());
 		 
      // 如果转换为Map对象  id为key  name为value方法如下
      
      Map<Integer,Integer> adminMap = from.stream().collect(Collectors.toMap(Admin::getId, Admin::getName));
      
      
 }

```