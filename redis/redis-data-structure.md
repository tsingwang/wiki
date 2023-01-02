# Redis 数据结构

## SDS (Simple Dynamic String) sds.c

```
+--------+-------------------------------+-----------+
| Header | Binary safe C alike string... | Null term |
+--------+-------------------------------+-----------+
         |
         `-> Pointer returned to the user.
```

`sds` 是指向 sdshdr `buf`(实际字符串) 的指针，不是header的位置  
为了节约内存，有几种不同大小的 sdshdr，sds 指针前一个字节 `flags` 指定了是哪种类型  
细节: 这里结构体使用了 `__attribute__ ((__packed__))`，表示按1字节对齐，这样buf[-1]就可以找到flags

- `sdshdr5` 最特殊的一个，只能存储小于32字节长度的字符串，`flags` 的低3位存储类型，高5位存储长度
- `sdshdr8` 等，`flags` 的低3位存储类型，高5位不使用
  - `len`: 当前字符串长度，不包含结尾'\0'
  - `alloc`: 当前分配的可用字符串长度，不包含header和结尾'\0'

## list (双向链表) adlist.c

- `list` 通用的双向链表，无环，adlist
- `listNode` 链表中一个节点
- `listIter` 正向或反向的list迭代器

## dict 字典(Hash Table) dict.c

- `dict` 哈希表
  ```c
  struct dict {
      dictType *type;

      /* 一般只用[0], [1]只用在 rehash 时过渡阶段 */
      dictEntry **ht_table[2];
      /* 表示元素的数量 */
      unsigned long ht_used[2];

      /* -1表示rehash没有进行，其他值表示当前迁移[0]的bucket槽位 */
      long rehashidx; /* rehashing not in progress if rehashidx == -1 */

      /* Keep small vars at end for optimal (minimal) struct padding */
      int16_t pauserehash; /* If >0 rehashing is paused (<0 indicates coding error) */
      /* size 为 bucket 槽位，这里存储2的次方是为了省内存 */
      signed char ht_size_exp[2]; /* exponent of size. (size = 1<<exp) */
  };
  ```
- `dictType` dict类型，包含哈希函数、key比较函数、value销毁函数等
- `dictEntry` dict 中一个元素，key/value 键值对  
  同时是一个单链表，包含同槽位的下一个元素(哈希冲突)
- `dictIterator` dict迭代器

### 渐进式rehash (incremental rehashing)

当需要扩容时需要rehash，比如当前key的数量/bucket槽位数量超过5  
这个过程会逐步把 [0] 表迁移到 [1] 表

- bucket 槽位 = hashFunction(key) & sizemask  
  rehash 其实就是 sizemask 变了
- 一次只迁移n个槽位，不会造成严重阻塞
- 正在rehash时新增元素，只会新增到[1]
- 正在rehash时查询，两个表都要查
- 每个元素迁移只是改变指针而已，不需要重新分配内存，rehash性能是很高的
- 最后迁移完，把 [1] 赋值给 [0]，并重置[1]

## 跳跃表 t_zset.c

用于有序集合，实现比红黑树简单，同时查询、插入、删除的平均复杂度为 O(logN)  
节点的层高是在插入节点时候确定的，并且是随机生成的 `zslRandomLevel()`，今后也不会再改  
理解起来还是有难度的

```c
typedef struct zskiplistNode {
    sds ele;
    double score;
    struct zskiplistNode *backward;   /* 后退指针，只能指向当前节点最底层的前一个节点 */
    struct zskiplistLevel {
        struct zskiplistNode *forward;  /* 指向本层下一个节点 */
        unsigned long span;   /* forward指向的节点与本节点之间的元素个数 */
    } level[];
} zskiplistNode;

typedef struct zskiplist {
    /* header: 跳跃表的一个特殊节点，它的level数组元素个数为32，不存数据，也不计入跳跃表的总长度 */
    /* tail: 指向跳跃表尾节点 */
    struct zskiplistNode *header, *tail;
    unsigned long length;   /* 跳跃表长度，除头节点之外的节点总数 */
    int level;  /* 跳跃表的高度 */
} zskiplist;
```

## 压缩列表 ziplist.c

压缩列表ziplist本质上是一个字节数组
```
<zlbytes> <zltail> <zllen> <entry> <entry> ... <entry> <zlend>
```

- `zlbytes` 压缩列表的字节长度，占4个字节
- `zltail` 尾元素相对于压缩列表起始地址的偏移量，占4个字节
- `zllen` 元素个数，占2个字节
- `zlend` 压缩列表的结尾，占1个字节，恒为0xFF
- 每个 entry 由 `<prevlen> <encoding> <entry-data>` 组成

目的只是为了节省内存？

## 整数集合 intset.c

当集合元素都是整型并且元素不多时使用intset保存，并且元素按从小到大顺序

## quicklist.c

quicklist是一个双向链表，链表中的每个节点是一个ziplist结构。  
quicklist可以看成是用双向链表将若干小型的ziplist连接到一起的一种数据结构。  
当ziplist节点个数过多，quicklist退化为双向链表，极端情况就是每个ziplist节点只包含一个entry，即只有一个元素。  
当ziplist节点个数过少，quicklist退化为ziplist，极端情况就是quicklist中只有一个ziplist节点。
