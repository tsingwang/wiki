---
title: UDP
weight: 11
---

# UDP (User Datagram Protocol) 用户数据报协议

- UDP 是无连接的，尽最大努力交付的，面向报文的
- UDP 一个数据包就能够完成数据通信、不分段、不需要建立会话、不需要流量控制
- UDP 可用于广播和多播

UDP报文格式，首部共8字节
```
0                 16              31
16位源端口号      16位目的端口号
16位UDP数据报长度 16位UDP检验和
数据部分
```
- 端口号表示发送进程和接收进程
- UDP长度字段指的是UDP首部和UDP数据的字节长度
- UDP检验和覆盖UDP首部和UDP数据
