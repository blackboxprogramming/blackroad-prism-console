from services import catalog, deps


def test_load_and_validate():
    services = catalog.load_services("configs/services/*.yaml")
    assert any(s.id == "CoreAPI" for s in services)
    assert deps.validate_dependencies(services) == []


def test_blast_radius():
    services = catalog.load_services("configs/services/*.yaml")
    br = deps.blast_radius("Database", services)
    assert set(br) == {"AuthService", "CoreAPI"}
