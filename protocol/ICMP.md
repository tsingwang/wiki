# ICMP (Internet Control Message Protocol)

- 在IP数据报传输过程中发生错误，路由器会丢弃数据包，并向源头发送 ICMP 消息
- ICMP 不像 IP 协议和 ARP 协议一样直接传递给数据链路层，而是先封装成 IP 数据包然后再传递给数据链路层
- 但是 ICMP 分担了 IP 的一部分功能。所以，他也被认为是与 IP 同层的协议。
- ICMP协议的类型分为两大类，查询报文和差错报文
  - 差错报文：ICMP 数据内容包含了各种错误原因
  - 查询报文：用于诊断工具，ping等

## ping

利用ICMP回显请求和回显应答报文，而不用经过传输层(TCP/UDP)。Ping服务器一般在内核中实现ICMP的功能。

1. 向目的服务器发送 ICMP 回显请求
2. 目的服务器发送 ICMP 回显应答
3. 源服务器显示相关数据

### DoS (Denial of Service)

ICMP洪水攻击(FLOOD ATTACK)就是对目的主机发送洪水般的ping包，使目的主机忙于处理ping包而无能力处理其他正常请求  
`sudo ping -f <address>`

高级的攻击：将源地址伪装成攻击主机的IP，然后发广播的给所有主机，主机们收到该echo request后集体向攻击主机回包，造成群起而攻之的情景。

## traceroute

原理是利用 IP 包的 TTL 从 1 开始按照顺序递增的同时发送 UDP 包，强制接收 ICMP 超时消息的方法  
1. 设置TTL=1，发送 UDP 包，超时，获取第一个节点信息
2. 设置TTL=2，发送 UDP 包，超时，获取第二个节点信息
3. ...直到该数据包能抵达目的IP地址
这样就可以拿到了所有节点的信息

- `traceroute` 支持TCP/UDP/ICMP协议数据包探测路径，默认使用UDP协议发送探测数据包
  - traceroute -I/--icmp
- `tracepath` 只支持UDP协议数据包探测路径，不能控制数据包，所以不需要root权限
- `mtr` 支持TCP/UDP/ICMP协议数据包探测路径，默认使用ICMP协议发送探测数据包
