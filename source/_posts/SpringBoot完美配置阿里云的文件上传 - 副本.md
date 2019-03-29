---
title: SpringBoot完美配置阿里云的文件上传
date: 2019-03-28 09:40:08
tags:
- Java
categories:
- Spring Boot
---

个人配置的阿里云上传Utils
<!-- more -->

```
#### 新建一个config类
- AliyunOSS.java
```
@Configuration
@Data
public class AliyunOSS {
    private OSSClient ossClient;


    @Value("${images-roland.file.endpoint}")
    private String endpoint;

    @Value("${images-roland.file.keyid}")
    private String accessKeyId;

    @Value("${images-roland.file.keysecret}")
    private String secretAccessKey;

    @Value("${images-roland.file.filehost}")
    private String file_filehost;

    @Value("${images-roland.file.bucketname1}")
    private String bucketname1;

    @Bean("ossClients")
    public OSSClient ossClient(){
        return new OSSClient(endpoint,accessKeyId,secretAccessKey);
    }
}

```

### 然后在yml中配置你的阿里云信息
```
images-roland:
  file:
    endpoint: oss-cn-shenzhen.aliyuncs.com
    keyid: ********
    keysecret: ********
    bucketname: roland
    filehost: images/
    show_image_host: https://***.oss-cn-shenzhen.aliyuncs.com/
```

#### 然后你就可以在你的业务层使用AliyunOSS啦
```
@Autowired
AliyunOSS aliyunOSS;
```

#### 个人使用的util类
```

import com.aliyun.oss.ClientException;
import com.aliyun.oss.OSSClient;
import com.aliyun.oss.OSSException;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.CreateBucketRequest;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.model.PutObjectResult;
import org.manage.management.permission.config.ConstantProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

/**
 * Created by lightClouds917
 * Date 2018/2/7
 * Description:aliyunOSSUtil
 */
@Slf4j
@Component
public class AliyunOSSUtil {


    private static OSSClient ossClients;

    @Autowired
    public AliyunOSSUtil(OSSClient ossClients) {
        AliyunOSSUtil.ossClients = ossClients;
    }

    public static String upload(File file){
        log.info("=========>OSS文件上传开始："+file.getName());
//        System.out.println(ossClients);

        String bucketName=ConstantProperties.BUCKET_NAME1;
        String fileHost=ConstantProperties.FILE_HOST;

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = format.format(new Date());

        if(null == file){
            return "";
        }

        OSSClient ossClient = ossClients;
        System.out.println(ossClient);
        try {
            //容器不存在，就创建
            if(! ossClient.doesBucketExist(bucketName)){
                ossClient.createBucket(bucketName);
                CreateBucketRequest createBucketRequest = new CreateBucketRequest(bucketName);
                createBucketRequest.setCannedACL(CannedAccessControlList.PublicRead);
                ossClient.createBucket(createBucketRequest);
            }
            //创建文件路径
            String fileUrl = fileHost+"/"+(dateStr + "/" + UUID.randomUUID().toString().replace("-","")+"-"+file.getName());
            //上传文件
            PutObjectResult result = ossClient.putObject(new PutObjectRequest(bucketName, fileUrl, file));
            //设置权限 这里是公开读
            ossClient.setBucketAcl(bucketName,CannedAccessControlList.PublicRead);
            if(null != result){
                log.info("==========>OSS文件上传成功,OSS地址："+fileUrl);
                return fileUrl;
            }
        }catch (OSSException oe){
            log.error(oe.getMessage());

        }catch (ClientException ce){
            log.error(ce.getMessage());

        }finally {
            //关闭
//            ossClient.shutdown();
        }
        return null;
    }
    public static String uploads(File file){
        String bucketName=ConstantProperties.BUCKET_NAME1;
        String fileHost=ConstantProperties.FILE_HOST;

        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        String dateStr = format.format(new Date());

        if(null == file){
            return null;
        }

//        OSSClient ossClient = ossClients;

        // 创建OSSClient实例。
        OSSClient ossClient = ossClients;
        String fileUrl = fileHost+"/"+(dateStr + "/" + UUID.randomUUID().toString().replace("-","")+"-"+file.getName());
        try {
            // 带进度条的上传。
            ossClient.putObject(new PutObjectRequest(bucketName, fileUrl, new FileInputStream(file)).
                    <PutObjectRequest>withProgressListener(new PutObjectProgressListener()));

        } catch (Exception e) {
            e.printStackTrace();
        }
        // 关闭OSSClient。
//        ossClient.shutdown();
        return null;
    }
}
```