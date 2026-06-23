# Terraform: CA Client Tracker deployment

This Terraform configuration provisions a minimal AWS infrastructure to run the CA Client Tracker app:

- VPC with public and private subnets
- ECS Fargate service for the backend (behind an ALB)
- ECR repositories for backend/frontend images
- RDS PostgreSQL instance
- S3 bucket for uploads and optional static frontend hosting
- CloudFront distribution for S3-hosted frontend (optional)

Prerequisites:
- AWS CLI configured (`aws configure`) or environment variables set
- Terraform >= 1.0
- Docker (to build images)

Quick start:

1. Build and push backend image to ECR (change region/account as appropriate):

```bash
AWS_REGION=us-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BACKEND_REPO=${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/ca-backend:latest

aws ecr create-repository --repository-name ca-backend || true
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
docker build -t ca-backend ./backend
docker tag ca-backend:latest $BACKEND_REPO
docker push $BACKEND_REPO
```

2. (Optional) Build & push frontend container or build static site and upload to S3.

3. Initialize and apply Terraform from the `terraform/` directory. Provide required variables (like `db_password` and `backend_image`):

```bash
cd terraform
terraform init
terraform plan -out=tfplan -var 'db_password=YourStrongPassword' -var 'backend_image=${BACKEND_REPO}'
terraform apply tfplan
```

4. After apply, get outputs:

```bash
terraform output alb_dns_name
terraform output rds_endpoint
terraform output cloudfront_domain
```

Notes & next steps:
- Use AWS Secrets Manager or SSM Parameter Store for production secrets rather than plain variables.
- Update `variables.tf` to match your domain and desired instance sizes.
- Consider enabling HTTPS by requesting an ACM certificate and attaching to an ALB (not fully automated in this template).

Repository setup for safe `terraform apply` via GitHub:
- Create a GitHub Environment named `production` (or change the name in `.github/workflows/ci-cd.yml`).
- In the repository settings → Environments → `production`, configure required reviewers or protection rules. This will require manual approval before the `terraform-apply` job runs.
- Ensure the following repository secrets are set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `DB_PASSWORD`.
- Optionally set `ALERT_EMAIL` if you want email alarm notifications.

To apply via Actions with approval:
1. Push to `main` — the workflow will build images and run `terraform plan`.
2. In Actions, open the CI/CD run and review the plan artifact.
3. Approve the `production` environment (via the Environments page) to allow the `terraform-apply` job to run and apply the plan.

Monitoring added by Terraform:
- A CloudWatch dashboard named `ca-<env>-dashboard` will be created with widgets for ALB 5xx errors, RDS CPU utilization, and ECS cluster CPU utilization.
- Alarms created:
	- `ca-<env>-alb-5xx` — fires on ALB target 5xx errors
	- `ca-<env>-rds-cpu` — fires when RDS CPU > 75%
	- `ca-<env>-ecs-cpu` — fires when ECS cluster CPU > 80%

Email alerts:
- Provide an `alert_email` variable when running Terraform to enable email notifications. Example:

```bash
terraform plan -var 'db_password=YourStrongPassword' -var 'backend_image=...'
	-var 'alert_email=ops@example.com'
```

- When you apply, Terraform will create an SNS topic and an email subscription. The recipient must confirm the subscription by following the confirmation link sent to their inbox.



