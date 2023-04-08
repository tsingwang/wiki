---
title: Guardian
weight: 3
---

# django-guardian

提供对象级别的权限控制  
相比Django自身的Model权限表来说，只是多了个object的信息字段

数据库模型如下  
`id | object_pk | content_type_id | permission_id | user_id`
