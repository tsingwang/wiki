- Vim doc 是最好的学习资料，`:tab help`
- Vim 严重依赖 Ctrl键，普通键盘小拇指会很吃力，可以用 CapsLock 代替

# 移动光标
```
hjkl        Left Down Up Right

w           Move to the start of the next word
b           Move backward to the start of the previous word
e           Move to the next end of a word
3w          移动3个

0           Move to the first character of the line
^           Move to the first non-blank character of the line
$           Move the cursor to the end of a line
2$          移动到下一行的末尾

f{char}     "fx" search forward in the line for character x. "f" stands for Find
F{char}     "Fx" search backward in the line for character x
            These two commands can be repeated with ";". "," for opposite direction.

%           Move to the matching paren
            When the cursor is not on a useful character, it will search forward to find one.

G           Move to the last line of the file
nG          ":n". 137G == :137
gg          1G
n%          "50%" moves you to halfway the file. "90%" goes to near the end.
H           Move to first line of window
M           Move to middle line of window
L           Move to last line of window

CTRL-U      Move the window up by half a screen
CTRL-D      Move the window down half a screen
CTRL-F      Scroll forward by a whole screen
CTRL-B      Scroll backward by a whole screen

zz          让光标所在行处于屏幕中间
```

# 搜索
```
/word       Search forward
?word       Search backward
*           Search forward the word nearest to the cursor
#           Search backward the word nearest to the cursor
            Repeat the search with "n", "N" for opposite direction.
```

# 编辑
```
i           Insert text before the cursor
I           Insert text before the first non-blank in the line
a           Append text after the cursor
A           Append text at the end of the line
o           Open a new line below the cursor and insert text
O           Open a new line above the cursor and insert text

x           Delete the character under the cursor
dw          Delete from cursor to next start of word
d4w         一次删4个单词
db          Delete from cursor to previous start of word
d$          Delete from the cursor to the end of the line. "D"
dd          Delete line
dG          Delete until the end of the file
dgg         Delete until the start of the file
daw         Delete word under the cursor (including white space)
diw         Delete word under the cursor (excluding white space)
J           Join line, delete a line break
cw          Delete a word and then puts you in Insert mode
c$          Change from the cursor to the end of the line. "C"
cc          Change a whole line
r           Replace the character under the cursor with your type
R           Replace mode
yw          Copy a word
y$          Copy from the cursor to the end of the line
yy          Copy a whole line. "Y"
p           Paste below or after the cursor
P           Paste above or before the cursor

u           Undo change
CTRL-R      Redo change which was undone

.           Repeat the last change
```

# Visual mode
```
v           Visual mode
V           Visual mode, work on whole lines
CTRL-V      Visual block mode, work on a rectangular block of characters
```
In Visual mode, if you need to change the other end of the selection, use the `o`

In Visual block mode, "I{string}<Esc>" insert the text {string} in each line.

you can also do:
```
    ~           swap case
    U           make uppercase
    u           make lowercase
    >           Shift the selected text to the right one shift amount
    <           Shift the selected text to the left one shift amount
    =           auto indent
```

# 分屏
```
:split          Split itself
:split file     Split another file
:vsplit         Split vertical
CTRL-W w        Jump between the windows
CTRL-W h        Jump to the window on the left
CTRL-W j        Jump to the window below
CTRL-W k        Jump to the window above
CTRL-W l        Jump to the window on the right
CTRL-W t        Jump to the top window
CTRL-W b        Jump to the bottom window
CTRL-W H        Move window to the far left
CTRL-W J        Move window to the bottom
CTRL-W K        Move window to the top
CTRL-W L        Move window to the far right
:only           Close all windows except the current one
:wall           Write all

:tabe file      Edit in a new tab page
:tab help       Show the help text in a new tab page
gt              Goto Tab, switch tab page
:tabonly        Close all tab pages except the current one
```

# 替换
```
:[range]substitute/from/to/[flag]   Change "from" string to "to" string
:s                  Work on current line
:%s                 Work on all lines
:%s/from/to/g       Without "g", Change only the first occurrence on each line
:%s/from/to/gc      With "c", Ask you for confirmation before each substitute
:1,5s/from/to/g     Work on the lines 1 to 5
:.,$s/from/to/g     Substitute in the lines from the cursor to the end
:.,.+4s/from/to/g   == :1,5s/from/to/g
```

# 其他
```
CTRL-Z      Suspend Vim and back to the shell
fg          Back to Vim

:!{command}     Executing shell commands

K       Run the external "man" program to lookup the keyword under the cursor
```

# 复制粘贴
需要装 gvim，默认使用匿名寄存器 ""
```
"+yy    Copy a line to the clipboard
"+p     Paste from the clipboard
:reg    显示所有寄存器内容，其中两个特殊的寄存器：* 和 +
        这两个寄存器是和系统相通的，前者关联系统选择缓冲区，后者关联系统剪切板，
        通过它们可以和其他程序进行数据交换
```

# Tab 替换成空格
```
:set expandtab
:%retab!
```
加!是用于处理非空白字符之后的TAB，即所有的TAB，若不加!，则只处理行首的TAB

# 格式转换
line-break problem, Change the file format to unix,dos,mac
```
:set fileformat=unix
:w
```

# 去掉所有多余的^M
```
:%s/[ctrl-v][ctrl-m]//g
```
中间CTRL部分不是输入，而是按键，显示 :%s/^M//g

# 补全
In Insert mode
```
CTRL-N          Completion, Search for a word after the cursor
CTRL-P          Completion, opposite direction
CTRL-X CTRL-F   Completing file name
CTRL-X CTRL-O   Omni completion, "p->" completing the items in "struct"
```

# tags
Tag is a location where an identifier is defined in "tags" file.

`ctags` is a separate program. Universal ctags
```
CTRL-]      Jump to a subject under the cursor
CTRL-W ]    Jump to a subject under the cursor in a split window
CTRL-W }    Preview
CTRL-T      Jump back
CTRL-O      Jump to older position
CTRL-I      Jump to newer position
``          Jump back and forth between two points

:set tags=~/prog/tags       Tell Vim where your tags file is
:tag func_name  Jump to function definition even if it is in another file
:tags           Show the list of tags that you traversed through
:tn             Jump to other matches for the same tag, [count]tn
:tp
:tfirst
:tlast
:tselect tagname
```

# Compiling
```
:make {args}    the name of the program is defined by the 'makeprg' option
:cn         Go to where the next error occurs
:cp         Go back to the previous error
:cc n       Go to n error
:cl         Overview of all the error messages
:cw         如果有错误列表，则打开quickfix窗口
```

# map
A mapping enables you to bind a set of Vim commands to a single key.
```
:map      定义普通模式下的键映射
:imap     定义插入模式下的键映射
:noremap  避免值嵌套映射或递归映射
:inoremap 插入模式下的
```
