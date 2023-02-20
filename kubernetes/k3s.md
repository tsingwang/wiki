## 架构

- Server: 运行 `k3s server` 命令的节点
- Agent Node: 运行 `k3s agent` 命令的节点

虽说也支持高可用，不过那不如直接上k8s了

- 默认使用 sqlite3 数据存储的单节点架构
- 默认使用 containerd (crictl)

## 安装

```sh
# server, 升级也是这条命令
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -

# agent, K3S_TOKEN 值存储在server节点上的 /var/lib/rancher/k3s/server/node-token
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=https://myserver:6443 K3S_TOKEN=mynodetoken sh -
```

kubeconfig 文件在 `/etc/rancher/k3s/k3s.yaml`

可以修改数据目录，方便挂载磁盘，`/etc/systemd/system/k3s.service`
```
ExecStart=/usr/local/bin/k3s \
    server \
    --data-dir /data/k3s \
```

## 网络

K3s 默认以 flannel 作为 CNI 运行，使用 VXLAN 作为默认后端

其他默认安装的组件
- CoreDNS
- Traefik Ingress

k8s默认是没有LB实现的，k3s提供了一个LB的实现 https://github.com/k3s-io/klipper-lb  
控制器代码没有独立出来，在k3s项目里面 https://github.com/k3s-io/k3s/blob/master/pkg/cloudprovider/servicelb.go  
控制器会监视 LoadBalancer 类型的 Service，对于每个 LoadBalancer Service，会在 kube-system 命名空间中会创建一个 DaemonSet。  
这个 DaemonSet 在每个节点上创建带有 svc- 前缀的 Pod。  
这些 Pod 使用 iptables 将流量从 Pod 的 `NodePort` 转发到 Service 的 `ClusterIP` 地址和端口。  
用的NodePort，并没有外部IP池，所以简单
