---
title: Replica Set & Sharding
weight: 10
bookToc: true
---

## Replica Set

一个 Replica Set 只有一个 Primary 节点，当 Primary 挂掉后，其他 Secondary 或者 Arbiter 节点会重新选举出来一个 Primary 节点，这样就又可以提供服务了。

- 只有 Primary 是可写的，Primary 接收所有的写请求，然后把数据同步到所有 Secondary。
- 读请求默认是发到 Primary 节点处理，如果需要故意转发到 Secondary，需要客户端修改一下配置（注意：是客户端配置，决策权在客户端）。
- Arbiter 仲裁者，不存数据，不会被选为主，只进行选主投票。使用 Arbiter 可以减轻在减少数据的冗余备份，又能提供高可用的能力。

### 部署

1. 配置每个节点，并启动
```
net:
   bindIp: 0.0.0.0
replication:
   replSetName: rs0
```

2. mongo 连接其中一个节点，初始化复制集
```
rs.initiate({
   _id : "rs0",
   members: [
      { _id: 0, host: "mongodb0.example.net:27017" },
      { _id: 1, host: "mongodb1.example.net:27017" },
      { _id: 2, host: "mongodb2.example.net:27017" }
   ]
})
```

### 维护

更新配置
```
cfg = rs.conf()
cfg.members[0].priority = 0.5
cfg.members[1].priority = 2
cfg.members[2].priority = 2
rs.reconfig(cfg)
```

- `rs.conf()` 查看复制集配置
- `rs.status()` 查看复制集状态
- `rs.printSecondaryReplicationInfo()` 查看各 Secondary 同步延迟信息
- `rs.printReplicationInfo()` 查看 oplog 大小、时长等信息

### 客户端

- `mongodb://[username:password@]host1[:port1][,host2[:port2],...][/[database][?options]]`
  客户端会自动检测复制集的主备关系，当主备关系发生变化时，自动将写切换到新的主上，以保证服务的高可用。
- 读写分离：在options里添加 `readPreference=secondaryPreferred` 即可实现，读请求优先到Secondary节点，从而实现读写分离的功能
- 限制连接数：在options里添加 `maxPoolSize=xx` 即可将客户端连接池限制在xx以内。
- 在options里添加 `w=majority` 即可保证写请求成功写入大多数节点才向客户端确认。

## Sharding

Replica Set模式解决了高可用但没有解决存储量问题，Sharding 是横向扩容的一个架构实现

- `mongos` 是代理层的组件，这是个无状态的组件，纯粹是路由功能。
  向上对接 Client ，收到 Client 写请求的时候，按照特定算法均衡散列到某一个 Shard 集群，然后数据就写到 Shard 集群了。
  收到读请求的时候，定位找到这个要读的对象在哪个 Shard 上，就把请求转发到这个 Shard 上，就能读到数据了。
- shard, 数据层是由一个个 Replica Set 集群组成。这样的一个 Replica Set 我们就叫做 Shard。
- 配置中心存储的就是集群拓扑，管理的配置信息，也是一个 Replica Set 集群。
  有多少个 Shard，每个 Shard 集群又是由哪些节点组成的，每个 Shard 里大概存储了多少数据量（以便做均衡）。这些东西就是在配置中心的。

### 部署

1. 部署配置中心

```
sharding:
  clusterRole: configsvr
replication:
  replSetName: <replica set name>
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
```

```
rs.initiate(
  {
    _id: "myReplSet",
    configsvr: true,
    members: [
      { _id : 0, host : "cfg1.example.net:27019" },
      { _id : 1, host : "cfg2.example.net:27019" },
      { _id : 2, host : "cfg3.example.net:27019" }
    ]
  }
)
```

2. 部署shard

```
sharding:
    clusterRole: shardsvr
replication:
    replSetName: <replSetName>
net:
    bindIp: localhost,<ip address>
```

```
rs.initiate(
  {
    _id : "myShardReplSet",
    members: [
      { _id : 0, host : "s1-mongo1.example.net:27018" },
      { _id : 1, host : "s1-mongo2.example.net:27018" },
      { _id : 2, host : "s1-mongo3.example.net:27018" }
    ]
  }
)
```

3. 部署 mongos

```
sharding:
  configDB: <configReplSetName>/cfg1.example.net:27019,cfg2.example.net:27019
net:
  bindIp: localhost,<hostname(s)|ip address(es)>
```

Add Shards to the Cluster
```
sh.addShard( "<replSetName>/s1-mongo1.example.net:27018,s1-mongo2.example.net:27018,s1-mongo3.example.net:27018")
```

Shard a Collection
```
sh.shardCollection("<database>.<collection>", { <shard key field> : "hashed" } )
```

### 概念

- `collection` 可以是shard的，也可以不是shard的，所以每个数据库会有一个 primary shard，用于存储 un-sharded collections
- `collection` 需要指定一个key作为 `shard key`，MongoDB 基于 ShardKey 将 Collection 拆分成多个数据子集，每个子集称为一个 Chunk
- `collection` 的数据按照 ShardKey 划分为 minKey ~ maxKey 的区间，每个 Chunk 有自己负责的一个区间（前闭后开）
- `chunk` 是基于 collection 的，一个chunk存储的都是同一个 collection 的文档，一个chunk默认64MB
- `chunk` 会分裂，但不可合并
- primary shard 除了存储 un-sharded collection，每个集合的第一个 chunk 也会存在上面
- 后台进程 balancer 负责均衡shard上的 chunks

### 运维

```
# 查看分片列表
db.getSiblingDB("config").shards.find()

# 查看每个数据库是否是 partitioned，以及 primary shard
db.getSiblingDB("config").databases.find()

# 查看每个 shard 上的 chunk 数量
db.getSiblingDB("config").chunks.aggregate([
   { $group: { _id: "$shard", count: { $sum: 1 } } }
])

# 查看某个 collection 的 chunk 分布
db.collection.getShardDistribution()

# 查看某个 collection 所有 chunk 列表
db.getSiblingDB("config").chunks.find({ "ns": "database.collection" })

# 查看集群状态
sh.status()
```
