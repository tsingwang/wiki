# Redis 数据结构

## SDS (Simple Dynamic String)

```
+--------+-------------------------------+-----------+
| Header | Binary safe C alike string... | Null term |
+--------+-------------------------------+-----------+
         |
         `-> Pointer returned to the user.
```

`sds` 是指向 sdshdr `buf`(实际字符串) 的指针，不是header的位置  
为了节约内存，有几种不同大小的 sdshdr，sds 指针前一个字节 `flags` 指定了是哪种类型

- `sdshdr5` 最特殊的一个，只能存储小于32字节长度的字符串，`flags` 的低3位存储类型，高5位存储长度
- `sdshdr8` 等，`flags` 的低3位存储类型，高5位不使用
  - `len`: 当前字符串长度，不包含结尾'\0'
  - `alloc`: 当前分配的可用字符串长度，不包含header和结尾'\0'

## list (双向链表)

- `list` 通用的双向链表，无环，adlist
- `listNode` 链表中一个节点
- `listIter` 正向或反向的list迭代器

## dict 字典(Hash Table)

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
