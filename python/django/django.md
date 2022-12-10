# Django

## 核心

### 如何并行处理多个请求的？

Django 是一个需要Web服务器来运行的Web框架。  
Django 只是Web开发框架，并不负责处理多个请求的问题。

开发环境下看起来是并行的，是因为 `runserver` 命令默认是单进程多线程启动的，一个请求一个线程。  
通过 `runserver --nothreading` 参数可以关闭多线程启动，此时多个请求就是阻塞的了。

生产环境下，比如 Gunicorn 或者 uWSGI，取决于各自的实现。

### 启动过程

1. 无论是 WSGI 还是 ASGI application，第一步都是 `django.setup()`  
    主要执行 `apps.populate(settings.INSTALLED_APPS)`  
    目的是加载所有 app (`AppConfig`)，并且挨个触发执行 `app_config.ready()`  
    我们可以在这里面做些app自定义的初始化工作  
    这也说明了为什么每个 app 目录下都有一个 apps.py 文件  
    此工作只在启动时候加载一次

2. 然后返回 `WSGIHandler` 和 `ASGIHandler` 实例，两者都继承自 `BaseHandler`  
    两者初始化时都会加载中间件 `load_middleware`，稍有不同的是 is_async 的区别  
    middleware 最终构成一个链，`_middleware_chain`，在响应请求时会调用  
    因为是在实例化时加载的，所以 `_middleware_chain` 加载也是只执行一次  
    middleware 最里面核心自然是具体的 view，`_get_response` or `_get_response_async`

3. 请求过程，通过 middleware 一层层进来后，最终到达view  
    第一次请求时，会从 `settings.ROOT_URLCONF` 加载路由  
    根据 `request.path_info` 找到对应的 view

### ASGI

Django目前只支持 ASGI/HTTP 协议，并不支持 WebSocket

### `request.POST` 与 `request.body` 区别

- `request.body` 是 `django.http.HttpRequest` 定义的属性
    `request.body` 是一个 stream，内容是字节码，django只允许读取一次，第二次读取会报异常
    如果在一个middleware中获取所有请求数据，那么很可能会遇到这个问题
    好在DRF在Response对象中会加上 `renderer_context`，这样可以获取到
    `response.renderer_context["request"].data`
- `request.POST` 只能获取表单数据
    当 Content-Type=application/json 时，`request.POST` 只会得到一个空的 QueryDict
- `request.data` 是DRF封装的

## Django 自带应用

### Session

```python
MIDDLEWARE = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]
```

Session 是后端存储，默认是DB，模型为键值模型，值是dict
1. 请求到来时，从用户请求的cookie中找到sessionid，并加载后端session数据
2. `AuthenticationMiddleware` 会从session中找到user_id，然后再根据auth的后端找到user
3. 响应时，如果有session就存储下来，并把sessionid写到返回给用户的cookie中

### Auth

提供了三大接口
- `authenticate`: 从 `AUTHENTICATION_BACKENDS` 认证后端依次执行认证
  - 认证后端如果通过认证就直接返回user
  - 如果报 `PermissionDenied`，就立即终止，明确表示认证不通过
  - 返回None，表示此认证后端无法判定，跳过
- `login`: 会保存session，并在客户浏览器写入cookie，DRF 用不到这个
- `logout`: 清除session

提供的认证后端
- `django.contrib.auth.backends.ModelBackend` 根据 username 和 password 进行认证
- `django.contrib.auth.backends.RemoteUserBackend` 根据 `REMOTE_USER` 认证  
    从 `request.META` 里面读取 `REMOTE_USER` key，值为 username，就通过认证了，这里有下面背景，所以没有安全问题  
    在 WSGI 环境下，`environ` 参数不仅包含请求头，还包含其他的环境变量  
    HTTP 请求头会全部转换为大写字母，所有破折号转换成下划线，并添加 `HTTP_` 前缀  
    例如，X-Auth-User 会转换成 HTTP_X_AUTH_USER  
    `request.META` 就是 `environ`，所以客户端仿冒这个头部没有用  
    `request.headers` 是对 `request.META` 又做了还原转换  
    不过问题是使用场景是什么呢？何时给 `request.META["REMOTE_USER"]` 赋值呢？  
    恐怕还需要在 `RemoteUserMiddleware` 前面在写一个自定义的 middleware，远程认证后赋值

DRF 主要是用 http header 认证的，主要配置为 `DEFAULT_AUTHENTICATION_CLASSES`
- `rest_framework.authentication.BasicAuthentication` 用 basic header 进行认证
- `rest_framework.authentication.SessionAuthentication` 用 Django session 进行认证
- `rest_framework.authentication.TokenAuthentication` 根据 token header进行认证
- `rest_framework.authentication.RemoteUserAuthentication`

### Permission (Model & Object)

auth app 的 `ready()` 初始化时，会监听 `post_migrate` 信号，只要监测到新 model 就自动创建4个默认权限
```
'%(app_label)s.view_%(model_name)s'
'%(app_label)s.add_%(model_name)s'
'%(app_label)s.change_%(model_name)s'
'%(app_label)s.delete_%(model_name)s'
```

权限只是一条数据，在view试图中显式对请求进行验证才有实际价值  
检查权限的方法是调用Django的方法 `user.has_perm(perm, obj=None)`  
里面又会去遍历 `AUTHENTICATION_BACKENDS` 的认证后端检查权限，比如下面两个
- `django.contrib.auth.backends.ModelBackend` 不检查obj，如果传递了obj，就返回False，跳过权限检查
- `guardian.backends.ObjectPermissionBackend` 如果没有传递 obj，就返回False，跳过权限检查
- 如果报 `PermissionDenied`，明确表示没有权限

DRF 可以用默认的 `DEFAULT_PERMISSION_CLASSES`，也可在View类局部中指定
- `AllowAny`: 允许任何请求
- `IsAuthenticated`: 需要通过认证
- `IsAuthenticatedOrReadOnly`: GET请求可匿名
- `IsAdminUser`: 需要是django职员，`is_staff`
- `DjangoModelPermissions`: Model级权限，不支持action接口自定义权限
- `DjangoObjectPermissions`: Object级权限，包含Model级权限，不支持action接口自定义权限  
  DRF这两个权限类只是封装，最终是Django `AUTHENTICATION_BACKENDS` 认证后端完成的

### guardian对象权限是否依赖Model权限？

并不依赖的，会遇到这个问题主要原因是 DRF 官方提供的 `DjangoObjectPermissions` 继承自 `DjangoModelPermissions`  
也就是说它默认包含了 Model级别权限的检查，还没走到对象级权限检查就被Model级权限拦截了  
DRF 只在 `self.get_object()` 时才会检查对象级别权限，此时已经进入到view视图中了  

### ContentType

`django.contrib.contenttypes` 为Model提供了一个通用的接口  
比如guadian的 object权限就用到 ContentType，这样就可以在一张表里表示出不同model的object了
