# cert-manager

支持基于 ACME 协议与 Let's Encrypt 签发免费证书并为证书自动续期

## Issuer & ClusterIssuer

- `Issuer` 只能用来签发自己所在 namespace 下的证书
- `ClusterIssuer` 可以签发任意 namespace 下的证书

配置两个 ClusterIssuer，原因是Let’s Encrypt 的生产环境有着非常严格的接口调用限制，最好是在测试环境测试通过后，再切换为生产环境。

```yaml
# cat cluster-issuer-letsencrypt-prod.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: XXXXXX
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
       ingress:
         ingressClassName: nginx
    - http01:
       ingress:
         ingressClassName: nginx2
```

```yaml
# cat cluster-issuer-letsencrypt-staging.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: XXXXXX
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
       ingress:
         ingressClassName: nginx
```

## Certificate

该样例使用会自动创建 Certificate

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    acme.cert-manager.io/http01-ingress-class: nginx2
spec:
  ingressClassName: nginx2
  tls:
  - secretName: api-tls
    hosts:
    - example.example.com
  rules:
  - host: example.example.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: api
            port:
              number: 80
```

## Troubleshooting

```bash
kubectl describe certificate -A
kubectl describe certificaterequest -A
kubectl describe order -A
kubectl describe challenge -A
```
