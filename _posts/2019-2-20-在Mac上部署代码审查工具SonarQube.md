## Tips
- 若文章中描述图片缺失请移步：https://github.com/IdolMenendez/IdolMenenDez.github.io/blob/master/_posts/2019-2-20-%08%E5%9C%A8Mac%E4%B8%8A%E9%83%A8%E7%BD%B2%E4%BB%A3%E7%A0%81%E5%AE%A1%E6%9F%A5%E5%B7%A5%E5%85%B7SonarQube.md 查看
## 软件版本

- mysql:5.7.25

- sonarqube:7.5

- .Net Core:2.2.104

- sonar-scanner:3.2.0.1227

## 基础软件

- JDK ：https://www.oracle.com/technetwork/cn/java/javase/downloads/jdk8-downloads-2133151-zhs.html

- SonarScanner For MSBuild:https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner+for+MSBuild

- SonarQube官网： https://www.sonarqube.org/

- SonarRunner下载：http://repo1.maven.org/maven2/org/codehaus/sonar/runner/sonar-runner-dist/

- SonarQube管理网页汉化插件：https://github.com/SonarQubeCommunity/sonar-l10n-zh

- Mysql下载：https://dev.mysql.com/downloads/mysql/ mysql需要5.6以上的版本。

#Tips

## 查看Sonarqube在启动过程中的log

- cd /usr/local/sonarqube-7.5/logs,其中的sonar.log,用于sonarqube启动以后的log查看，es.log用于Process[es]的启动查看，其中的web.log可以查看启动web的错误。这些log可以帮助你快速定位问题并解决。

# SonarQube部署

## 在mysql中建立数据库,这里我使用sonar作为数据库名

- 使用命令行mysql -u root -p 进入数据库

- create DATABASE sonar;创建数据库

## 配置Sonar的属性

- 在 /usr/local/sonarqube-7.5/conf/sonar.properties中需要配置url,username,password作为凭据。

![](https://upload-images.jianshu.io/upload_images/16412632-cc398635a76a4624.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


其中sonar.jdbc.url= 3306后面的sonar代表数据库的名称,需要注意

## 启动SonarQube

- 使用命令行。进入/usr/local/sonarqube-7.5/bin/macosx-universal-64目录，运行./sonar.sh start命令。如果命令行显示sonarqube started则说明已经启动。

![](https://upload-images.jianshu.io/upload_images/16412632-3d4a7af973fe47ea.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


此时可以打开log文件查看log。若Sonar.log 出现SonarQube is up信息，则说明启动成功。

![](https://upload-images.jianshu.io/upload_images/16412632-69053eafee4f0b0d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


若出现Sonarqube is stopped则说明有问题，需要看log来定位.

![](https://upload-images.jianshu.io/upload_images/16412632-3cbcdf9e4ffcf098.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 成功后此时在浏览器中键入http://localhost:9000/about主页就可以看到sonarqube的信息了。

![](https://upload-images.jianshu.io/upload_images/16412632-80c4bf7e8ea93de7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


根据刚才的sonar.properties中设定的双admin进行登陆，登陆后就可以创建项目了。

- 创建新项目需要提供token和key，这个key很重要，在之后的命令中也有用到。

![](https://upload-images.jianshu.io/upload_images/16412632-3e37b3c3c895a585.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


创建好之后，就可以进行扫描分析项目的操作了

- 扫描操作。启动sonar scanner dotnet /usr/local/SonarScannerMsbuild/SonarScanner.MSBuild.dll begin /k:WorldCreator_2048 /n:WorldCreator_2048 /v:1.0 /d:sonar.sources=/Applications/Business/Documents/worldCreater_Android/Assembly-CSharp.csproj

其中的标识符意义：

![](https://upload-images.jianshu.io/upload_images/16412632-bbce384b2464a34d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


成功后会出现如下提示：

![](https://upload-images.jianshu.io/upload_images/16412632-659d20eb60fa0564.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


- 紧接着，需要进行编译目标项目，在windows上可以直接用dotnet build <your project name>.sln命令进行操作，但是mac由于缺失framework，所以使用msbuild来进行编译.

- 编译完成后，使用命令行dotnet /usr/local/SonarScannerMsbuild/SonarScanner.MSBuild.dll end结束扫描，这个阶段SonarQube会将项目隐藏文件夹.sonarqube中的部分数据上传到sonar的数据库中，整个过程大概持续5分钟。结束后会进行提示,自此，整个sonarqube的过程就部署完成了。

![](https://upload-images.jianshu.io/upload_images/16412632-8dff4d7988d2fa8b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 打开你的项目查看
![](https://upload-images.jianshu.io/upload_images/16412632-e73d1ccb082c1b80.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 布置SonarQube过程中可能会遇到的坑的参考

## 1，mysql 安装后报各种奇奇怪怪的错误

## 解决：完全删除mysql && 重新安装mysql

ps：有时出现不明所以的错误无法解决类似：

- 表已经存在，但无法新建 etc.

- 各种无法连接数据库的问题

完全删除：https://gist.github.com/vitorbritto/0555879fe4414d18569d

重新安装：[https://www.youtube.com/watch?v=q9S51sykd1A](https://link.jianshu.com/?t=https://www.youtube.com/watch?v=q9S51sykd1A)

## 2，mac使用dotnet build <your project name>.sln命令报错.NetFrameWork.XX缺失

## 解决：

使用msbuild 《your project name》.sln

## 3，SonarQube分析出来的文件太大，超过了MySql的上限

## 解决：

- 进入mysql：mysql -u root -p;

- 查看自己的max_allowed_packet大小:show VARIABLES like '%max_allowed_packet%';

- 设定自己的max_allowed_packet大小：set global max_allowed_packet=256*1024*1024 （256 * 1024 * 1024中间没有空格)

