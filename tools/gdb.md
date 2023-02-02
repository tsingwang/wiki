# GDB

`gcc` 编译时加入 `-g` 参数，否则调试时看不到源代码

启动
```
gdb <prog>
gdb <prog> core   调试core文件(core是程序非法执行后core dump后产生的文件)
gdb attach <PID>  调试运行中的程序
detach
```

命令
```
set args 10 20 30   指定运行时参数
show args           查看设置好的运行参数

run(r)              从头开始运行程序
start               执行程序，停止main第一句

list(l)             列出源码
l 行号
l 函数名

next(n)
step(s)
continue(c)
until               运行完当前循环
finish              运行完当前函数

info(i)
i locals            查看当前栈局部变量的值
i args              查看当前栈局部变量的值
backtrace(bt)       打印函数调用栈
frame <n>           切换当前栈

print(p) <expr>
display 变量名      每次停顿时自动显示
undisplay

set var sum = 0     修改变量值
call 函数(参数)
```

断点
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
delete 断点号
clear               清除所有停止点
```

观测点
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
