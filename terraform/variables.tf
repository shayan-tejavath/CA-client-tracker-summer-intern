variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "db_name" {
  type    = string
  default = "ca_db"
}

variable "db_username" {
  type    = string
  default = "ca_admin"
}

variable "db_password" {
  description = "RDS master password (use SSM/Secrets Manager in production)"
  type        = string
}

variable "backend_container_port" {
  type    = number
  default = 5000
}

variable "backend_image" {
  description = "ECR URI for backend container (example: 123456789012.dkr.ecr.us-east-1.amazonaws.com/ca-backend:latest)"
  type        = string
}

variable "frontend_build" {
  description = "If true, host frontend as static S3 + CloudFront. If false, frontend container will be used via ECR image provided in `frontend_image`."
  type        = bool
  default     = true
}

variable "frontend_image" {
  description = "Optional ECR URI for frontend container if not using S3 + CloudFront"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Optional Route53 domain name to create DNS records for (e.g. example.com). If empty, no Route53 records will be created."
  type        = string
  default     = ""
}

variable "allowed_cidrs" {
  description = "List of CIDR blocks allowed to access ALB if you want to restrict traffic"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "alert_email" {
  description = "Email address to receive CloudWatch alarm notifications. Leave empty to disable email subscription."
  type        = string
  default     = ""
}

variable "terraform_state_bucket" {
  description = "(Optional) S3 bucket name to store terraform state if using remote backend"
  type        = string
  default     = ""
}

variable "terraform_lock_table" {
  description = "(Optional) DynamoDB table name for locking when using S3 backend"
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Short lowercase name used in AWS resource names and tags."
  type        = string
  default     = "ca-client-tracker"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name may contain only lowercase letters, numbers, and hyphens."
  }
}
