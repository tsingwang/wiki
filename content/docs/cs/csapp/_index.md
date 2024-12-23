---
title: CSAPP
weight: 10
---

# Computer Systems: A Programmer's Perspective

## 1. 编译系统

```
        预处理                编译             汇编             链接
        Pre-processor         Compiler         Assembler        Linker
        (cpp)                 (cc1)            (as)             (ld)
hello.c ------------> hello.i -------> hello.s --------> hello.o ----> hello
                                                         printf.o --^
```

- **预处理**：会根据 `#` 开头的代码来修改原始代码，生成 `hello.i` 文本文件
- **编译**：词法分析、语法分析，生成汇编代码 `hello.s`
- **汇编**：把汇编程序翻译成机器指令，得到 **可重定位目标文件**
- **链接**：把可重定位文件和必要的系统文件组合起来，最终生成可执行目标文件

```sh
# -Og 是指示编译器遵循原始C代码的整体结构，主要作为学习工具
# 更高效的是用 -O1 或 -O2，不过汇编代码将做了大量转换，与C代码之间较难理解

# cpp: c preprocessor
$ gcc -E -o main.i main.c   # 或 cpp -o main.i main.c

# cc: c compiler
$ gcc -Og -S t.c            # 或 cc1 -S -o main.s main.i

# as: assembler
$ gcc -Og -c t.c            # 或 as -o main.o main.s

# 生成可执行文件，包含了自动链接，ld 命令手动链接需要提供类库的路径
$ gcc -Og main.c mstore.c
```

## 2. 信息的表示

- Big endian 大端：低地址 存储 高位字节
- Little endian 小端：低地址 存储 低位字节
- 检测代码：[endian_check.c](./endian_check.c)

```
整数
无符号 1011   2^3 + 2^1 + 2^0 = 11
有符号 1011  -2^3 + 2^1 + 2^0 = -5

浮点数
二进制中，最高位是符号位，中间部分是Exponent，后面是Fraction
```


## 3. 程序的机器级表示 汇编语言

x86-64 有两种汇编风格，AT&T和Intel风格，Linux默认使用 AT&T 汇编风格。

x86-64 CPU 包含一组 16 个存储 64 位的通用目的寄存器。
```
%rax: Return value, 函数返回值
%rbx
%rcx: Argument #4
%rdx: Argument #3
%rsi: Argument #2
%rdi: Argument #1
%rbp
%rsp: Stack pointer, push/pop和call/ret指令会修改这个值
%r8: Argument #5
%r9: Argument #6
%r10, %r11, %r12, %r13, %r14, %r15
```

- Callee saved 被调用者保存: %rbx, %rbp, %r12, %r13, %r14, %r15
- Caller saved 调用者保存: %rax, %rcx, %rdx, %rsi, %rdi, %r8, %r9, %r10, %r11

除了64位，也可以使用低位的，比如:
- %rax 低位有 %eax(32), %ax(16), %ah(8), %al(8)
- %r8 低位有 %r8d(32), %r8w(16), %r8b(8)

### 其他寄存器
- `%rip` instruction pointer，也称 PC，永远指向下一条需要执行的指令地址
- `%rflags` 条件码寄存器，记录最近操作的属性，如进位标志(CF)、符号标志(SF), 零标志(ZF)、溢出标志(OF)等

### 操作数指示符
```
%rax                  寄存器中的值
$0x108                立即数 0x108
0x104                 内存地址 0x104 的值
(%rax)                内存地址 %rax 的值
4(%rax)               内存地址 4 + %rax 的值
-4(%rax, %rdx)        内存地址 -4 + %rax + %rdx 的值
0xFF(, %rdx, 4)       内存地址 0xFF + 4*%rdx 的值
0xFF(%rax, %rdx, 4)   内存地址 0xFF + %rax + 4*%rdx 的值
```

### 指令

- `movq <S> <D>`：相当于 `D = S`，其他 movb(8) movw(16) movl(32) movq(64)
- `pushq %rax`：相当于 `subq $8, %rsp` 和 `movq %rax, (%rsp)` 两条指令，栈顶减法是因为栈是从高地址向低地址增长的
- `popq %rbx`：相当于 `movq (%rsp), %rbx` 和 `addq $8, %rsp` 两条指令
- `leaq 7(%rax, %rdx, 4), %rcx`：相当于 `%rcx = 7 + %rax + 4*%rdx`，计算方式同内存寻址，所以也叫加载有效地址指令
- `inc <D>`：相当于 `D = D + 1`
- `dec <D>`：相当于 `D = D - 1`
- `neg <D>`：相当于 `D = -D`
- `not <D>`：相当于 `D = ~D`，取补
- `add <S> <D>`：相当于 `D = D + S`
- `sub <S> <D>`：相当于 `D = D - S`
- `imul <S> <D>`：相当于 `D = D * S`
- `and <S> <D>`：相当于 `D = D & S`
- `or <S> <D>`：相当于 `D = D | S`
- `xor <S> <D>`：相当于 `D = D ^ S`
- `sal <k> <D>`：相当于 `D = D << k`，同 `shl`，因为都是补0，不分算术左移和算术左移
- `sar <k> <D>`：相当于 `D = D >> k`，算术右移，补符号位
- `shr <k> <D>`：相当于 `D = D >> k`，逻辑右移，补0
- `cmp <A> <B>`：同 `sub` 指令会根据两者的差来设置 `%rflags`，但不会更新 B 的值
- `test <A> <B>`：同 `and` 指令会与操作来设置 `%rflags`，但不会更新 B 的值
- `jg <Label>`：如果大于，跳转，类似还有 `jge` `jl` `jle` `je` 等
- `jmp <Label>`：总是跳转(不判断)
- `call <func>`：函数调用，会把返回地址(call下一条地址)压入栈中

  如果一个函数参数数量大于6，超出部分通过栈来传递，在 `call` 之前，由 caller 压栈的。
  被调用函数 callee 通过 `0x8(%rsp)` 获取第7个参数，`0x10(%rsp)` 获取第8个参数等。

  如果一个函数参数字节数很大，比如结构体，那么也是通过栈来传递的。
- `ret`：函数返回，栈中的返回地址弹出，并写入到 `%rip` 中

### Bomb Lab

这个实验特别有意思，强烈推荐 https://csapp.cs.cmu.edu/3e/labs.html

## ~~4. 处理器体系结构~~

看不懂

## ~~5. 优化程序性能~~

略过

## ~~6. 存储器层次结构~~

偏底层硬件，不懂

## 7. 链接

任何 Linux 程序都可以通过调用 `execve` 函数来调用加载器。
加载器将可执行目标文件中的代码和数据从磁盘复制到内存中，然后通过跳转到程序的第一条指令或入口点来运行该程序。
程序的入口点，也就是 `_start` 函数的地址。
这个函数是在系统目标文件 `ctrl.o` 中定义的，对所有的 C 程序都是一样的。
`_start` 函数调用系统启动函数 `__libc_start_main`，该函数定义在 `libc.so` 中。
它初始化执行环境，调用用户层的 `main` 函数，处理 `main` 函数的返回值，并且在需要的时候把控制返回给内核。

### 静态库
```sh
# 创建静态库
$ gcc -c addvec.c mulvec.c
$ ar rcs libvector.a addvec.o mulvec.o

# 使用静态库，只会复制静态库中用到的.o模块到可执行文件中
$ gcc -static main.o ./libvector.a
```
静态库链接时，命令行上的库和目标文件的顺序非常重要。
在符号解析阶段，链接器从左到右按照命令行上出现的顺序来扫描可重定位目标文件和存档文件。
如果 `gcc -static ./libvector.a main.o` 会报错。

### 共享库
```sh
# 创建共享库，-fpic 表示生成位置无关的代码
gcc -shared -fpic -o libvector.so addvec.o mulvec.o

# 没有任何 libvector.so 的代码和数据节真的被复制到可执行文件中。
# 链接器复制了一些重定位和符号表信息，它们使得运行时可以解析对 libvector.so 中代码和数据的引用。
gcc main.c ./libvector.so
```

Linux 系统为动态链接器提供了一个简单的接口，允许应用程序在运行时加载和链接共享库。
编译 `gcc -rdynamic main.c -ldl`

```c
void (*addvec)(int *, int *, int *, int);

/* Dynamically load the shared library containing addvec() */
void *handle = dlopen("./libvector.so", RTLD_LAZY);

/* Get a pointer to the addvec() function we just loaded */
addvec = dlsym(handle, "addvec");

/* Now we can call addvec() just like any other function */
addvec(x, y, z, 2);
```

## 8. 异常控制流 系统调用

C 程序用 `syscall` 函数可以直接调用任何系统调用。
所有到 Linux 系统调用的参数都是通过通用寄存器而不是栈传递的。
在 X86-64 系统上，寄存器 `%rax` 包含系统调用号，寄存器 `%rdi`、`%rsi`、`%rdx`、`%r10`、`%r8` 和 `%r9` 包含最多 6 个参数。
可以通过 `man syscall` 查看。

编译 `gcc -no-pie hello.s`
```asm
.section .data
string:
  .ascii "hello, world\n"
string_end:
  .equ len, string_end - string
.section .text
.globl main
main:
  # First, call write(1, "hello, world\n", 13)
  movq $1, %rax                 # write is system call 1
  movq $1, %rdi                 # Arg1: stdout has descriptor 1
  movq $string, %rsi            # Arg2: hello world string
  movq $len, %rdx               # Arg3: string length
  syscall                       # Make the system call

  # Next, call _exit(0)
  movq $60, %rax                # _exit is system call 60
  movq $0, %rdi                 # Arg1: exit status is 0
  syscall                       # Make the system call
```

## 9. 虚拟内存

虚拟内存分割为大小固定的块存储在磁盘上，称为**虚拟页（Virtual Page，VP）**，它有三种状态：
- **未分配的**：未分配的页没有任何数据和它们相关联，因此不占用任何磁盘空间。
- **缓存的**：当前已缓存在物理内存中的已分配页。
- **未缓存的**：未缓存在物理内存中的已分配页。

CPU 上有内存管理单元（Memory Management Unit，MMU）的专用硬件，利用存放在主存中的页表来动态解析虚拟地址(将一个虚拟地址转换为物理地址)。
**页表 Page Table** 将虚拟页映射到物理页。
每次地址翻译，硬件将一个虚拟地址转换为物理地址时，都会读取页表。
操作系统负责维护页表的内容，以及在磁盘与 DRAM 之间来回传送页。
在磁盘和内存之间传送页的活动叫做交换（swapping）或者页面调度（paging）。

当程序访问未缓存在物理内存中的已分配页将产生 **Page Fault 缺页**中断。
处理流程：选择一个牺牲页，如果这个牺牲页被修改过，那么就将它交换出去，换入新的页并更新页表。
当缺页处理程序返回时，CPU 重新启动引起缺页的指令，这条指令将再次发送虚拟地址到 MMU。这次，MMU 就能正常地翻译，而不会再产生缺页中断了。

PTE (Page Table Entry) 一些额外字段可定义权限。
- SUP 位表示进程是否必须运行在内核（超级用户）模式下才能访问该页。
  运行在内核模式中的进程可以访问任何页，但是运行在用户模式中的进程只允许访问那些 SUP 为 0 的页。
- READ 位和 WRITE 位控制对页面的读和写访问。

如果一条指令违反了这些许可条件，那么 CPU 就触发一个一般保护故障，将控制传递给一个内核中的异常处理程序。
一般将这种异常报告为 **Segmentation Fault 段错误**。

## ~~10. 系统级I/O~~
## ~~11. 网络编程~~
## ~~12. 并发编程~~

PS. 从第8章开始，大部分内容讲的是编程相关API，可参考TLPI
