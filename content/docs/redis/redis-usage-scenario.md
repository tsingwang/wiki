---
title: Redis使用场景
weight: 10
---

# Redis 使用场景

## 实现分布式锁

`setnx` 如果不存在key，则设置，返回1; 如果已存在，不做操作，返回0

```
result = setnx lock:action client_id
if not result:
    已被别人锁住
else:
    expire lock:action 5
    ... do something ...
    del lock:key
```
如果执行到中间出现异常了，可能会导致 del 指令没有被调用，这样就会陷入死锁，锁永远得不到释放。
即使加上expire，也不行，根源在于 setnx 和 expire 是两条指令而不是原子指令。

```
> set lock:action client_id nx ex 5
> ... do something ...
> del lock:action
```
上面这个扩展指令就是 setnx 和 expire 组合在一起的原子指令，解决了分布式锁的问题

不过如果业务逻辑执行的太长，以至于超出了锁的超时限制，就会出现超时问题。
