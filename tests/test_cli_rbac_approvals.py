from cli import console


def call(args):
    try:
        return console.main(args)
    except SystemExit as e:
        return e.code


def test_cli_flow(capsys):
    call(["bot:list", "--as-user", "U_SYS"])
    out = capsys.readouterr().out
    assert "Treasury-BOT" in out

    call(["task:create", "--goal", "Draft hedging plan", "--context", "samples/hedge.json", "--as-user", "U_PM"])
    task_id = capsys.readouterr().out.strip()

    call(["task:route", "--id", task_id, "--bot", "Treasury-BOT", "--as-user", "U_PM"])
    out = capsys.readouterr().out
    assert "approval_required" in out

    call(["approval:create", "--task", task_id, "--for-role", "CFO", "--as-user", "U_PM"])
    approval_id = capsys.readouterr().out.strip()

    call(["approval:list", "--as-user", "U_CFO"])
    out = capsys.readouterr().out
    assert approval_id in out

    call(["approval:decide", "--id", approval_id, "--decision", "approved", "--reason", "OK", "--as-user", "U_CFO"])
    capsys.readouterr()

    call(["task:route", "--id", task_id, "--bot", "Treasury-BOT", "--as-user", "U_PM"])
    out = capsys.readouterr().out
    assert "routed" in out

    call(["audit:verify", "--as-user", "U_SYS"])
    out = capsys.readouterr().out
    assert "all signatures valid" in out
