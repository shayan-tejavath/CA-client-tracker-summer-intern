# AWS free-tier-friendly deployment with Terraform

This project uses a low-cost learning architecture:

- React/Vite build in a private S3 bucket
- CloudFront as the public HTTPS endpoint
- Express API in Docker on one public EC2 instance
- MongoDB Atlas free cluster
- Uploaded documents on the EC2 encrypted root disk

It deliberately does not use a NAT Gateway, Application Load Balancer, ECS
Fargate, EFS, ECR, or Secrets Manager.

## Important cost warning

This setup has no large fixed AWS networking components, but AWS does not
guarantee that every account will run it for $0.

AWS changed its Free Tier program on July 15, 2025. New customers may receive
up to $200 in credits and a Free Plan for up to six months. Older accounts
have different eligibility rules. EC2, storage, data transfer, S3 requests,
and CloudFront usage can produce charges after credits or allowances expire.

Before deploying:

1. Open `AWS Billing -> Free Tier` and check your account's eligibility.
2. Open `AWS Billing -> Budgets` and create a small monthly cost budget.
3. Verify that `t3.micro` is covered for your account and region.

The stack does not allocate an Elastic IP. The instance still needs one
automatically assigned public IPv4 address, which AWS may bill separately
when it is not covered by your account's credits or allowances.

## Tradeoffs

This design is for a portfolio, internship, demo, or low-traffic project:

- There is one server and no automatic failover.
- Deployments briefly restart the backend.
- Uploads are lost if the EC2 instance is destroyed.
- Stopping and starting EC2 can change its public IP and DNS name. Run
  Terraform and deploy again, then update the MongoDB Atlas allowlist.
- CloudFront sends API traffic to EC2 over HTTP. A secret origin header blocks
  requests that bypass CloudFront, but the CloudFront-to-EC2 hop is not TLS.

Do not use this architecture for sensitive production client documents.

## Prerequisites

Install and authenticate:

1. Terraform 1.6 or newer
2. AWS CLI v2 (`aws configure`)
3. Node.js 20 or newer
4. Windows OpenSSH (`ssh`, `scp`, and `ssh-keygen`)
5. A MongoDB Atlas free cluster

Docker Desktop is not required because the backend image is built on EC2.

Your AWS identity needs permission to manage VPC, EC2, S3, CloudFront, SSM
parameter reads, and EC2 key pairs.

## 1. Generate an SSH key

From PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh" | Out-Null
ssh-keygen -t ed25519 -f "$HOME\.ssh\ca-client-tracker"
```

Keep the private key secret. Terraform uploads only the `.pub` file.

## 2. Find your public IP

Open `https://checkip.amazonaws.com` in a browser. Add `/32` to the returned
IPv4 address. For example:

```text
203.0.113.10/32
```

This address is used only to allow SSH access.

## 3. Configure Terraform

```powershell
Copy-Item terraform\terraform.tfvars.example terraform\terraform.tfvars
```

Edit `terraform/terraform.tfvars` and replace `admin_cidr`:

```hcl
aws_region         = "us-east-1"
project_name       = "ca-client-tracker"
environment        = "prod"
instance_type      = "t3.micro"
admin_cidr         = "YOUR_PUBLIC_IP/32"
ssh_public_key_path = "~/.ssh/ca-client-tracker.pub"
```

If your AWS account shows a different free-tier-eligible instance type, use
that type instead.

## 4. Configure backend secrets

```powershell
Copy-Item deploy\backend-secrets.example.json deploy\backend-secrets.json
```

Edit the new file:

```json
{
  "MONGODB_URI": "mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/qwikca?retryWrites=true&w=majority",
  "JWT_SECRET": "replace-with-a-long-random-secret",
  "INTERNAL_REGISTRATION_SECRET": "replace-with-another-long-random-secret",
  "CLOUDINARY_CLOUD_NAME": "",
  "CLOUDINARY_API_KEY": "",
  "CLOUDINARY_API_SECRET": ""
}
```

The real file is ignored by Git. URL-encode special characters in the MongoDB
password.

## 5. Review and deploy

First review the infrastructure:

```powershell
terraform -chdir=terraform init
terraform -chdir=terraform plan
```

Then run:

```powershell
.\deploy\deploy.ps1
```

Terraform displays its plan and asks for approval. The script then:

1. Creates EC2, S3, CloudFront, and networking resources.
2. Displays the EC2 public IP.
3. Pauses while you add the IP to MongoDB Atlas.
4. Copies the backend and secrets to EC2 over SSH.
5. Builds and starts the backend Docker container.
6. Builds the frontend and uploads it to S3.
7. Invalidates CloudFront.

In MongoDB Atlas, add the displayed `/32` address under:

`Security -> Network Access -> Add IP Address`

Do not use `0.0.0.0/0`.

## 6. Verify

Get the application URL:

```powershell
$url = terraform -chdir=terraform output -raw application_url
$url
Invoke-RestMethod "$url/api/health"
```

Expected health response:

```json
{"status":"ok"}
```

## Later deployments

Run the same script:

```powershell
.\deploy\deploy.ps1
```

## Troubleshooting

View backend logs:

```powershell
$ip = terraform -chdir=terraform output -raw backend_public_ip
ssh -i "$HOME\.ssh\ca-client-tracker" "ec2-user@$ip" `
  "sudo docker logs --tail 100 ca-client-tracker-backend"
```

If your home public IP changes, update `admin_cidr` in
`terraform/terraform.tfvars` and run `terraform apply`.

## Destroy

Back up uploads first. Destroying EC2 permanently deletes its local uploads:

```powershell
terraform -chdir=terraform destroy
```
