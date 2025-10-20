from close import packet, journal, recon, flux, sox


def test_packet_and_sign(tmp_path):
    period = "2025-09"
    tb = journal.load_tb(period)
    jnls = journal.propose_journals(tb, "configs/close/journals/accruals.yaml")
    adj = journal.post(period, tb, jnls)
    recon.run_recons(period, adj, "configs/close/recons.yaml", "fixtures/finance/recons")
    flux.run_flux(period, "2025-08", "2024-09", 10.0)
    # add evidence required
    rev_file = tmp_path / "rev.txt"
    rev_file.write_text("rev")
    tb_file = tmp_path / "tb.txt"
    tb_file.write_text("tb")
    sox.add(period, "C-REV-01", str(rev_file), "user")
    sox.add(period, "C-TB-01", str(tb_file), "user")
    packet.build_packet(period)
    sign_path = packet.sign(period, "CFO", "U_CFO")
    assert sign_path.exists()
