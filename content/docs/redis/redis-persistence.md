---
title: Redis持久化
weight: 5
---

# RDB & AOF

- RDB 和 AOF 是两种独立的持久化方式
- RDB 默认开启，关闭配置 `save ""`，对应 `server.saveparams` `server.saveparamslen`
- AOF 默认关闭，开启后默认是混合持久化  
  原因是AOF base文件可以是AOF也可以是RDB文件，配置为 `aof-use-rdb-preamble`

## 加载

在 Redis 启动时候
- `aofLoadManifestFromDisk` 加载 AOF manifest 文件，内容是一个base文件和多个aof增量文件的汇总信息
- `loadDataFromDisk`
  - `loadAppendOnlyFiles` 如果开启 AOF，会从 manifest 中读取，先加载 base文件(rdb/aof)，再加载 incr文件(aof)
  - `rdbLoad`，如果没有开启 AOF，才会直接从RDB文件加载
- `aofOpenIfNeededOnServerStart` 打开最后一个aof文件用于写，`server.aof_fd`

## 写入

- 在事件循环 `beforeSleep` 中，`flushAppendOnlyFile` 会把AOF buffer写到磁盘

`appendfsync` 策略配置
```
no: don't fsync, just let the OS flush the data when it wants. Faster.
always: fsync after every write to the append only log. Slow, Safest.
everysec: fsync only one time every second. Compromise.
```

- 在 `serverCron` 定时任务中，`rdbSaveBackground` 将fork子进程备份 `server.rdb_filename`

- RDB 命令
  - `save`: 直接调用 `rdbSave`，因为单线程，会阻塞其他请求
  - `bgsave`: fork 子进程执行 `rdbSave`

## AOF 重写

- 在 `serverCron` 定时任务中，`rewriteAppendOnlyFileBackground` 满足条件将重写AOF
- 执行 `bgrewriteaof` 命令，调用 `rewriteAppendOnlyFileBackground`，fork子进程执行 `rewriteAppendOnlyFile`

`rewriteAppendOnlyFile` 逻辑是根据 `server.aof_use_rdb_preamble` 决定是用 RDB 还是 AOF 方式重写
