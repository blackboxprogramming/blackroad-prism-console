.PHONY: install figures ops

install:
	python -m pip install -r requirements.txt

figures: install
	python analysis/tap_null_isi.py
	python analysis/selectors_autocorr.py
	python analysis/variance_surfaces.py
	python analysis/nphase_weierstrass.py

ops:
	curl -fsS http://localhost/health && echo OK || (echo FAIL && exit 1)
	curl -fsS http://localhost/api/health && echo OK || true
	curl -fsS http://localhost/api/ops || true
