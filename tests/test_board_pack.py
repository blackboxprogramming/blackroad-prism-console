from board import pack


def test_board_pack(tmp_path):
    out = pack.build("2025-09")
    for name in ["index.md", "kpi_table.md", "risks.md", "program_roadmap.md", "finance.md"]:
        assert (out / name).exists()
