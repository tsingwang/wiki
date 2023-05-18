---
title: WebSocket
weight: 10
---

# WebSocket

## 握手

### 客户端握手请求

HTTP 版本必须是 1.1 或更高，方法必须是GET
```
GET /chat HTTP/1.1
Host: example.com:8000
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

`Sec-WebSocket-Key` 是客户端随机生成的经过 base64 编码的字符串。
用于证明服务端接收到的是一个可受信的连接握手，可以帮助服务端排除自身接收到的由非 WebSocket 客户端发起的连接。

### 服务器握手响应

```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

`Sec-WebSocket-Accept` 是把客户发送的 `Sec-WebSocket-Key` 和 `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` 连接起来，把结果用SHA-1编码，再用base64编码一次，就可以了。

伪代码 `toBase64( sha1( Sec-WebSocket-Key + 258EAFA5-E914-47DA-95CA-C5AB0DC85B11 ))`

据说这个UUID值是协议者设计如此，这个换算作用仅仅是避免意外非法连接，并不是真的验证用的。

## 数据帧格式

WebSocket客户端、服务端通信的最小单位是帧（frame），由1个或多个帧组成一条完整的消息（message）。
- 发送端：将消息切割成多个帧，并发送给服务端；
- 接收端：接收消息帧，并将关联的帧重新组装成完整的消息；

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+
```

- FIN：如果是1，表示这是消息的最后一个分片; 如果是0，表示不是消息的最后一个分片。
- RSV1, RSV2, RSV3：可以忽略，它们是用于扩展的
- opcode：操作代码，表示应该如何解析后续的数据载荷（data payload）。
  如果操作代码是不认识的，那么接收端应该断开连接。可选的操作代码如下：
  - 0x0：表示一个延续帧。表示本次数据传输采用了数据分片，当前收到的数据帧为其中一个数据分片。
  - 0x1：表示这是一个文本帧，总是用 UTF-8 编码
  - 0x2：表示这是一个二进制帧
  - 0x3-7：保留的操作代码，用于后续定义的非控制帧。
  - 0x8：表示连接断开。
  - 0x9：表示这是一个ping操作。
  - 0xA：表示这是一个pong操作。
  - 0xB-F：保留的操作代码，用于后续定义的控制帧。
- MASK: 表示是否要对数据载荷进行掩码操作。*不了解*
- Payload length：数据载荷的长度，单位是字节
  - 0~126：数据的长度为x字节。
  - 126：后续2个字节代表一个16位的无符号整数，该无符号整数的值为数据的长度。
  - 127：后续8个字节代表一个64位的无符号整数，该无符号整数的值为数据的长度。
- Masking-key：Mask为1，且携带了4字节的Masking-key；如果Mask为0，则没有Masking-key
- Payload data

**TODO: 连续帧，除了 FIN，没有标记帧的序号，如何确保帧的顺序呢**

## 心跳 ping/pong

为了保持连接，否则如何长时间没有交互，TCP通道很可能关闭。

在经过握手之后的任意时刻里，无论客户端还是服务端都可以选择发送一个 ping 给另一方。
当 ping 消息收到的时候，接受的一方必须尽快回复一个 pong 消息。
