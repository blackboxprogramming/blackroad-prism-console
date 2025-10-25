from roadglitch.engine.templating import render_template


def test_render_template_nested():
    template = {"message": "Hello ${input['name']}", "count": "${len(nodes)}"}
    context = {"input": {"name": "RoadGlitch"}, "nodes": {}}
    rendered = render_template(template, context)
    assert rendered["message"] == "Hello RoadGlitch"
    assert rendered["count"] == "0"

