# django-rest-framework

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

## 过滤

- `rest_framework.filters.SearchFilter`  
  在 viewset 中配置 `search_fields` 表明可搜索的字段，默认前端通过 `search` 字段进行检索
- `rest_framework.filters.OrderingFilter`  
  默认前端通过 ordering 字段进行排序
- `django_filters.rest_framework.DjangoFilterBackend`  
  过滤的时候可指明使用哪些字段进行过滤，每个字段可以使用哪些运算，适合复杂的查询

## 分页

- `rest_framework.pagination.PageNumberPagination`  
  需要继承此类，指明 `page_size_query_param` 字段，才能使用
- `rest_framework.pagination.LimitOffsetPagination`
- `rest_framework.pagination.CursorPagination`

## django-rest-framework-guardian

只是提供了一个filter，查询仅用户具有查看权限的对象  
本质是调用guardian 提供的 `get_objects_for_user`
