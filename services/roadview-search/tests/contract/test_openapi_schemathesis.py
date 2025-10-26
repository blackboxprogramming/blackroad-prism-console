import schemathesis

from roadview.main import app

schema = schemathesis.from_asgi("/openapi.json", app=app)


@schema.parametrize()
def test_api_contract(case):
    case.call_and_validate()
