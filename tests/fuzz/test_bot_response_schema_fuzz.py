from hypothesis import given, strategies as st, settings, HealthCheck
import settings as app_settings


def validate(resp: dict) -> bool:
    if not isinstance(resp.get("text"), str) or resp.get("text") == "":
        raise ValueError("text")
    if resp.get("status") not in {"ok", "error"}:
        raise ValueError("status")
    return True


@given(
    st.fixed_dictionaries({
        "text": st.one_of(st.text(max_size=5), st.integers(min_value=0, max_value=10)),
        "status": st.one_of(st.sampled_from(["ok", "error", "bad"]), st.integers(min_value=0, max_value=2)),
    })
)
@settings(max_examples=app_settings.RANDOM_SEED % 50 + 10, suppress_health_check=[HealthCheck.too_slow])
def test_validator(resp):
    valid = {"text": "hi", "status": "ok"}
    try:
        validate(valid)
    except Exception:
        assert False, "valid response rejected"

    if resp.get("text") and resp.get("status") in {"ok", "error"} and isinstance(resp["text"], str):
        assert validate(resp)
    else:
        try:
            validate(resp)
        except ValueError:
            pass
        else:
            assert False, "invalid response accepted"
