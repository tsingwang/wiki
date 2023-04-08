---
title: TCP
weight: 10
---

# TCP (Transmission Control Protocol) 传输控制协议

- TCP 面向连接的，提供可靠交付的，提供全双工通信，面向字节流的
- 在一个TCP连接中，仅有两方进行彼此通信。广播和多播不能用于TCP
- 当TCP发出一个段后，它启动一个定时器，等待目的端确认收到这个报文段  
  如果不能及时收到一个确认，将重发这个报文段
- 另一端对收到的数据进行确认，对失序的数据重新排序，丢弃重复数据
- TCP还能提供流量控制，TCP连接的每一方都有固定大小的缓冲空间  
  TCP的接收端只允许另一端发送接收端缓冲区所能接纳的数据

TCP报文格式，首部共20字节+选项
```
0           4       10        16                31
16位源端口号                  16位目的端口号
32位序号(Sequence Number)
32位确认序号(Acknowledgment Number)
4位首部长度 6位保留 6位位码   16位窗口大小
16位检验和                    16位紧急指针
选项(长度可变)
数据
```
- 序号：数据包序号，如果发一个确认一个效率太低，可以一次发多个
- 确认号：累计确认，告诉发送者下一个该发第几个数据包了，不是一个一个确认
- 首部长度：TCP首部长度
- 位码即tcp标志位：6 bit
  - URG(urgent紧急)           优先级高，优先传
  - ACK(acknowledgement确认)  0-确认号无效  1-确认号有效
  - PSH(push传送)             接收方应该尽快将这个报文段交给应用层
  - RST(reset重置)            重建连接
  - SYN(synchronous建立联机)  用来发起一个连接
  - FIN(finish结束)           释放连接
- 窗口：流量控制由连接的每一端通过声明的窗口大小来提供
- 检验和：覆盖TCP首部和TCP数据
- 紧急指针：只有当URG标志置1时紧急指针才有效

## TCP建立连接，三次握手

首先 Server 调用 listen() 监听端口，等待连接，Server状态为 `LISTEN`
- Client 调用 connect() 发送 `[SYN] seq=x` 此时Client状态为 `SYN_SENT`
- Server 收到后，响应 `[SYN, ACK] seq=y ack=x+1` 此时Server状态为 `SYNC_RCVD`
- Client 收到后，响应 `[ACK] seq=x+1 ack=y+1` 此时Client/Server状态都为 `ESTABLISHED`

## TCP断开连接，四次挥手

客户端或服务器均可主动发起挥手动作，任何一方执行close()操作即可产生挥手操作
- A向B发送断开请求 `[FIN] seq=x` 此时A状态为 `FIN_WAIT_1`
- B向A响应 `[ACK] seq=y ack=x+1` 此时B状态为 `CLOSE_WAIT`，A收到后的状态为 `FIN_WAIT_2`  
  此时B仍可向A发送数据，B若发送数据，A仍要接收
- B向A发送断开请求 `[FIN] seq=y+1` 此时B状态为 `LAST_ACK`
- A向B响应 `[ACK] seq=x+1 ack=y+2` 此时A状态为 `TIME_WAIT`
