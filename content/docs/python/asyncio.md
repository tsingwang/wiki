---
title: 异步编程
weight: 20
bookToc: true
---

# 异步编程

## 协程 Coroutine

协程是在单个线程中实现的异步函数，可以在需要的时候暂停执行，在需要的时候恢复执行。

## yield & send

早期的协程是通过生成器实现的。

每个生成器都可以执行 `send()` 方法，为生成器内部的 `yield` 语句发送数据。
此时 `yield` 语句不再只是 `yield xxx` 的形式，可以是 `var = yield xxx` 的赋值形式。
它同时具备两个功能，一是暂停并返回函数，二是接收外部 `send()` 方法发送过来的值，重新激活函数，并将这个值赋值给 var 变量。

```python
def consumer():
    status = True
    while True:
        # yield返回状态，并接收 send 参数 n
        n = yield status
        print("我拿到了{}!".format(n))
        if n == 3:
            status = False

def producer(consumer):
    n = 5
    while n > 0:
        # yield给主程序返回消费者的状态
        yield consumer.send(n)
        n -= 1

# return a generator object
c = consumer()

# 重要：将生成器的语句推进到第一个yield语句出现的位置，此时yield语句还没有被执行
c.send(None)

# return a generator object
p = producer(c)
for status in p:
    if status == False:
        print("我只要3,4,5就行啦")
        break
```

## @asyncio.coroutine 与 yield from

在3.5之前，asyncio 是使用它来创建协程的

- `@asyncio.coroutine`：asyncio模块中的装饰器，用于将一个生成器声明为协程
- `yield from` 语法可以把生成器的操作委托给另一个生成器

```python
import asyncio

@asyncio.coroutine
def compute(x, y):
    print("Compute %s + %s ..." % (x, y))
    yield from asyncio.sleep(1.0)
    return x + y

@asyncio.coroutine
def print_sum(x, y):
    result = yield from compute(x, y)
    print("%s + %s = %s" % (x, y, result))

loop = asyncio.get_event_loop()
tasks = [print_sum(1, 2), print_sum(3, 4)]
loop.run_until_complete(asyncio.gather(*tasks))
loop.close()
```

## async/await

Python3.5中对协程提供了更直接的支持，引入了async/await关键字

使用 `async` 代替 `@asyncio.coroutine`，使用 `await` 代替 `yield from`

- `async`: async函数和普通函数区别是，执行时可以暂停，交出执行权
- `await`: 执行遇到await，会在异步任务开始执行之后，暂停当前 async 函数的执行，
  把执行权交给事件循环，让其他 async 函数执行，等待下次被唤醒

## event loop

asyncio 在单线程上启动一个事件循环(event loop)，时刻监听新进入循环的事件，加以处理，并不断重复这个过程，直到异步任务结束。

python 3.7 的使用方式
- 先通过 `asyncio.get_event_loop()` 获取事件循环 loop 对象
- 然后通过不同的策略调用 `loop.run_until_complete()` 或者 `loop.run_forever()` 执行异步函数

在 python 3.7 之后的版本，直接使用 `asyncio.run()` 即可，该函数总是会创建一个新的事件循环并在结束时进行关闭。

```python
import asyncio

async def main():
    print('Hello ...')
    await asyncio.sleep(1)
    print('... World!')

asyncio.run(main())
```

## Task

await 将当前协程会挂起，让出 CPU 资源，但会阻塞当前协程。

下面代码在等待 1 秒后打印 "hello"，然后 再次 等待 2 秒后打印 "world"
```python
import asyncio
import time

async def say_after(delay, what):
    await asyncio.sleep(delay)
    return what

async def main():
    print(f"started at {time.strftime('%X')}")
    print(await say_after(2, 'hello'))
    print(await say_after(1, 'world'))
    print(f"finished at {time.strftime('%X')}")

asyncio.run(main())
```

输出
```
started at 17:13:52
hello
world
finished at 17:13:55
```

`asyncio.create_task()` 将一个协程对象转化为一个任务对象，并将该任务对象加入到事件循环中进行调度。
不会阻塞当前协程，返回该任务对象，并立即返回，不会阻塞当前协程。
另外，由于任务对象是异步的，它可以在后台进行处理。

```python
import asyncio
import time

async def say_after(delay, what):
    await asyncio.sleep(delay)
    return what

async def main():
    task1 = asyncio.create_task(say_after(2, 'hello'))
    task2 = asyncio.create_task(say_after(1, 'world'))
    print(f"started at {time.strftime('%X')}")
    print(await task1)
    print(await task2)
    print(f"finished at {time.strftime('%X')}")

asyncio.run(main())
```

预期的输出显示代码段的运行时间比之前快了 1 秒
```
started at 17:14:32
hello
world
finished at 17:14:34
```

task 对象是一个 Future 对象的子类，它表示一个异步操作的执行状态。
通过 task 对象，可以获取该异步操作的执行状态，包括是否完成、是否出现异常、返回值等信息。
此外，task 对象还提供了一些方法，如添加回调函数、取消操作等。

## gather

`asyncio.gather()` 接受多个协程作为参数，并返回一个协程。
调用该协程时，它会并发运行所有的协程，并在它们全部完成后返回一个包含所有返回值的列表。

gather 不是创建新的 task 对象，而是将多个协程对象封装成一个 Future 对象，然后将这个 Future 对象提交给事件循环进行调度。
和 task 对象一样，Future 对象也表示一个异步操作的执行状态，但是它不能添加回调函数、取消操作等。

```python
import asyncio

async def coroutine_1():
    await asyncio.sleep(1)
    return 1

async def coroutine_2():
    await asyncio.sleep(2)
    return 2

async def main():
    results = await asyncio.gather(coroutine_1(), coroutine_2())
    print(results)

asyncio.run(main())
```

## Lock

`asyncio.Lock` 用于 asyncio 任务的互斥锁，用来保证对共享资源的独占访问。

```python
lock = asyncio.Lock()
async with lock:
    # access shared state
```
