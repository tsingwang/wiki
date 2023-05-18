---
title: Uvicorn
weight: 1
bookToc: false
---

# Uvicorn

- https://github.com/encode/uvicorn
- 借助 `uvloop` 实现的 ASGI HTTP Server，5k行代码(剔除注释和空行)
- 当前版本 0.22.0

## 流程

```
server.serve
  config.load()             加载配置
  install_signal_handlers   停止的信号
  startup
    lifespan.startup        阻塞的，发送 `lifespan.startup` 给应用后等待
    loop.create_server(create_protocol)    这里socket的处理就交给应用了，需要关注 asyncio 文档
  main_loop   没有业务逻辑，主要为了防止主程序退出，每次检查下是否要退出
  shutdown
```

## 多进程

Gunicorn 一个worker是阻塞的，所以多进程很有必要。
而 Uvicorn 实现的是 ASGI，每个请求都是一个协程，单进程的性能已经很高了。

Uvicorn 默认单进程，启动参数 `--workers` 大于1，就是多进程模式。
逻辑简单，父进程启动worker子进程后，就等待结束了。

## TODO

基于 asyncio.Protocol 各种协议(HTTP/Websocket)实现
