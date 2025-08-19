from agents.math_agent import can_handle as math_can, handle as math_handle

def route(user_message: str):
    if math_can(user_message):
        return math_handle(user_message)
    return {"channel":"text","markdown":"I didn’t detect math intent — want me to compute something? Try `compute: <expr>`."}
