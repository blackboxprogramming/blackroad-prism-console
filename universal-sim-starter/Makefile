.PHONY: genesis solid fluid diag variants variants-batch report-all clean

PYTHON ?= python3
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
ARTIFACTS := $(ROOT)/artifacts

$(ARTIFACTS):
	mkdir -p $(ARTIFACTS)

artifacts/genesis: | $(ARTIFACTS)
	mkdir -p $(ARTIFACTS)/genesis

artifacts/solid: | $(ARTIFACTS)
	mkdir -p $(ARTIFACTS)/solid

artifacts/fluid: | $(ARTIFACTS)
	mkdir -p $(ARTIFACTS)/fluid

genesis: artifacts/genesis
	$(PYTHON) 10_genesis/run_genesis.py --output $(ARTIFACTS)/genesis

solid: artifacts/solid
	$(PYTHON) 20_bench_solid/run_mpm.py --output $(ARTIFACTS)/solid

fluid: artifacts/fluid
	$(PYTHON) 30_bench_fluid/run_sph.py --output $(ARTIFACTS)/fluid

diag: genesis solid fluid
	@echo "Diagnostics ready. Wire in analysis via 40_compare/metrics.py"

variants:
	$(PYTHON) 10_genesis/build_variants.py --artifacts $(ARTIFACTS)

variants-batch: variants
	$(PYTHON) 40_compare/variants_batch.py --artifacts $(ARTIFACTS)

report-all:
	$(PYTHON) 40_compare/report_all.py --outputs-dir 40_compare/outputs --output 90_reports/variants_report.md

clean:
	rm -rf $(ARTIFACTS)
