---
title: gdb
weight: 20
---

## gdb

`gcc` 编译时加入 `-g` 参数，否则调试时看不到源代码

### TUI
- Ctrl+X+A: 打开/关闭 TUI 窗口
- Ctrl+X+2: 切换不同的 TUI 窗口
- Ctrl+L: 因TUI不稳定，显示乱时需要刷新

```
layout src    显示代码视图
layout asm    显示汇编代码视图
layout regs   显示当前的寄存器状态和它们的值
```

### 启动
```
gdb <prog>
gdb <prog> core   调试core文件(core是程序非法执行后core dump后产生的文件)
gdb attach <PID>  调试运行中的程序
detach
```

### 命令
```
set args 10 20 30   指定运行时参数
show args           查看设置好的运行参数

start               执行程序，停止main第一句
run(r)              从头开始运行程序，直到下一个断点或程序结束

list(l)             列出源码
l 行号
l 函数名

disassemble         反汇编当前函数或指定的代码区域

next(n)
nexti(ni)           汇编指令，不进入函数内部
step(s)
stepi(si)           汇编指令，如果是函数调用则进入函数
continue(c)         从当前位置继续执行程序，直到下一个断点或程序结束
until               运行完当前循环
finish              运行完当前函数

info(i)
i locals            查看当前栈局部变量的值
i args              查看当前栈局部变量的值
i frame             查看当前栈
i frame 2           查看第2层栈
i reg               查看寄存器

backtrace(bt)       打印函数调用栈
frame <n>           切换当前栈

print(p) <expr>     打印变量的值
p/x $rsp            打印栈指针的值，以十六进制显示
x/s <addr>          以字符串查看内存地址内容
x/x <addr>          以16进制查看内存地址内容
x/2x <addr>         以16进制查看内存地址内容，2个单位
x/d <addr>          以10进制查看内存地址内容

display 变量名      每次停顿时自动显示
undisplay

set var sum = 0     修改变量值
call 函数(参数)
```

### 断点
```
break(b)
b 函数名
b 行号
b 文件名:行号
b 行号 if var > 0   条件断点
tbreak              临时断点，首次到达后自动删除的断点

i breakpoints
disable 断点号
enable 断点号
delete(d) 断点号
clear               清除所有停止点
```

### 观测点
```
watch <expr>        一旦表达式值有变化，马上停住
i watchpoints
```

## cgdb

```
ESC   切换到代码窗口
i     切换到 gdb 窗口
```

浏览代码是 vim 按键风格，在代码窗口其他一些快捷键
```
o     查看代码所在的文件
空格  切换断点
+/-   调整代码窗口大小
F5    Send a run command to GDB.
F6    Send a continue command to GDB.
F7    Send a finish command to GDB.
F8    Send a next command to GDB.
F10   Send a step command to GDB.
```

自定义配置 `~/.cgdb/cgdbrc`
```
set ignorecase
set wso=vertical
set hls
map <F9> :until<cr>
```
