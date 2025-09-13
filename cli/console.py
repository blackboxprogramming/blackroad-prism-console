# Deterministic CLI dispatcher supporting "ns:cmd" verbs.
import argparse, sys, importlib

# Map namespace prefixes to modules
NS_MAP = {
    'plm:items': 'plm.bom',
    'plm:bom': 'plm.bom',
    'plm:eco': 'plm.eco',
    'mfg:wc': 'mfg.routing',
    'mfg:routing': 'mfg.routing',
    'mfg:wi': 'mfg.work_instructions',
    'mfg:spc': 'mfg.spc',
    'mfg:yield': 'mfg.yield',
    'mfg:coq': 'mfg.coq',
    'mfg:mrp': 'mfg.mrp',
}

# Verb -> function name mapping (implemented in target modules)
VERB_FUN = {
    'plm:items:load': 'cli_items_load',
    'plm:bom:load': 'cli_bom_load',
    'plm:bom:explode': 'cli_bom_explode',
    'plm:eco:new': 'cli_eco_new',
    'plm:eco:impact': 'cli_eco_impact',
    'plm:eco:approve': 'cli_eco_approve',
    'plm:eco:release': 'cli_eco_release',
    'mfg:wc:load': 'cli_wc_load',
    'mfg:routing:load': 'cli_routing_load',
    'mfg:routing:capcheck': 'cli_routing_capcheck',
    'mfg:wi:render': 'cli_wi_render',
    'mfg:spc:analyze': 'cli_spc_analyze',
    'mfg:yield': 'cli_yield',
    'mfg:coq': 'cli_coq',
    'mfg:mrp': 'cli_mrp',
}


def main(argv=None):
    argv = argv or sys.argv[1:]
    if not argv:
        print("Usage: python -m cli.console <verb> [--flags]\n")
        for k in sorted(VERB_FUN):
            print("  ", k)
        sys.exit(1)
    verb, *rest = argv
    ns = verb.rsplit(':', 1)[0]
    mod_name = NS_MAP.get(ns)
    fun_name = VERB_FUN.get(verb)
    if not (mod_name and fun_name):
        raise SystemExit(f"Unknown verb: {verb}")
    mod = importlib.import_module(mod_name)
    fun = getattr(mod, fun_name)
    fun(rest)

if __name__ == '__main__':
    main()
