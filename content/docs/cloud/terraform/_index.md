---
title: Terraform
weight: 10
---

# Terraform

- Terraform 是声明式的，Terraform 使用 HashiCorp 配置语言，扩展名为 `.tf`

## Provider

- 实现多云编排的方法就是 Provider 插件机制，Terraform通过RPC调用插件，插件代码通过调用SDK操作远程资源。

## 状态管理 tfstate

- 声明式语法的前提是有状态管理，默认会保存在当前工作目录下的 `terraform.tfstate` 文件里。
- Terraform的状态文件是明文的
- 为了解决状态文件的存储和共享问题，Terraform引入了远程状态存储机制，也就是 `Backend`，比如存储在S3/Consul等中。
  当针对一个tfstate进行变更操作时，可以针对该状态文件添加一把全局锁，确保同一时间只能有一个变更被执行。
- `Workspace` 允许我们在同一个文件夹内，使用同样的Backend配置，但可以维护任意多个彼此隔离的状态文件。
  比如多个环境dev/staging/prod。

```tf
terraform {
  backend "s3" {
    bucket = "tfstatebucket"
    key    = "global/s3/terraform.tfstate"
    region = "us-west-1"
    dynamodb_table = "tfstatelock"
    encrypt = true
  }
}
```

## 语法

### 输入变量 variables.tf

一般把变量放在独立的文件中，在代码中可以通过 `var.<NAME>` 的方式引用变量的值

```tf
variable "image_id" {
  type    = string
  default = "t2.small"
}
```

对输入变量赋值，有多种方法
- `terraform apply -var="image_id=ami-abc123"`
- 使用参数文件，后缀名是 .tfvars，`terraform apply -var-file="prod.tfvars"`
  默认参数文件是 `terraform.tfvars`，这样就不需要指定参数文件
- 环境变量，`TF_VAR_<NAME>` 的环境变量为输入变量赋值

### 输出 outputs.tf

想要输出创建后资源的一些信息

```tf
output "instance_ip_addr" {
  value = aws_instance.server.private_ip
}
```

### locals

局部值只能在同一模块内的代码中引用，引用局部值的表达式是 `local.<NAME>`

```tf
locals {
  service_name = "forum"
  owner        = "Community Team"
}
```

### Resource & Data

- 要根据各个 provider 资源文档编写
- Resource 是我们要创建、修改或删除的云端目标资源
- Data 是已存在的只读数据源，用于引用使用

```tf
resource "aws_instance" "web" {
  ami           = data.aws_ami.web.id
  instance_type = "t2.micro"
}

data "aws_ami" "web" {
  most_recent = true

  owners = ["self"]
  tags = {
    Name   = "app-server"
    Tested = "true"
  }
}
```

Resource 支持一些元参数
- depends_on：显式声明依赖关系
- count：创建多个资源实例
- for_each：迭代集合，为集合中每一个元素创建一个对应的资源实例
- provider：指定非默认Provider实例
- lifecycle：自定义资源的生命周期行为
- provisioner 和 connection：在资源创建后执行一些额外的操作

## Module

Module是一组相关资源的集合，可以被其他Terraform配置文件引用，提高复用性和可维护性。

实际上所有包含Terraform代码文件的文件夹都是一个Terraform模块。
如果直接在一个文件夹内执行 terraform 命令，那么当前所在的文件夹就被称为根模块(root module)。

Registry 目前是 Terraform 官方的模块仓库方案

```tf
# 引用本地模块
module "consul" {
  source = "./consul"

  # 对该模块的输入变量赋值
  servers = 5

  # 通过在 module 块上声明 for_each 或者 count 来创造多实例模块
}

# 引用公共模块
module "consul" {
  source = "hashicorp/consul/aws"
  version = "0.1.0"
}

module "consul" {
  source = "github.com/hashicorp/example"
}
```

## 命令

```sh
# 初始化操作，通过官方插件仓库下载对应插件到 .terraform 目录
$ terraform init
# backend配置只允许硬编码，不能使用变量，但可以在init时加载
$ terraform init -backend-config=backends/s3.hcl

# 创建变更计划，不会真的创建资源
$ terraform plan
# 生成执行计划(可选)并执行
$ terraform apply

# 清理我们的云端资源
$ terraform destroy

# 线上资源已经存在了，可以导入
$ terraform import <state.resource> <aws.resource>

# 使用多个环境变量以及workspace
# 每个workspace具有自己的状态信息，它们被存储在分别命名的backend中。
# 每个workspace可以使用不同的变量值。
$ terraform workspace list
$ terraform workspace new bj
$ terraform workspace select bj
$ terraform import -var-file=tfvars/bj.tfvars aws_security_group.default sg-f91dc49d
$ terraform plan -var-file=tfvars/bj.tfvars
$ terraform apply -var-file=tfvars/bj.tfvars
```
