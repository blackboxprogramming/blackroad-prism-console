class WorkflowError(Exception):
    pass


def run(workflow: dict):
    steps = workflow.get("steps")
    if not isinstance(steps, list):
        raise WorkflowError("NO_STEPS")
    for step in steps:
        if "action" not in step and "condition" not in step:
            raise WorkflowError("INVALID_STEP")
    return True
