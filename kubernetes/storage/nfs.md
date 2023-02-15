# nfs

NFS的特点：可共享、单点、性能低、没有容量限制

nfs 是 k8s 内置支持的 volume 类型，比如
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pd
spec:
  containers:
  - image: registry.k8s.io/test-webserver
    name: test-container
    volumeMounts:
    - mountPath: /my-nfs-data
      name: test-volume
  volumes:
  - name: test-volume
    nfs:
      server: my-nfs-server.example.com
      path: /my-nfs-volume
```

## nfs-subdir-external-provisioner

内置是静态使用，这个提供了通过PVC动态管理PV
https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner

实现上与 `local-path-provisioner` 类似，只实现了 Provisioner 的两个接口 `Provision` 和 `Delete`  
底层依然是用内置的 nfs 类型创建 PV

前提：需要先准备好一个 NFS Server
```sh
yum -y install rpcbind nfs-utils

chmod 777 /nfs-storage
cat /etc/exports
# /nfs-storage   *(rw)

systemctl enable rpcbind nfs-server
systemctl start rpcbind nfs-server
```

每个node节点也要安装 nfs 客户端，实际上底层就是用 `mount -t nfs` 挂载的
```sh
yum -y install nfs-utils
# showmount -e 192.168.1.10
# mount -t nfs 192.168.1.10:/nfs-storage /nfs-storage
```

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-nfs-pvc
spec:
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      # 注意容量是没有用的
      storage: 1Gi
```
