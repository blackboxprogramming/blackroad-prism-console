resource "aws_db_subnet_group" "this" {
  name       = "${var.name}-db-subnets"
  subnet_ids = var.subnet_ids
  tags       = var.tags
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db-sg"
  description = "DB access"
  vpc_id      = var.vpc_id
  tags        = var.tags
}

# Allow from app SGs (preferred)
resource "aws_security_group_rule" "from_app" {
  for_each                 = toset(var.app_sg_ids)
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.db.id
  source_security_group_id = each.value
}

# Optional: allow from CIDR (fallback for tooling/bastion)
resource "aws_security_group_rule" "from_cidr" {
  count             = length(var.db_allowed_cidr_blocks)
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  security_group_id = aws_security_group.db.id
  cidr_blocks       = [element(var.db_allowed_cidr_blocks, count.index)]
}

resource "aws_security_group_rule" "egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  security_group_id = aws_security_group.db.id
  cidr_blocks       = ["0.0.0.0/0"]
}

resource "aws_db_instance" "this" {
  identifier                           = "${var.name}-pg"
  engine                               = "postgres"
  engine_version                       = var.engine_version
  instance_class                       = var.instance_class
  allocated_storage                    = var.allocated_storage
  storage_encrypted                    = true
  db_subnet_group_name                 = aws_db_subnet_group.this.name
  vpc_security_group_ids               = [aws_security_group.db.id]
  publicly_accessible                  = false
  multi_az                             = var.multi_az
  skip_final_snapshot                  = var.skip_final_snapshot
  manage_master_user_password          = true
  username                             = var.master_username
  deletion_protection                  = var.deletion_protection
  backup_retention_period              = var.backup_retention_days
  apply_immediately                    = true
  auto_minor_version_upgrade           = true
  performance_insights_enabled         = false
  tags                                 = var.tags
}
