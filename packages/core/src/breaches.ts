export const BREACH_TEXT: Record<string, string> = {
  "ads.missing_testimonial_disclosure":
    "Testimonials require prominent disclosure of compensation and conflicts.",
  "ads.performance_missing_period":
    "Performance claims must specify the time period referenced.",
  "ads.performance_missing_disclosure":
    "Performance materials must include net and gross disclosures and relevant caveats.",
  "ads.cta_blocked":
    "Purchase-oriented calls to action are prohibited in Rule 482-style materials.",
  "ads.prospectus_missing": "Prospectus-based materials must direct readers to request a prospectus.",
  "ads.third_party_rating_disclosure":
    "Third-party ratings require methodology and compensation disclosure.",
  "ads.hypothetical_flag": "Hypothetical performance must be clearly labeled and scoped to intended recipients.",
  "onboarding.u4.change_threshold": "Material data changes require a timely Form U4 amendment.",
  "onboarding.u4.sd_risk": "Statutory disqualification indicators require accelerated principal review.",
  "calendar.snooze_reason_required": "Calendar overrides require documented justification.",
  "gate.ce_incomplete": "Continuing education requirements must be satisfied before providing advice.",
  "worm.integrity_gap": "Detected a gap or tampering in the WORM chain.",
};

export const describeBreach = (code: string): string => {
  return BREACH_TEXT[code] ?? code;
};
