---
title: Debug
weight: 1
---

# kubectl debug

背景：应用镜像比较精简，没有可用的命令，或者都没有shell

原理：启动一个临时容器加入目标容器的namespace，即可看到pod的网络、文件系统了

## 调试Pod
```sh
kubectl debug mypod -it --image=busybox
kubectl debug mypod -it --image=nicolaka/netshoot
```

## 调试Node

当以节点为目标调用时，kubectl debug 将创建一个带有node名称的pod，并且调度到该节点。  
同时该容器还具备了hostIPC、hostNetwork和hostPID这些特权模式。  
Worker节点的根文件系统还被mount到了debug容器下的/host目录下。
```sh
kubectl debug node/mynode -it --image=nicolaka/netshoot
```
