from plm import bom

def test_explode():
    bom._ITEMS = [bom.Item('PROD-100','A','assembly','ea',0,0.0,[]), bom.Item('COMP-001','A','component','ea',0,0.0,[])]
    bom._BOMS = [bom.BOM('PROD-100','A',[{'component_id':'COMP-001','qty':2}])]
    rows = bom.explode('PROD-100','A', level=2)
    assert any(r['component_id']=='COMP-001' for r in rows)
