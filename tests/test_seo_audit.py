from marketing import seo_audit


def test_seo_audit_detects_issues():
    issues = seo_audit.audit_site("fixtures/marketing/site")
    assert issues["page2.html"] == "SEO_NO_H1"
    assert issues["page1.html"] == "SEO_DUP_TITLE"
