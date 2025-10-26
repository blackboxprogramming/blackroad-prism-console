from roadview.ranking.tfidf import compute_idf, compute_tfidf, cosine_similarity


def test_compute_idf_emphasizes_unique_terms():
    docs = [["road", "view"], ["road", "analysis"], ["credibility"]]
    idf = compute_idf(docs)
    assert idf["credibility"] > idf["road"]


def test_cosine_similarity_between_vectors():
    docs = [["road", "view"]]
    idf = compute_idf(docs)
    vec_a = compute_tfidf(["road", "view"], idf)
    vec_b = compute_tfidf(["road"], idf)
    similarity = cosine_similarity(vec_a, vec_b)
    assert 0 < similarity <= 1
