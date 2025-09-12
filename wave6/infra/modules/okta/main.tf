resource "okta_group" "eng" {
  name = "ENG-${var.env}"
}

resource "okta_group" "revops" {
  name = "REVOPS-${var.env}"
}
