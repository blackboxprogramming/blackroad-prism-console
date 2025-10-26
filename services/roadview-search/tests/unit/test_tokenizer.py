from roadview.services.tokenizer import tokenize


def test_tokenize_removes_stopwords_and_lowercases():
    text = "The Quick Brown Fox jumps over the Lazy Dog"
    tokens = tokenize(text)
    assert tokens == ["quick", "brown", "fox", "jumps", "over", "lazy", "dog"]


def test_tokenize_handles_unicode():
    text = "Café naïve façade résumé"
    tokens = tokenize(text)
    assert "café" in tokens and "naïve" in tokens
