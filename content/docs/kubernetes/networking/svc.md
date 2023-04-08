---
title: Service
weight: 1
---

# Endpoint (ep)

Endpoints表示了一个Service对应的所有Pod副本的访问地址，它负责监听Service和对应的Pod副本的变化

- 如果监测到Service被删除，则删除和该Service同名的Endpoints对象
- 如果监测到新的Service被创建或修改，则根据该Service信息获得相关的Pod列表，然后创建或更新Service对应的Endpoints对象
- 如果监测到Pod的事件，则更新它对应的Service的Endpoints对象

kube-proxy进程获取每个Service的Endpoints，实现Service的负载均衡功能

# Service (svc)

k8s只有两种 service session affinity：None and ClientIP
- None：随机选择一个pod
- ClientIP：将同一个客户ip的请求转发同一个pod

没有基于cookie的选项，因为 Service 只处理 TCP、UDP 数据包，而cookie是HTTP层的

每个 Service 都有内部DNS域名，全限定域名 FQDN
`<service-name>.<namespace-name>.svc.cluster.local`  
也可以简写为 `<service-name>.<namespace-name>`  
同一个名称空间下pod也可以直接用简写 `<service-name>` 域名来访问

- CLUSTER-IP  只能在集群内部访问
- EXTERNAL-IP 对外访问

## 对外访问 NodePort

集群所有节点都会暴露端口，如果没有指定端口，将随机选一个端口
```
apiVersion: v1
kind: Service
metadata:
  name: kubia
spec:
  type: NodePort
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30123     通过节点的30123端口可以访问该服务
  selector:
    app: kubia
```
EXTERNAL-IP 显示为 nodes，表示通过任何集群节点IP都可访问

## 对外访问 LoadBalancer

NodePort类型的扩展，也会暴露端口，如果没有指定端口，将随机选一个端口  
可以通过 EXTERNAL-IP 来访问，有负载均衡功能
```
apiVersion: v1
kind: Service
metadata:
  name: kubia
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: kubia
```
注意：k8s默认没有提供LB实现，创建 LoadBalancer 类型的 Service 会保持 pending 状态

## 对外访问 ExternalName

```
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ExternalName
  externalName: my.database.example.com
```
ExternalName 类型的 Service，其实是在 kube-dns 里为你添加了一条 CNAME 记录  
这时，访问 my-service.default.svc.cluster.local 就和访问 my.database.example.com 这个域名是一个效果了

# Ingress (ing)
