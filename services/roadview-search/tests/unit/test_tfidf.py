import pytest

from roadview.ranking.tfidf import build_idf, cosine_similarity, query_vector, tfidf


def test_tfidf_vectors():
    docs = [["science", "research"], ["science", "policy"], ["health", "policy"]]
    idf = build_idf(docs)
    doc_vec = tfidf(docs[0], idf)
    assert doc_vec["science"] > 0
    assert doc_vec["research"] > 0


def test_cosine_similarity_normalized():
    idf = {"science": 1.0, "research": 1.5}
    query_vec = {"science": 0.5, "research": 0.5}
    doc_vec = {"science": 0.5, "research": 0.5}
    similarity = cosine_similarity(query_vec, doc_vec)
    assert similarity == pytest.approx(1.0)


def test_query_vector_uses_tokenizer():
    idf = {"science": 1.0}
    vec = query_vector("Science breakthroughs", idf)
    assert "science" in vec
