PYTHON ?= python
VENV ?= ~/agent-venv

ASSET ?= logo.png
AUDIO ?= clip.wav

.PHONY: push-assets push-audio first-light install-mac-agent install-pi-services bootstrap-pi lint clean

push-assets:
        $(PYTHON) mac_agent.py push-assets --name $(ASSET)

push-audio:
        $(PYTHON) mac_agent.py push-audio --name $(AUDIO)

first-light:
        $(PYTHON) first_light.py

install-mac-agent:
	./scripts/install_mac_agent.sh

install-pi-services:
        ./scripts/install_pi_services.sh

bootstrap-pi:
        ./scripts/bootstrap_pi.sh

lint:
	$(PYTHON) -m ruff check .

clean:
	rm -f ~/.pi-cortex-agent/logs/last_asset.png
