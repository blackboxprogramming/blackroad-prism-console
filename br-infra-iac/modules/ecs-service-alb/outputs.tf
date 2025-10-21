output "alb_dns_name" {
  value = aws_lb.this.dns_name
}

output "service_name" {
  value = aws_ecs_service.this.name
}

output "https_url" {
  value = "https://${var.domain_name}"
}

output "tg_blue_arn" {
  value = aws_lb_target_group.tg.arn
}

output "tg_green_arn" {
  value = aws_lb_target_group.tg_canary.arn
}

output "https_listener_arn" {
  value = aws_lb_listener.https.arn
}

output "alb_arn_suffix" {
  value = aws_lb.this.arn_suffix
}
output "alb_arn" {
  value = aws_lb.this.arn
}

output "alb_zone_id" {
  value = aws_lb.this.zone_id
}

