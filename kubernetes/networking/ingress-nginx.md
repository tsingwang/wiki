# 原理

- 默认使用当前cluster内部的k8s client，访问k8s cluster资源数据，这个模块叫`Storer`  
  controller启动时就会运行它，它监听各种资源事件发给名为 `updateCh` 的 channel  
  store的作用像是存储了一份ingress、service等资源，它会不断从api同步

- controller容器里会再启动一个nginx进程，镜像里包含了nginx二进制文件  
  同时监听 `updateCh` 用来接收store发出的资源事件，这里有个 `syncQueue` 缓存这些事件，事件的消费是 `syncIngress` 方法  
  最终 `OnUpdate` 方法来转换为nginx的配置文件并执行 `nginx -s reload`

- 借助template来生成nginx.conf，`rootfs/etc/nginx/template/nginx.tmpl`  
  这里有大量lua脚本，比如所有服务都是 `proxy_pass http://upstream_balancer;`  
  lua脚本通过传递的变量来控制，比如 `set $proxy_upstream_name "default-api-5000";`

- `preStop` 会执行 `wait-shutdown`，给controller发送SIGTERM信号，让其友好退出  
  最终执行 `nginx -s quit`

# Install

In AWS we use a Network load balancer (NLB) to expose the NGINX Ingress controller behind a Service of `Type=LoadBalancer`.
记得需要在子网标记公网/私网，Service注解也可以指定哪个子网

可以做到外网LB和内网LB共用一个controller，控制权交给域名解析来决定是使用哪种LB  
不过有安全问题，用户本地修改 /etc/hosts 来通过内网域名解析外网LB，而内网一般没有认证，这样就从外网访问了  
不过官方有解释，enabling the additional internal load balancer only creates a load balancer.  
安全控制可以由各ingress注解完成 `whitelist-source-range`  
开启白名单，需要配置 `externalTrafficPolicy: Local`，否则nginx看到的ip是LB的IP，达不到控制作用。

不过这里又遇到个问题，就是 pod 访问 externalTrafficPolicy 为 Local 的LB类型Service，有时不通。  
kube-proxy 对 local模式的Service为了保留源IP，不做二次转发NAT。  
pod请求不会到LB，会被当作Service的扩展IP地址，被kube-proxy的iptables或ipvs转发。  
如果刚好集群节点或者Pod所在的节点上没有相应的后端服务Pod，就会发生网络不通的问题。  
TODO: 测试发现跟这个不一样，反而是相反的，ingress-nginx-controller 所在的节点上的pod访问是不通的，其他节点上的pod访问反而是通的  
并且不通的时候也不是一直不通，而是间歇性的，还没搞懂这个问题

## AWS TLS Termination

在LB上使用AWS ACM证书，官方默认创建的是AWS CLB，这里改用NLB

```
NLB:443(SSL_TERMINATION) -> NGINX:80
NLB:80 -> NGINX:2443 which 308 redirects to NLB:443
```

AWS NLB 绑定证书，nginx只负责HTTP，但是有个问题，nginx跳转链接依然想用https，实际上跳转链接为http的  
原因是NLB不能有效传递头：`X-Forwarded-Proto` `X-Forwarded-Port`  
解决办法：NLB的TargetGroup开启 proxy_protocol_v2，同时ingress nginx confimap配置 `use-proxy-protocol`  
但此方法又产生两个问题TargetGroup HealthCheck 显示unhealthy，实际上是健康的，另外初次访问会返回`Empty reply from server`，多刷新几次才好。

结论：还是不用这个为好

# Service Upstream

By default the NGINX ingress controller uses a list of all endpoints (Pod IP/port) in the NGINX upstream configuration.

The `nginx.ingress.kubernetes.io/service-upstream` annotation disables that behavior and instead uses a single upstream in NGINX, the service's Cluster IP and port.

This can be desirable for things like zero-downtime deployments as it reduces the need to reload NGINX configuration when Pods come up and down.

如果使用的话，那么只支持round-robin轮询，不支持Sticky Sessions。

# Rate Limiting

https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#rate-limiting

# Canary

如果想启用Canary功能，要再创建一个ingress用作canary，规则与原先ingress一样  
并设置`nginx.ingress.kubernetes.io/canary: "true"`，然后可以启用以下注释来配置Canary

https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary
