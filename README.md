# 基于KubeSphere Console的改造

### 1.介绍

- 本项目基于kubesphere Console进行改造。

- 我们的目标是为研发团队提供git仓库、镜像仓库、CI/CD流水线和开发环境容器等服务。

### 2.项目组成

| 文件夹  | 功能                                                         |
| ------- | ------------------------------------------------------------ |
| jtest   | 静态测试工具                                                 |
| scripts | 脚本文件                                                     |
| server  | 基于koa框架的web应用程序                                     |
| src     | 主要页面代码，包含有静态图片，应用商店，devops，工作台等模块代码 |
| utils   | 公共的函数                                                   |
| hack    | 构建测试脚本                                                 |
| locale  | 国际化和本地化工具                                           |
| cypress | 端到端的测试工具                                             |

### 3.构建console调试环境

#### 3.1 准备工作

- 源码下载
  - https://github.com/WasmFunction/console.git

- node.js
- yarn
  - npm install -g yarn@1.22.4

#### 3.2 console的构建和运行

- 下载依赖包并构建项目

  ```shell
  yarn && yarn build
  ```

- npm run serve

  ```shell
  > kubesphere-console@master serve
  > NODE_ENV=production node server/server.js
  
  Dashboard app running at port 8000
  ```

#### 3.3 ks-apiserver的配置

- 将ks-apiserver暴露成服务，供给console访问

  ```
  kubectl -n kubesphere-system patch svc ks-apiserver -p '{"spec":{"type":"NodePort","ports":[{"port":80,"protocal":"TCP","targetPort":9090,"nodePort":30881}]}}'
  ```

- 在console配置ks-apiserver的地址

  ```shell
  server:
    apiServer:
      url: http://node_ip:30881
      wsUrl: ws://node_ip:30881
  ```

#### 3.4 调试结果

```shell
ubuntu@master:~/console$ sudo npm run serve

> kubesphere-console@3.0.0 serve
> NODE_ENV=production node server/server.js

Dashboard app running at port 8000
```

### 4.当前进度

- 当前仍处于测试阶段，提供域名访问平台功能
  - 域名：http://super-ide.net / http://www.super-ide.net
  - 管理员账号：admin  管理员密码：123456789zZ

- 提供创建devContainer和devOps的两种不同类型项目
  - devContainer项目
    - 创建项目后，默认存在一个ubuntu镜像的容器。同时可按需创建和销毁dev-container。
    - dev-container提供以下两种登录方式
      - ssh远程登录：进入我的资源-我的dev-container，复制登录命令即可登录
      - 网页内登录：进入我的资源-详细信息，单击具体dev-container即可进入终端
  - devOps项目：提供有创建CI/CD流水线，代码仓库等功能

TODO：

- 服务器问题：
  - 绑定国内服务器需要备案
  - 国内服务器访问dockerhub和github卡顿

- 镜像仓库问题：
  - 项目内部署 or kubernetes集群部署 + 配置

- 稳定性问题：
  - 更换为容器环境即可解决

### 5.版本更新状态

- 2023.10.9
  - 将console地址和域名绑定，可用域名访问
  - 完善了devCotainer的用例
  - 添加了说明文档

- 2023.9.25

  - 在k8s集群上部署console
  - 增加devContainer项目
  - 完成容器创建功能，提供ssh命令登录方式

  



