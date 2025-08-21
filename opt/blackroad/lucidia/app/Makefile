# /opt/blackroad/lucidia/app/Makefile
vendor:
	npm set registry http://mirrors-verdaccio:4873 || true
	pip config set global.index-url http://mirrors-devpi:3141/root/pypi/

.PHONY: test
	test:
		pytest -q
