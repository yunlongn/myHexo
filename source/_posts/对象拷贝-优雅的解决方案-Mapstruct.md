title: 对象拷贝 - 优雅的解决方案 Mapstruct
author: RolandLee
tags: []
categories:
  - java
date: 2019-05-29 14:54:00
---
- MapStruct [GitHub 访问地址 : https://github.com/mapstruct/mapstruct/](https://github.com/mapstruct/mapstruct/)

- 使用例子 : [https://github.com/mapstruct/mapstruct-examples](https://github.com/mapstruct/mapstruct-examples)

- MapStrcut与其它工具对比以及使用说明!  [http://www.tuicool.com/articles/uiIRjai](http://www.tuicool.com/articles/uiIRjai)

- 是否一直在使用BeanUtils.copyProperties 用于对象属性拷贝。 出现种种小问题。
- - 会将同名属性拷贝到另外一个对象中，操作方便但是存在一个缺陷 （速度慢）
- - 有些同名字段却无法进行特殊化处理，将会导致不想修改的字段被覆盖。也不能自定义属性映射
<!--more-->
- 在 mvc层 我们经常会DTO对象返回给前端 进行字段渲染。我们不喜欢将所有字段都显示给前端，或者我们需要修改字段返回给前端，例如 数据中存储的上架下架是0，1  但是前端需要的字段是true 和 false。 我们都得进行手动判断处理然后编辑成DTO返回给前端

  `MapStruct`是一种类型安全的`bean`映射类生成`java注释处理器`。
我们要做的就是定义一个映射器接口，声明任何必需的映射方法。在编译的过程中，MapStruct会生成此接口的实现。该实现使用纯java方法调用的源和目标对象之间的映射，MapStruct节省了时间，通过生成代码完成繁琐和容易出错的代码逻辑。。

- MapStruct 拥有的优点：
- - 使用普通方法调用而不是反射来快速执行，他会在编译器生成相应的 Impl 方法调用时直接通过简单的 getter/setter调用而不是反射或类似的方式将值从源复制到目标
- - 编译时类型安全性 : 只能映射彼此的对象和属性，不能将商品实体意外映射到用户 DTO等
- - 在构建时清除错误报告，如 映射不完整 (并非所有目标属性都被映射) 或 映射不正确(无法找到适当的映射方法或类型转换)

- MapStruct 提供的重要注解 :
- - @Mapper : 标记这个接口作为一个映射接口，并且是编译时 MapStruct 处理器的入口
- - @Mapping : 解决源对象和目标对象中，属性名字不同的情况
- - Mappers.getMapper 自动生成的接口的实现可以通过 Mapper 的 class对象获取，从而让客户端可以访问 Mapper接口的实现

```
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"

         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0http://maven.apache.org/xsd/maven-4.0.0.xsd">

   
    <properties>

       // ...

        <org.mapstruct.version>1.2.0.Final</org.mapstruct.version>

    </properties>

 

    <dependencies>

        ...

        <!-- MapStruct START -->

        <dependency>

            <groupId>org.mapstruct</groupId>

            <artifactId>mapstruct-jdk8</artifactId>

            <version>${org.mapstruct.version}</version>

        </dependency>

        <dependency>

            <groupId>org.mapstruct</groupId>

            <artifactId>mapstruct-processor</artifactId>

            <version>${org.mapstruct.version}</version>

        </dependency>

        <!-- MapStruct END -->

    </dependencies>

 

    <build>

        <plugins>

            <plugin>

                <groupId>org.springframework.boot</groupId>

                <artifactId>spring-boot-maven-plugin</artifactId>

            </plugin>

            <plugin>

                <groupId>org.apache.maven.plugins</groupId>

                <artifactId>maven-compiler-plugin</artifactId>

                <version>3.5.1</version>

                <configuration>

                    <source>1.8</source>

                    <target>1.8</target>

                    <annotationProcessorPaths>

                        <path>

                            <groupId>org.mapstruct</groupId>

                            <artifactId>mapstruct-processor</artifactId>

                            <version>${org.mapstruct.version}</version>

                        </path>

                    </annotationProcessorPaths>

                    <compilerArgs>

                        <compilerArg>-Amapstruct.defaultComponentModel=spring</compilerArg>

                        <compilerArg>-Amapstruct.suppressGeneratorTimestamp=true</compilerArg>

                        <compilerArg>-Amapstruct.suppressGeneratorVersionInfoComment=true</compilerArg>

                    </compilerArgs>

                </configuration>

            </plugin>

        </plugins>

    </build>

</project>
```


- BasicObjectMapper包含了4个基本方法，单个和集合以及反转的单个和集合。开发中如需要对象转换操作可直接新建 interface 并继承 BasicObjectMapper，并在新建的接口上加上 @Mapper(componentModel = "spring")，如果是属性中包含其它类以及该类已经存在 Mapper 则注解中加上 users = {类名.class}。componentModel = "spring" 该配置表示生成的实现类默认加上 spring @Component 注解，使用时可直接通过 @Autowire 进行注入

```
public interface BasicObjectMapper<SOURCE, TARGET> {

 
    @Mappings({})

    @InheritConfiguration

    TARGET to(SOURCE var1);

 
    @InheritConfiguration

    List<TARGET> to(List<SOURCE> var1);

 
    @InheritInverseConfiguration

    SOURCE from(TARGET var1);

 
    @InheritInverseConfiguration

    List<SOURCE> from(List<TARGET> var1);

 
}

```

- 直接使用进行对象数据转换

```
@Data

public class ProductCategory {

    /** 类别编码 */

    private String categoryCode;

    /** 类别名称 */

    private String categoryName;

}

 
@Data

public class CategoryVo {

    private String code;

    private String name;

}

 


import org.mapstruct.Mapper;

import org.mapstruct.Mapping;

import org.mapstruct.Mappings;

import org.mapstruct.factory.Mappers;

@Mapper

public interface CategoryMapper extends BasicObjectMapper<CategoryVo, ProductCategory> {

    CategoryMapper MAPPER = Mappers.getMapper(CategoryMapper.class);

    @Mappings({

            @Mapping(source = "code", target = "categoryCode"),

            @Mapping(source = "name", target = "categoryName")

    })

    ProductCategory to(CategoryVo source);

}

public static void main(String[] args) {

    CategoryMapper categoryMapper = CategoryMapper.MAPPER;

 

    CategoryVo vo = new CategoryVo();

    vo.setCode("0000");

    vo.setName("属性名称");

 

    ProductCategory pc = categoryMapper.to(vo); // 通过 to方法得到 ProductCategory

    System.out.println("1" + pc);

 

    CategoryVo vo1 = categoryMapper.from(pc); // 通过 from方法得到 CategoryVo，既反转 to方法

    System.out.println("2" + vo1);

 

    List<ProductCategory> pcList = categoryMapper.to(Arrays.asList(vo, vo1)); // 通过to方法从集合得到转换后的集合

    System.out.println("3" + pcList);

 

    List<CategoryVo> voList = categoryMapper.from(pcList); // 反转集合

    System.out.println("4" + voList);

}


```


- 自定义方法添加到映射器 : 在某些情况下，需要手动实现 MapStruct 无法生成的从一种类型到另一种类型的特定映射，有如下两种实现方法 :
- 方法1> 在另一个类上实现此类方法，然后由 MapStruct 生成的映射器使用该方法
- 方法2> 在Java 8或更高版本时，可以直接在映射器界面中实现自定义方法作为默认方法。如果参数和返回类型匹配，生成的代码将调用默认方法

```
@Mapper

public interface CarMapper {
		
    CarMapper MAPPER = Mappers.getMapper(CarMapper.class);
    
    @Mappings({...})

    CarDto carToCarDto(Car car);

 

    default PersonDto personToPersonDto(Person person) {

        // hand-written mapping logic

    }

}
```


- 映射器也可以定义为抽象类的形式而不是接口，并直接在此映射器类中实现自定义方法。在这种情况下，MapStruct将生成抽象类的扩展，并实现所有抽象方法。这种方法优于声明默认方法的优点是可以在映射器类中声明附加字段

```
@Mapper

public abstract class CarMapper {

    @Mappings(...)

    public abstract CarDto carToCarDto(Car car);

 

    public PersonDto personToPersonDto(Person person) {

        // hand-written mapping logic

    }

}
```
- 多源参数映射方法 : MapStruct 支持多个源参数的映射方法，将几个实体组合成一个数据传输对象

```
@Mapper

public interface AddressMapper {

    @Mappings({

        @Mapping(source = "person.description", target = "description"),

        @Mapping(source = "address.houseNo", target = "houseNumber")

    })

    DeliveryAddressDto personAndAddressToDeliveryAddressDto(Person person, Address address);

}
```
- 如果多个源对象定义了一个具有相同名称的属性，则必须使用 @Mapping 注释来指定从中检索属性的源参数，如果这种歧义未得到解决，将会引发错误。对于在给定源对象中只存在一次的属性，指定源参数的名称是可选的，因为它可以自动确定

```
MapStruct 还提供直接引用源参数

@Mapper

public interface AddressMapper {

    @Mappings({

        @Mapping(source = "person.description", target = "description"),

        @Mapping(source = "hn", target = "houseNumber")

    })

    DeliveryAddressDto personAndAddressToDeliveryAddressDto(Person person, Integer hn);

}

```

- 直接字段访问映射 : MapStruct 支持 public 没有 getter/setter 的字段的映射，如果 MapStruct 无法为属性找到合适的 getter/setter方法，MapStruct 将使用这些字段作为 读/写访问器。如果它是 public，则字段被认为是读取存取器 public final。如果一个字段 static 不被视为读取存取器只有在字段被认为是写入访问者的情况下 public。如果一个字段 final 和/或 static 它不被认为是写入访问者

```
public class Customer {

    private Long id;

    private String name;

    // getters and setter omitted for brevity

}

 

public class CustomerDto {

    public Long id;

    public String customerName;

}

 

@Mapper

public interface CustomerMapper {

    CustomerMapper MAPPER = Mappers.getMapper( CustomerMapper.class );
 
    @Mapping(source = "customerName", target = "name")
    Customer toCustomer(CustomerDto customerDto);

 
    @InheritInverseConfiguration
    CustomerDto fromCustomer(Customer customer);

}

// 生成的映射器如下

public class CustomerMapperImpl implements CustomerMapper {

    @Override

    public Customer toCustomer(CustomerDto customerDto) {

        // ...

        customer.setId( customerDto.id );

        customer.setName( customerDto.customerName );

        // ...

    }

 

    @Override

    public CustomerDto fromCustomer(Customer customer) {

        // ...

        customerDto.id = customer.getId();

        customerDto.customerName = customer.getName();

        // ...
    }
}

```

- 检索映射器 : Mapper实例 通过 org.mapstruct.factory.Mappers 的  getMapper() 方法来检索。通常 映射器接口应该定义一个名为的成员 INSTANCE ，它包含一个映射器类型的单个实例 :


```
@Mapper

public interface CarMapper {

    CarMapper INSTANCE = Mappers.getMapper(CarMapper.class);

 

    CarDto carToCarDto(Car car);

}

这种模式使客户非常容易地使用映射器对象，而无需反复实例化新的实例 :

Car car = ...;

CarDto dto = CarMapper.INSTANCE.carToCarDto( car );

 

使用依赖注入 : 通过 Spring 依赖注入可以获取映射器对象

@Mapper(componentModel = "spring")

public interface CarMapper {

    CarDto carToCarDto(Car car);

}


@Inject
private CarMapper mapper;
```

- 数据类型转换 : 源对象和目标对象中映射的属性类型可能不同，MapStruct 提供自动处理类型转换，提供如下自动转换 :
- - 1> Java基本数据类型及其相应的包装类型，如 int 和 Integer，boolean 和 Boolean 等生成的代码是 null 转换一个包装型成相应的原始类型时一个感知，即 null 检查将被执行
- - 2> Java基本号码类型和包装类型，例如之间 int 和 long 或 byte 和 Integer (大类类型数据转换成小类可能出现精度损失)
- - 3> 所有Java基本类型之间 (包括其包装) 和 String 之间，例如 int 和 String 或 Boolean 和 String，java.text.DecimalFormat 均可以指定格式字符串
- - int 到 String的转换

```
int 到 String的转换

@Mapper

public interface CarMapper {

    @Mapping(source = "price", numberFormat = "$#.00")

    CarDto carToCarDto(Car car);

 

    @IterableMapping(numberFormat = "$#.00")

    List<String> prices(List<Integer> prices);

}

BigDecimal 转换为 String

@Mapper

public interface CarMapper {

    @Mapping(source = "power", numberFormat = "#.##E0")

    CarDto carToCarDto(Car car);

}

从日期到字符串的转换

@Mapper

public interface CarMapper {

    @Mapping(source = "manufacturingDate", dateFormat = "dd.MM.yyyy")

    CarDto carToCarDto(Car car);

 

    @IterableMapping(dateFormat = "dd.MM.yyyy")

    List<String> stringListToDateList(List<Date> dates);

}

 

映射对象引用 : 对象中如果包含另一个对象的引用，此时只需为引用的对象类型定义映射方法即可

@Mapper

public interface CarMapper {

    CarDto carToCarDto(Car car);

 

    PersonDto personToPersonDto(Person person);

}

 

# 映射器控制嵌套的bean映射

@Mapper

public interface FishTankMapper {

    @Mappings({

    @Mapping(target = "fish.kind", source = "fish.type"),

    @Mapping(target = "fish.name", ignore = true),

    @Mapping(target = "plant", ignore = true ),

    @Mapping(target = "ornament", ignore = true ),

    @Mapping(target = "material", ignore = true),

    @Mapping(target = "ornament", source = "interior.ornament"),

    @Mapping(target = "material.materialType", source = "material"),

    @Mapping(target = "quality.report.organisation.name", source = "quality.report.organisationName")

    })

    FishTankDto map( FishTank source );

}

```

- 调用其他映射器 : MapStruct 中可以调用在其他类中定义的映射方法，无论是由MapStruct生成的映射器还是手写映射方法

```
# 手动实现的映射

public class DateMapper {

    public String asString(Date date) {

        return date != null ? new SimpleDateFormat("yyyy-MM-dd").format(date) : null;

    }

    public Date asDate(String date) {

        try {

            return date != null ? new SimpleDateFormat("yyyy-MM-dd").parse(date) : null;

        } catch (ParseException e) {

            throw new RuntimeException(e);

        }

    }

}

 

# 引用另一个映射器类

@Mapper(uses = DateMapper.class)

public class CarMapper {

    CarDto carToCarDto(Car car);

}

```
- 当为该  carToCarDto() 方法的实现生成代码时，MapStruct将查找将 Date 对象映射到String的方法，在 DateMapper 该类上找到它并生成 asString() 用于映射该 manufacturingDate 属性的调用
- 映射集合 : 集合类型(映射 List，Set 等等) 以相同的方式映射 bean类型，通过定义与在映射器接口所需的源和目标类型的映射方法。生成的代码将包含一个遍历源集合的循环，转换每个元素并将其放入目标集合中。如果在给定的映射器或其使用的映射器中找到了集合元素类型的映射方法，则会调用此方法以执行元素转换。或者，如果存在源和目标元素类型的隐式转换，则将调用此转换例程

```
@Mapper

public interface CarMapper {

    Set<String> integerSetToStringSet(Set<Integer> integers);

    List<CarDto> carsToCarDtos(List<Car> cars);

    CarDto carToCarDto(Car car);

}

 

# 生成的集合映射方法

@Override

public Set<String> integerSetToStringSet(Set<Integer> integers) {

    if (integers == null) {

        return null;

    }

    Set<String> set = new HashSet<>();

    for (Integer integer : integers) {

        set.add(String.valueOf(integer));

    }

    return set;

}

 

@Override

public List<CarDto> carsToCarDtos(List<Car> cars) {

    if (cars == null) {

        return null;

    }

    List<CarDto> list = new ArrayList<>();

    for (Car car : cars) {

        list.add(carToCarDto(car));

    }

    return list;

}

 

映射Map :

public interface SourceTargetMapper {

    @MapMapping(valueDateFormat = "dd.MM.yyyy")

    Map<String, String> longDateMapToStringStringMap(Map<Long, Date> source);

}

 

映射流 :

@Mapper

public interface CarMapper {

    Set<String> integerStreamToStringSet(Stream<Integer> integers);

    List<CarDto> carsToCarDtos(Stream<Car> cars);

    CarDto carToCarDto(Car car);

}

```

- 映射枚举 : 默认情况下，源枚举中的每个常量映射到目标枚举类型中具有相同名称的常量。如果需要，可以使用 @ValueMapping 注释帮助将source enum中的常量映射为具有其他名称的常量


```
@Mapper

public interface OrderMapper {

    OrderMapper INSTANCE = Mappers.getMapper(OrderMapper.class);

    @ValueMappings({

            @ValueMapping(source = "EXTRA", target = "SPECIAL"),

            @ValueMapping(source = "STANDARD", target = "DEFAULT"),

            @ValueMapping(source = "NORMAL", target = "DEFAULT")

    })

    ExternalOrderType orderTypeToExternalOrderType(OrderType orderType);

}

 

默认值和常量 : 

@Mapper(uses = StringListMapper.class)

public interface SourceTargetMapper {

    SourceTargetMapper INSTANCE = Mappers.getMapper(SourceTargetMapper.class);

 

    @Mappings({

            @Mapping(target = "stringProperty", source = "stringProp", defaultValue = "undefined"),

            @Mapping(target = "longProperty", source = "longProp", defaultValue = "-1"),

            @Mapping(target = "stringConstant", constant = "Constant Value"),

            @Mapping(target = "integerConstant", constant = "14"),

            @Mapping(target = "longWrapperConstant", constant = "3001"),

            @Mapping(target = "dateConstant", dateFormat = "dd-MM-yyyy", constant = "09-01-2014"),

            @Mapping(target = "stringListConstants", constant = "jack-jill-tom")

    })

    Target sourceToTarget(Source s);

}

 

表达式 :

@Mapper

public interface SourceTargetMapper {

    SourceTargetMapper INSTANCE = Mappers.getMapper(SourceTargetMapper.class);

 

    @Mapping(target = "timeAndFormat", expression = "java( new org.sample.TimeAndFormat( s.getTime(), s.getFormat() ) )")

    Target sourceToTarget(Source s);

}
```

- 确定结果类型 : 当结果类型具有继承关系时，选择映射方法(@Mapping) 或工厂方法(@BeanMapping) 可能变得不明确。假设一个Apple和一个香蕉，这两个都是 Fruit的专业

```
@Mapper(uses = FruitFactory.class)

public interface FruitMapper {

    @BeanMapping(resultType = Apple.class)

    Fruit map(FruitDto source);

}

 

public class FruitFactory {

    public Apple createApple() {

        return new Apple("Apple");

    }

    public Banana createBanana() {

        return new Banana("Banana");

    }

}
```

- 控制 '空' 参数的映射结果 : 默认情况下 null 会返回，通过指定 nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT 上 @BeanMapping，@IterableMapping，@MapMapping，或全局上 @Mapper 或 @MappingConfig，映射结果可以被改变以返回空默认值
- - 1> Bean映射 : 将返回一个 '空' 目标bean，除常量和表达式外，它们将在存在时填充
- - 2> 基元 : 基元的默认值将被返回，例如 false for boolean 或 0 for int
- - 3> Iterables/Arrays : 一个空的迭代器将被返回
- - 4> 地图 : 将返回空白地图

- 共享配置 : 通过指向中心接口来定义共享配置的可能性 @MapperConfig，要使映射器使用共享配置，需要在 @Mapper#config 属性中定义配置界面。该 @MapperConfig 注释具有相同的属性 @Mapper 注释。任何未通过的属性 @Mapper 都将从共享配置继承。指定 @Mapper 的属性优先于通过引用的配置类指定的属性

```
@MapperConfig(uses = CustomMapperViaMapperConfig.class, unmappedTargetPolicy = ReportingPolicy.ERROR)

public interface CentralConfig {}

 

@Mapper(config = CentralConfig.class, uses = { CustomMapperViaMapper.class } )

public interface SourceTargetMapper {}
```
