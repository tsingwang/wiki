Longhorn 在整体上分为两层：数据平面和控制平面
- Longhorn Manager 对应控制平面
  - 作为 DaemonSet 跑在每个节点上
  - 监听 API server 上的 Longhorn volume CRD 资源，创建和管理 volume
  - 创建卷时，会在 pod 所在节点上创建一个 Longhorn Engine 实例，并创建多个 replica
- Longhorn Engine 是存储控制器，对应数据平面
  - Each volume has a dedicated controller，轻量级，相互不影响，但pod数量比较多
  - engine 总是跑在 pod 所在节点上，并连接 replicas
  - replica 要跑在不同的节点或不同的磁盘上

还有其他一些组件，具体还没有实践过，运行pod数量比较多，有不小的运维成本

## Install

每个节点需要安装依赖，还提供了检查环境依赖的脚本
- open-iscsi
- NFSv4 client
