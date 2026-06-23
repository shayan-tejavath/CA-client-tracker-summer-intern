output "alb_dns_name" {
  value = aws_lb.alb.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "backend_ecr_repo" {
  value = aws_ecr_repository.backend.repository_url
}

output "frontend_ecr_repo" {
  value = aws_ecr_repository.frontend.repository_url
}

output "uploads_s3_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "frontend_s3_bucket" {
  value = var.frontend_build ? aws_s3_bucket.frontend[0].bucket : ""
}

output "cloudfront_domain" {
  value = var.frontend_build ? aws_cloudfront_distribution.frontend_cf[0].domain_name : ""
}
