import argparse
import json
import time
from lucidia_core import UnifiedPortalSystem
from .runtime import SagaRuntime
from .provisioning import mk_provisioning_saga


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("account", help="Account name to provision")
    args = parser.parse_args()

    system = UnifiedPortalSystem(memory_snapshot_path="./lucidia_mem.json")
    runtime = SagaRuntime("./sagas.json")
    runtime.register(mk_provisioning_saga(system))
    sid = runtime.start("ProvisioningSaga", {"account_name": args.account})
    state = runtime.state[sid]
    while state["status"] not in ("COMPLETED", "FAILED"):
        time.sleep(0.1)
        state = runtime.tick(sid)
    print(json.dumps(state, indent=2))


if __name__ == "__main__":
    main()
