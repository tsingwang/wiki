---
title: tcpdump
weight: 100
---

# tcpdump

- https://github.com/the-tcpdump-group/tcpdump
- https://github.com/the-tcpdump-group/libpcap

`tcpdump` 核心实现是 `libpcap` 库，`tcpdump` 流程：
1. 解析命令行参数(参数很多)
2. 输入分为：从离线文件读取和从网卡实时读取
    - `-r` 从 pcap 包离线文件读取 `pcap_t *pd = pcap_open_offline(RFileName, ebuf)`
    - 或默认：Live capture from network interface
      - 可以使用 `-i` 参数指定网卡，如果不指定网卡，则默认使用第一个网卡 `pcap_lookupdev()`
      - `pcap_t *pd = pcap_open_live(device, ...)`
3. 根据命令参数，编译 BPF 过滤规则 `pcap_compile()`
4. 应用 BPF 过滤规则 `pcap_setfilter()`
5. 输出分为：默认打印或 `-w` 写入文件，两者的回调函数不一样，写文件的回调为 `pcap_dump()`
6. 最终调用 `pcap_loop(pd, cnt, callback, pcap_userdata)`
    - `cnt` 是 `-c` 参数值只抓多少个包，默认 `-1` 表示无限制
    - libpcap 内部根据第一个参数 `pcap_t` 判断是否是离线解析还是实时抓取，而后每个包都将调用 `callback`

可以看到基本是 `libpcap` 库的接口使用，而该库又支持很多平台，再往下是怎么抓包的还不清楚。

## 用法

```sh
tcpdump -i eth0 host 192.168.1.100 and port 53
```
