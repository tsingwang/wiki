# EBS CSI Driver

https://github.com/kubernetes-sigs/aws-ebs-csi-driver

- 创建 Policy，Amazon_EBS_CSI_Driver
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:AttachVolume",
        "ec2:CreateSnapshot",
        "ec2:CreateTags",
        "ec2:CreateVolume",
        "ec2:DeleteSnapshot",
        "ec2:DeleteTags",
        "ec2:DeleteVolume",
        "ec2:DescribeInstances",
        "ec2:DescribeSnapshots",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DetachVolume",
        "ec2:DescribeVolumesModifications",
        "ec2:ModifyVolume"
      ],
      "Resource": "*"
    }
  ]
}
```

- `k -n kube-system describe configmap aws-auth` 确保里面role包含了 Amazon_EBS_CSI_Driver policy

- 部署EBS CSI Driver

- EKS 默认只有gp2类型的StorageClass，添加 gp3/st1 类型的
```yaml
# gp3-storage-class.yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: gp3
  #annotations:
  #  storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  csi.storage.k8s.io/fstype: xfs
allowVolumeExpansion: True
---
# st1-storage-class.yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: st1
provisioner: ebs.csi.aws.com
parameters:
  type: st1
  fsType: xfs
allowVolumeExpansion: True
```

`allowVolumeExpansion: True` 表示允许自动扩容volume，所以policy里面需要 `ec2:ModifyVolume` 权限

# EFS CSI Driver

https://github.com/kubernetes-sigs/aws-efs-csi-driver

- 创建一个Policy，并让EKS aws-auth role 包含该Policy

- 部署driver

- Create an Amazon EFS file system for your Amazon EKS cluster，需要手动创建一个

- 使用方式可以静态的或动态的
  - Dynamic provisioning: 会动态创建一个 access point 以隔离，当声明相同的PVC时也可以共享 ap
  - Static provisioning: 大家共用一个efs，没有隔离

```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: efs
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: fs-09984b655fc0b9e05
  directoryPerms: "700"
  gidRangeStart: "1000" # optional
  gidRangeEnd: "2000" # optional
  basePath: "/dynamic_provisioning" # optional
```
