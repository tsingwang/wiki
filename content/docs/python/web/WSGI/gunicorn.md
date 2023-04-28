---
title: Gunicorn
weight: 1
bookToc: false
---

# Gunicorn

- https://github.com/benoitc/gunicorn
- 纯Python实现的 WSGI HTTP Server，6k+ 行代码(剔除注释和空行)
- 当前版本 20.1.0，只支持 WSGI，不支持 ASGI
- Master/Worker 多进程架构

## Master 进程

- 加载配置并解析命令行参数  
  `Setting` 使用了元类，代码很高级，在 import 时候就加载所有配置到 `KNOWN_SETTINGS` 中  
  `BaseApplication` 的 `do_load_config` 加载配置到 `argparse` 的 parser 中

- `Arbiter` 是 master 进程，它管理 worker 进程的生死  

```
Arbiter(self).run()       self 为 Application 实例
  self.start()
    self.init_signals()
      os.pipe()           创建一个 pipe 管道 self.PIPE，用于 master sleep 状态的唤醒
      signal              大部分信号都是放进 self.SIG_QUEUE，处理函数仅仅是写 self.PIPE[1]，触发唤醒
    sock.create_sockets
  self.manage_workers()   通过 spawn/kill 控制着 worker 进程的数量
  master loop 循环
    self.sleep()          通过 select 监听 self.PIPE[0]，当有数据或超时1秒，就唤醒
    维持worker进程数量
    处理信号
```

## Worker 进程

- worker 有多种实现，`spawn_worker()` 时根据 worker_class 创建
- `fork` 出来的worker子进程，执行 `worker.init_process()`，最终执行 `run()` 各自实现的 loop 循环
- 默认为 `SyncWorker`，用的 `select` 模型，`accept` 处理一个请求
- `Request` 解析原始 HTTP 请求
- `wsgi.create` 创建 WSGI 协议需要的 `environ` 和 `Response`
- `self.wsgi(environ, resp.start_response)` 调用用户的 app

