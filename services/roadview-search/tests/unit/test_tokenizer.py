from roadview.services.tokenizer import Tokenizer


def test_tokenizer_removes_stopwords_and_lowercases():
    tokenizer = Tokenizer()
    tokens = tokenizer.tokenize("The Quick Brown Fox and the Lazy Dog")
    assert "the" not in tokens
    assert tokens[0] == "quick"


def test_tokenizer_handles_unicode_words():
    tokenizer = Tokenizer()
    tokens = tokenizer.tokenize("Curaçao cafés serve crème brûlée")
    assert "curaçao" in tokens
    assert "cafés" in tokens
