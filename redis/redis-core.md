## Debug

编译时会依赖一些库，具体参看 `deps/README.md`
```sh
# 调试时不要编译优化，默认是开启 `-O2` 编译优化选项的
make noopt
```

调试
```sh
gdb redis-server
```

## 全局变量

- `server`: 最重要的一个全局变量，`redisServer` 类型
  - `server.db` is an array of Redis databases, where data is stored. 默认16个
  - `server.commands` is the command table.
  - `server.clients` is a linked list of clients connected to the server.
  - `server.master` is a special client, the master, if the instance is a replica.
  - `server.el` event loop

## server 启动简略流程

```
main
  initServerConfig
    populateCommandTable    加载命令到 server.commands
  moduleInitModulesSystem
  initServer
    aeCreateEventLoop
    listenToPort
      anetTcpServer
    aeCreateTimeEvent(serverCron)   定时任务事件回调
      clientsCron     处理客户端日常工作，比如超时清理, server.clients
      databasesCron   key过期、渐进式rehash等
      rewriteAppendOnlyFileBackground
      replicationCron
      clusterCron
      rdbSaveBackground
      modulesCron
    createSocketAcceptHandler(acceptTcpHandler)   接收新连接
  loadDataFromDisk
    loadAppendOnlyFiles or rdbLoad
  aeMain              while 死循环
    aeProcessEvents
```

## aeEventLoop 事件循环

`aeEventLoop` 事件循环类型，`server.el` 变量
- `apidata` 是 `void *` 类型，指向底层实现的状态数据  
  多态，可以为不同的底层实现，通过宏定义在编译阶段优先使用 evport > epoll > kqueue > select
- `aeTimeEvent` timer事件，如定时任务，是链表形式，通过 `aeCreateTimeEvent` 注册
- `aeFileEvent` 文件描述符事件，是数组形式，通过 `aeCreateFileEvent` 注册
- `aeFiredEvent` 哪些fd有新消息，由底层更新，是数组形式

启动流程的最后，`aeMain` 是一个死循环，不断执行 `aeProcessEvents`
- `beforesleep`
- 调用 `aeApiPoll` 获取 fired events，然后执行该文件事件注册时的回调
- `aftersleep`
- `processTimeEvents` 遍历timer事件链表，执行回调  
  如果是定时任务，回调函数需要返回下一次毫秒数，否则认为是一次性任务，会删除该timer任务

## 处理连接请求

- `createSocketAcceptHandler` 通过 `aeCreateFileEvent` 给socket文件描述符创建事件  
  `acceptTcpHandler` 为其回调，当有新连接时，就会触发执行
- `anetTcpAccept` 接受一个客户端连接请求，返回新的fd
- `connCreateAcceptedSocket` 根据客户fd，创建 `connection` 实例
- `acceptCommonHandler`
  - 判断是否超过 `server.maxclients`，否则限制连接
  - `createClient` 根据 `connection` 创建 `client`，并加入到 `server.clients` 链尾
    - `connSetReadHandler`，回调是 `readQueryFromClient`  
      下层自然是文件事件循环，`aeCreateFileEvent`

connection 和 client 关系是，connection 是下层连接，client 是上层业务  
client 在 connection 中包装为 `void *private_data`

## 处理指令请求

- `readQueryFromClient` 从 fd 中读取内容到 `c->querybuf`
- `processInputBuffer` 会解析 RESP 数据为 `c->argc` `c->argv`
- `processCommand`，根据 `server.commands` 静态命令表查找命令，`c->cmd`
  实际执行命令的是 `call`，`c->cmd->proc(c)`
- 各命令结果，一般通过 `addReply` 写入到 `c->reply` `c->bufpos`，并不是立即返回客户端

响应客户端时，是在下一个事件循环的 `beforesleep` 完成的，`handleClientsWithPendingWritesUsingThreads`
- 遍历 `server.clients_pending_write`，执行 `writeToClient`
- 如果一次发送不完，需要添加文件事件，当可写时，把剩余部分写完 `installClientWriteHandler`
