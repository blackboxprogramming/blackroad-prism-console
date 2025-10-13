from hypothesis import given, strategies as st, settings
import settings as app_settings
from workflow import engine


@given(st.lists(st.dictionaries(keys=st.sampled_from(["action", "condition"]),
                                values=st.text()), min_size=1))
@settings(max_examples=app_settings.RANDOM_SEED % 50 + 10)
def test_engine_fuzz(steps):
    wf = {"steps": steps}
    try:
        engine.run(wf)
    except engine.WorkflowError as e:
        assert "\n" not in str(e)
    else:
        # engine accepts workflows that have at least one valid key
        pass
