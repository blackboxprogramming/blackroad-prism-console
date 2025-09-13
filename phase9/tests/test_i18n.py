from i18n.translate import t


def test_translation_and_fallback():
    assert t("greeting", lang="es", name="Ana") == "Hola Ana"
    assert t("greeting", lang="fr", name="Bob") == "Hello Bob"
