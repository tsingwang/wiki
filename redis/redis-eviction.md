# Expire & Eviction

## 两种场景

- 定时任务 `serverCron`，有子任务 `databasesCron` -> `activeExpireCycle`

遍历 `db->expires` 检查是否过期并删除 `activeExpireCycleTryExpire`

- 在处理指令函数 `processCommand` 中，如果配置了 `maxmemory`，会执行 `performEvictions`  
  如果一次处理不完，还会创建一个时间任务继续驱逐 `startEvictionTimeProc`

处理流程为，当 Redis 内存占用超过阀值后，按策略从主 dict 或者带过期时间的
expire dict 中随机选择 N 个 key，N 默认是 5，计算每个 key 的 idle 值，按
idle 值从小到大的顺序插入 `evictionPool` 中，然后选择 idle 最大的那个 key 进行淘汰。

如果是 LFU，在计算 lfu 的 Idle 时，采用 255 减去使用频率相对值，从而确保
Idle 最大的 key 是使用次数最小的 key。

## 淘汰策略

主要配置 `maxmemory` `maxmemory-policy`，默认 `noeviction`
```
volatile-lru -> Evict using approximated LRU, only keys with an expire set.
allkeys-lru -> Evict any key using approximated LRU.
volatile-lfu -> Evict using approximated LFU, only keys with an expire set.
allkeys-lfu -> Evict any key using approximated LFU.
volatile-random -> Remove a random key having an expire set.
allkeys-random -> Remove a random key, any key.
volatile-ttl -> Remove the key with the nearest expire time (minor TTL)
noeviction -> Don't evict anything, just return an error on write operations.
```
