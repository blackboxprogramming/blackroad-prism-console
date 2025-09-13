from integrations import (
    mappers,
    salesforce_stub,
    sap_stub,
    servicenow_stub,
    workday_stub,
)


def test_salesforce_loader_mapper():
    records = salesforce_stub.load_opportunities("fixtures/salesforce")
    rows = mappers.to_rows(records, ["id", "owner"])
    assert rows[0]["id"] == "OPP1"


def test_sap_loader_mapper():
    records = sap_stub.load_gl("fixtures/sap")
    rows = mappers.to_rows(records, ["account", "debit"])
    assert rows[0]["account"] == "4000"


def test_servicenow_loader_mapper():
    records = servicenow_stub.load_incidents("fixtures/servicenow")
    rows = mappers.to_rows(records, ["id", "sev"])
    assert rows[0]["id"] == "INC1"


def test_workday_loader_mapper():
    records = workday_stub.load_headcount("fixtures/workday")
    rows = mappers.to_rows(records, ["employee_id", "dept"])
    assert rows[0]["employee_id"] == "E1"
