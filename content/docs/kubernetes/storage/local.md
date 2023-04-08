---
title: Local
weight: 1
---

# local

- `emptyDir`: 存储临时数据的简单空目录
  - 在同一个pod内的容器之间共享文件
  - 当删除pod时，卷的内容会丢失
  - pod 中 container crashing 不会丢失数据，因为 crashing 不会从node上移除pod

- `hostPath`: 把Node的文件系统挂载到pod中
  - 一般如收集宿主机上日志的 DaemonSet 使用
  - 没有亲和性识别

- `local`: 静态的，必须加 nodeAffinity
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: example-pv
spec:
  capacity:
    storage: 100Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Delete
  storageClassName: local-storage
  local:
    path: /mnt/disks/ssd1
  nodeAffinity:
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - example-node
```

- [local-path-provisioner](https://github.com/rancher/local-path-provisioner)  
  可通过PVC动态管理本地卷，功能比较简单，不支持容量限制  
  Controller 的实现借助了 `kubernetes-sigs/sig-storage-lib-external-provisioner/controller`  
  只实现了 Provisioner 的两个接口给 Controller 调用，`Provision` 和 `Delete`  
  原理是使用 `helperPod.yaml` 启动一个pod去执行 `setup` 和 `teardown` 脚本  
  创建本地PV会自动加上 nodeAffinity，pod不需要加了，另外也支持共享盘 `sharedFileSystemPath`  
  底层依然是用的 `local` 或 `hostPath`
