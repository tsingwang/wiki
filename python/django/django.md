# Django

## 如何并行处理多个请求的？

Django 是一个需要Web服务器来运行的Web框架。  
Django 只是Web开发框架，并不负责处理多个请求的问题。

开发环境下看起来是并行的，是因为 `runserver` 命令默认是单进程多线程启动的，一个请求一个线程。  
通过 `runserver --nothreading` 参数可以关闭多线程启动，此时多个请求就是阻塞的了。

生产环境下，比如 Gunicorn 或者 uWSGI，取决于各自的实现。

## 启动过程

1. 无论是 WSGI 还是 ASGI application，第一步都是 `django.setup()`  
    主要执行 `apps.populate(settings.INSTALLED_APPS)`  
    目的是加载所有 app (`AppConfig`)，并且挨个触发执行 `app_config.ready()`  
    我们可以在这里面做些app自定义的初始化工作  
    这也说明了为什么每个 app 目录下都有一个 apps.py 文件

2. 然后就是 `WSGIHandler` 和 `ASGIHandler`，两者都继承自 `BaseHandler`  
    两者是都会加载中间件 `load_middleware`，稍有不同的是 is_async 的区别  
    middleware 最终构成一个链，`_middleware_chain`，在 `get_response` 中会调用  
    不过Django目前只支持 ASGI/HTTP 协议，并不支持 WebSocket
