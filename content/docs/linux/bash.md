---
title: Bash
weight: 1
---

# Bash

> - [阮一峰《Bash 脚本教程》](https://wangdoc.com/bash/)

## 快捷键

快捷键并不是由Bash来控制的, 而是有一个叫 `readline` 的库来控制的  
readline 库用在很多地方, 比如gdb, mysql

光标移动
- Ctrl + A ：移到命令行首
- Ctrl + E ：移到命令行尾
- Ctrl + F ：按字符前移（右向）
- Ctrl + B ：按字符后移（左向）
- Alt + F ：按单词前移（右向） Ctrl + Right
- Alt + B ：按单词后移（左向） CTrl + Left

编辑
- Ctrl + U ：从光标处删除至命令行首
- Ctrl + K ：从光标处删除至命令行尾
- Ctrl + D ：删除光标处的字符
- Ctrl + H ：删除光标前的字符
- Ctrl + W ：删除光标前的单词

重新执行命令
- Ctrl + R：逆向搜索命令历史  
  输入你想要的命令中含有的单词, 就会出现含有这个单词的命令  
  如果它不是你想要的命令, 就继续按Ctrl-R, 直到出现你想要的命令为止
- Ctrl + P：历史中的上一条命令
- Ctrl + N：历史中的下一条命令
- Alt + .：使用上一条命令的最后一个参数

控制命令
- Ctrl + L：清屏
- Ctrl + C：终止命令
- Ctrl + Z：挂起命令
- Ctrl + D：如果光标在行首且当前行没有输入任何字符, C-d会退出当前会话

## 模式扩展

### 大括号扩展

```sh
mkdir {2007..2009}-{01..12}

for i in {1..9..2}
do
  echo $i
done
```

### 算术扩展

```sh
$ echo $((2 + 2))
4
```

### globstar 参数

globstar参数可以使得 `**` 匹配零个或多个子目录

`ls **/*.txt`

### Here 文档

```sh
$ cat << _EOF_
<html>
  ...
</html>
_EOF_

$ cat <<< 'hi there'
# 等同于
$ echo 'hi there' | cat
```

### Command Substitution 命令替换

把一个命令的结果赋值给一个变量，除了较老的写法 `command` 外，也可以使用 `$(command)`

```sh
echo "TIME: `date +'%Y-%m-%d %H:%M:%S'`"
echo "TIME: $(date +'%Y-%m-%d %H:%M:%S')"
greeting=`./hello`
```

## Variable

- Bash 变量分成环境变量和自定义变量两类
- 变量是没有类型的，都认为是字符串
- 变量赋值等号 = 两边没有空格
- 若该变量为扩增变量内容时，则可用 `$变量` 或 `${变量}` 累加内容
  `PATH=$PATH:/home/bin`
- 在一串指令中，还需要藉由其它的指令提供的信息，可以使用反单引号`指令`或`$(指令)`
  `version=$(uname -r)`
- `export` 命令用来向子 Shell 输出变量，对于子 Shell 来说就是环境变量

### 特殊变量

- `$0` 脚本本身的名字
- `$1` 传递给该shell脚本的第一个参数
- `$2` 传递给该shell脚本的第二个参数
- `$@` 传给脚本的所有参数的列表
- `$#` 传给脚本的参数个数
- `$?` 上一指令的返回值，0表示正确
- `$_` 为上一个命令的最后一个参数
- `$$` Process ID (PID) of the script itself. 常用建临时文件唯一名

### 默认值

- `${varname:-word}`: 如果变量varname存在且不为空，则返回它的值，否则返回word
- `${varname:=word}`: 如果变量varname存在且不为空，则返回它的值，否则将它设为word，并且返回word
- `${varname:+word}`: 如果变量名存在且不为空，则返回word，否则返回空值。它的目的是测试变量是否存在
- `${varname:?word}`: 如果变量varname存在且不为空，则返回它的值，否则打印出varname: message，并中断脚本的执行

### 声明

`declare` 命令可以声明一些特殊类型的变量
- `-a`：声明数组变量。
- `-i`：声明整数变量。
- `-r`：声明只读变量。
- `-l`：声明变量为小写字母。
- `-u`：声明变量为大写字母。
- `-p`：查看变量信息。
- `-f`：输出所有函数定义。
- `-F`：输出所有函数名。
- `-x`：该变量输出为环境变量。

```sh
$ declare -i val1=12 val2=5
$ declare -i result
$ result=val1*val2
$ echo $result
60
```

`let` 命令声明变量时，可以直接执行算术表达式
```sh
$ let foo=1+2
$ echo $foo
3
```

## 字符串

- `${#varname}` 获取字符串长度
- `${varname:offset:length}` 提取子串，如果省略length，则从位置offset开始，一直返回到字符串的结尾

## 解析命令行参数

`shift` 把参数向左移位，`$1 <--- $2, $2 <--- $3, $3 <--- $4`, etc.
```sh
until [ -z "$1" ]  # Until all parameters used up ...
do
  echo -n "$1 "
  shift
done
```

```sh
while getopts 'lha:' OPTION; do
  case "$OPTION" in
    l)
      echo "linuxconfig"
      ;;

    h)
      echo "h stands for h"
      ;;

    a)
      avalue="$OPTARG"
      echo "The value provided is $OPTARG"
      ;;
    ?)
      echo "script usage: $(basename $0) [-l] [-h] [-a somevalue]" >&2
      exit 1
      ;;
  esac
done
shift "$(($OPTIND - 1))"
```

## 条件判断

```sh
echo -n "输入一个1到3之间的数字（包含两端）> "
read character
if [ "$character" = "1" ]; then
    echo 1
elif [ "$character" = "2" ]; then
    echo 2
elif [ "$character" = "3" ]; then
    echo 3
else
    echo 输入不符合要求
fi

if grep -q Bash file
  then echo "File contains at least one occurrence of Bash."
fi
```

`[` 这个字符是test命令的一种简写形式，可以看作是一个独立的命令，这解释了为什么它后面必须有空格。
```sh
$ test -f /etc/hosts
$ echo $?
0

$ [ -f /etc/hosts ]
$  echo $?
0
```

### File test operator 文件测试运算符

- `[ -a file ]`：如果 file 存在，则为true。
- `[ -b file ]`：如果 file 存在并且是一个块（设备）文件，则为true。
- `[ -c file ]`：如果 file 存在并且是一个字符（设备）文件，则为true。
- `[ -d file ]`：如果 file 存在并且是一个目录，则为true。
- `[ -e file ]`：如果 file 存在，则为true。
- `[ -f file ]`：如果 file 存在并且是一个普通文件，则为true。
- `[ -L file ]`：如果 file 存在并且是一个符号链接，则为true。
- `[ -p file ]`：如果 file 存在并且是一个命名管道，则为true。
- `[ -S file ]`：如果 file 存在且是一个网络 socket，则为true。
- `[ -r file ]`：如果 file 存在并且可读（当前用户有可读权限），则为true。
- `[ -w file ]`：如果 file 存在并且可写（当前用户拥有可写权限），则为true。
- `[ -x file ]`：如果 file 存在并且可执行（有效用户有执行／搜索权限），则为true。
- `[ FILE1 -nt FILE2 ]`：如果 FILE1 比 FILE2 的更新时间更近，或者 FILE1 存在而 FILE2 不存在，则为true。
- `[ FILE1 -ot FILE2 ]`：如果 FILE1 比 FILE2 的更新时间更旧，或者 FILE2 存在而 FILE1 不存在，则为true。
- `[ FILE1 -ef FILE2 ]`：如果 FILE1 和 FILE2 引用相同的设备和 inode 编号，则为true。

### 字符串判断

- `[ string ]`：如果string不为空（长度大于0），则判断为真。
- `[ -n string ]`：如果字符串string的长度大于零，则判断为真。
- `[ -z string ]`：如果字符串string的长度为零，则判断为真。
- `[ string1 = string2 ]`：如果string1和string2相同，则判断为真。
- `[ string1 == string2 ]` 等同于[ string1 = string2 ]。
- `[ string1 != string2 ]`：如果string1和string2不相同，则判断为真。
- `[ string1 '>' string2 ]`：如果按照字典顺序string1排列在string2之后，则判断为真。
- `[ string1 '<' string2 ]`：如果按照字典顺序string1排列在string2之前，则判断为真。

注意，test命令内部的`>和<`，必须用引号引起来（或者是用反斜杠转义）。否则，它们会被 shell 解释为重定向操作符。

### 整数判断

- `[ integer1 -eq integer2 ]`：如果integer1等于integer2，则为true。
- `[ integer1 -ne integer2 ]`：如果integer1不等于integer2，则为true。
- `[ integer1 -le integer2 ]`：如果integer1小于或等于integer2，则为true。
- `[ integer1 -lt integer2 ]`：如果integer1小于integer2，则为true。
- `[ integer1 -ge integer2 ]`：如果integer1大于或等于integer2，则为true。
- `[ integer1 -gt integer2 ]`：如果integer1大于integer2，则为true。

### 正则判断

`[[ expression ]]` 这种判断形式，支持正则表达式

```sh
INT=-5
if [[ "$INT" =~ ^-?[0-9]+$ ]]; then
  echo "INT is an integer."
  exit 0
else
  echo "INT is not an integer." >&2
  exit 1
fi
```

### 逻辑判断

`[[]]` 逻辑运算可以写在一起

```sh
if [[ $INT -ge $MIN_VAL && $INT -le $MAX_VAL ]]; then
  echo "$INT is within $MIN_VAL to $MAX_VAL."
fi

if [ $INT -ge $MIN_VAL ] && [ $INT -le $MAX_VAL ]; then
  echo "$INT is within $MIN_VAL to $MAX_VAL."
fi
```

若前一个指令执行的结果为正确，在 Linux 底下会回传一个 $? = 0 的值
- cmd1 && cmd2
  - 若 cmd1 执行完毕且正确执行($?=0)，则开始执行 cmd2。
  - 若 cmd1 执行完毕且为错误 ($?≠0)，则 cmd2 不执行。
- cmd1 || cmd2
  - 若 cmd1 执行完毕且正确执行($?=0)，则 cmd2 不执行。
  - 若 cmd1 执行完毕且为错误 ($?≠0)，则开始执行 cmd2。

### 算术判断

```sh
if ((3 > 2)); then
  echo "true"
fi
```

## 循环

```sh
# 遍历文件
for f in *; do; echo $f; done

for var in con1 con2 con3 ...
do
    程序段
done

for (( 初始值; 限制值; 执行步阶 ))
do
    程序段
done

while [ condition ]
do
    程序段落
done

# 当 condition 条件成立时，就终止循环， 否则就持续进行循环的程序段。
until [ condition ]
do
    程序段落
done
```

## 函数

```sh
# 第一种
fn() {
  # codes
}

# 第二种
function fn() {
  # codes
}
```

- 函数参数通过 `$1 $2` 读取，调用时 `fn 1 2`
- 函数体内直接声明的变量，属于全局变量，整个脚本都可以读取。
- `local` 命令声明的变量，只在函数体内有效，函数体外没有定义。

## 数组

```sh
$ array[0]=val
$ array[1]=val
$ array[2]=val

# 也可以采用一次性赋值的方式创建
ARRAY=(value1 value2 ... valueN)
# 等同于
ARRAY=(
  value1
  value2
  value3
)

$ echo ${array[i]}     # i 是索引
$ foo=(a b c d e f)
$ echo ${foo[@]}
a b c d e f

${#array[@]}    # 数组的长度

foo+=(d e f)    # 追加数组成员
unset foo[2]    # 删除数组成员
```

## set

在脚本头部加上
- `set -x` 用来在运行结果之前，先输出执行的那一行命令。
- `set -u` 遇到不存在的变量就会报错，并停止执行。
- `set -e` 脚本只要发生错误，就终止执行。  
  某些命令的非零返回值可能不表示失败，这时可以暂时关闭set +e  
  不能捕获函数内部出错
- `set -E` 参数可以纠正这个行为，使得函数也能继承trap命令

## Process Substitution 进程替换

进程替换把一个进程的输出提供给另一个进程
```sh
cat <(ls -l)      # 等价于 ls -l | cat
diff <(ls dir1) <(ls dir2)
wget -q -O >(cat) http://baidu.com
```
wget的”-O”选项后本来应该是一个文件名的参数, 但是现在用>(cat)代替,
表示wget下载下来的内容放到一个临时文件中, 然后把这个临时文件名再传给cat命令
