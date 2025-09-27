TF?=terraform
ENV?=dev

init:
@(cd envs/$(ENV) && $(TF) init)

plan:
@(cd envs/$(ENV) && $(TF) plan -var-file=$(ENV).tfvars)

apply:
@(cd envs/$(ENV) && $(TF) apply -auto-approve -var-file=$(ENV).tfvars)

destroy:
@(cd envs/$(ENV) && $(TF) destroy -auto-approve -var-file=$(ENV).tfvars)

bootstrap-init:
@(cd global/bootstrap && $(TF) init)

bootstrap-apply:
@(cd global/bootstrap && $(TF) apply -auto-approve)

bootstrap-destroy:
@(cd global/bootstrap && $(TF) destroy -auto-approve)
