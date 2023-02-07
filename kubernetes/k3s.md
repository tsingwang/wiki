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

## 存储

- K3s 默认使用 local-path-provisioner，功能比较弱，单节点玩玩了，也不支持容量限制
- 可选 longhorn 分布式块存储系统
