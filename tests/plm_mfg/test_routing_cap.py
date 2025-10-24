from mfg import routing

def test_cap_math():
    routing.WC_DB={'W':{'capacity_per_shift':60,'cost_rate':30,'name':'W','skills':[]}}
    routing.ROUT_DB={'X_A':{'steps':[{'wc':'W','op':'OP','std_time_min':3.0}]}}
    out = routing.capcheck('X','A', qty=10)
    assert 'theoretical_labor_cost' in out
