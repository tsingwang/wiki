---
title: DRF
weight: 2
---

# django-rest-framework

## 原理

DRF 是围绕 view 工作的，认证、权限、限流工作都是在 `APIView` 实现的  
因此Django的启动行为和Middleware都没有变化，但这样自然会与Middleware是有部分冗余的  
Middleware 可以做适量删减，不过有的也有依赖，比如 `SessionAuthentication`

## 封装 View

- `django.views.generic.View` 使用方法 `MyView.as_view(...)`  
  最终会调用 `dispatch`，是根据 HTTP method 名称调度的  
  所以继承此类后需要实现 get/post 等方法，如果缺失则返回405

- `rest_framework.views.APIView` 继承 Django View  
  APIView 重写了 Django View 的 `dispatch` 方法，核心都在这里面了  
  1. `initialize_request` 初始化 DRF 的 `Request` (`django.http.HttpRequest` wrapper)
  2. `initial` 包含3个工作
    - `perform_authentication` 尝试认证，加载到 `request.user`
    - `check_permissions` 检查此请求是否有权限，这里只检查 Model级权限
    - `check_throttles` 检查限流
  3. 根据 HTTP method 名称分发的，行为和 Django View 类一样

- `rest_framework.generics.GenericAPIView` 继承 APIView  
  主要定义了 `queryset`，跟 Model 关联了  
  还封装了一些方法， 比如 `get_object` 只有这里才会检查 Object级权限  
  一般不会直接用，需要配合各种mixin组合使用

- `rest_framework.generics.CreateAPIView` 继承 GenericAPIView  
  借助 CreateModelMixin 实现了只有 post 请求的view
  还有很多种其他组合，这里省略

- `rest_framework.viewsets.ViewSet` 继承 APIView  
  视图集，不再实现 get/post 等方法，而是实现动作 action，如 list/create 等  
  使用方法 MyViewSet.as_view({'get': 'list'})

- `rest_framework.viewsets.GenericViewSet` 继承 GenericAPIView  

- `rest_framework.viewsets.ModelViewSet` 继承 GenericViewSet，同时借助 mixin 实现了所有 action  

## Router

视图集ViewSet，是手动指明请求方式与动作action之间的对应关系  
使用 Router 可以快速实现

## authentication

全局配置 `DEFAULT_AUTHENTICATION_CLASSES`
- `rest_framework.authentication.BasicAuthentication` 用 basic header 进行认证
- `rest_framework.authentication.SessionAuthentication` 用 Django session 进行认证，依赖Middleware
- `rest_framework.authentication.TokenAuthentication` 根据 token header进行认证
- `rest_framework.authentication.RemoteUserAuthentication`

## permission

全局配置 `DEFAULT_PERMISSION_CLASSES`，也可在View类局部中指定
- `AllowAny`: 允许任何请求
- `IsAuthenticated`: 需要通过认证
- `IsAuthenticatedOrReadOnly`: GET请求可匿名
- `IsAdminUser`: 需要是django职员，`is_staff`
- `DjangoModelPermissions`: Model级权限，不支持action接口自定义权限
- `DjangoObjectPermissions`: Object级权限，包含Model级权限，不支持action接口自定义权限  
  DRF这两个权限类只是封装，最终是Django `user.has_perm(perm, obj)` 完成校验的  
  因此，Django 的 `AUTHENTICATION_BACKENDS` 认证后端很重要

## 限流

## 过滤

- `rest_framework.filters.SearchFilter`  
  在 viewset 中配置 `search_fields` 表明可搜索的字段，默认前端通过 `search` 字段进行检索
- `rest_framework.filters.OrderingFilter`  
  默认前端通过 ordering 字段进行排序
- `rest_framework_guardian.filters.ObjectPermissionsFilter`  
  只是提供了一个filter，查询仅用户具有查看权限的对象  
  本质是调用guardian 提供的 `get_objects_for_user`
- `django_filters.rest_framework.DjangoFilterBackend`  
  过滤的时候可指明使用哪些字段进行过滤，每个字段可以使用哪些运算，适合复杂的查询

## 分页

- `rest_framework.pagination.PageNumberPagination`  
  需要继承此类，指明 `page_size_query_param` 字段，才能使用
- `rest_framework.pagination.LimitOffsetPagination`
- `rest_framework.pagination.CursorPagination`
