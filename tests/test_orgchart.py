from pathlib import Path
from people import headcount, orgchart


def test_orgchart(tmp_path: Path):
    demo = Path('fixtures/people/demographics.csv')
    include = headcount._read_csv(Path('fixtures/people/plans.csv'))
    children = orgchart.build_tree(demo, include)
    tree = orgchart.render_tree(children)
    assert 'REQ-R1' in tree
    mod = orgchart.what_if(children, freeze='E1')
    assert 'E1' not in mod
