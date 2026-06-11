// CloudWatch alarms and dashboard for basic monitoring

locals {
  name_prefix = "ca-${var.environment}"
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name        = "${local.name_prefix}-alb-5xx"
  alarm_description = "ALB target 5xx errors"
  namespace         = "AWS/ApplicationELB"
  metric_name       = "HTTPCode_Target_5XX_Count"
  statistic         = "Sum"
  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
  }
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alert_email != "" ? [aws_sns_topic.alerts.arn] : []
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name        = "${local.name_prefix}-rds-cpu"
  alarm_description = "RDS high CPU"
  namespace         = "AWS/RDS"
  metric_name       = "CPUUtilization"
  statistic         = "Average"
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
  period              = 300
  evaluation_periods  = 2
  threshold           = 75
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alert_email != "" ? [aws_sns_topic.alerts.arn] : []
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name        = "${local.name_prefix}-ecs-cpu"
  alarm_description = "ECS cluster CPU high"
  namespace         = "AWS/ECS"
  metric_name       = "CPUUtilization"
  statistic         = "Average"
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
  }
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.alert_email != "" ? [aws_sns_topic.alerts.arn] : []
}

// Dashboard
data "template_file" "dashboard_body" {
  template = file("${path.module}/dashboard.json.tpl")
  vars = {
    aws_region      = var.aws_region
    alb_arn_suffix  = aws_lb.alb.arn_suffix
    db_instance_id  = aws_db_instance.postgres.id
    ecs_cluster_name = aws_ecs_cluster.main.name
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"
  dashboard_body = data.template_file.dashboard_body.rendered
}

// SNS topic for alert notifications
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

