PYTHON := python3
ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
OUTPUTS := $(ROOT)/outputs
REPORTS := $(ROOT)/reports
VARIANTS := $(ROOT)/10_genesis/variants.yaml

.PHONY: all run compare report check clean

all: run compare report

run:
$(PYTHON) $(ROOT)/10_genesis/run_variants.py --variants-file $(VARIANTS) --output-dir $(OUTPUTS)

compare: run
$(PYTHON) $(ROOT)/40_compare/batch_compare.py --outputs-dir $(OUTPUTS) --variants-file $(VARIANTS)

report: compare
$(PYTHON) $(ROOT)/90_reports/make_report.py --outputs-dir $(OUTPUTS) --variants-file $(VARIANTS)

check:
$(PYTHON) $(ROOT)/tools/check_pipeline.py --variants-file $(VARIANTS) --outputs-dir $(OUTPUTS)

clean:
rm -rf $(OUTPUTS) $(REPORTS)
