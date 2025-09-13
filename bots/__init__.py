from .alm_bot import ALMBot
from .aml_kyc_bot import AMLKYCBot
from .asset_ops_bot import AssetOpsBot
from .base import BaseBot  # noqa: F401
from .bi_bot import BIBot
from .change_release_bot import ChangeReleaseBot
from .clinical_ops_bot import ClinicalOpsBot
from .compliance_bot import ComplianceBot
from .corpdev_ma_bot import CorpDevMABot
from .corporate_comms_bot import CorporateCommsBot
from .cx_insights_bot import CXInsightsBot
from .data_eng_bot import DataEngBot
from .data_governance_bot import DataGovernanceBot
from .dei_bot import DEIBot
from .design_ux_bot import DesignUXBot
from .dr_bcp_bot import DRBCPBot
from .ehs_bot import EHSBot
from .esg_sustainability_bot import ESGSustainabilityBot
from .ethics_hotline_bot import EthicsHotlineBot
from .finops_cost_opt_bot import FinOpsCostOptBot
from .grants_bot import GrantsBot
from .grc_bot import GRCBot
from .grid_reliability_bot import GridReliabilityBot
from .gxp_bot import GxPBot
from .iam_bot import IAMBot
from .internal_audit_bot import InternalAuditBot
from .investor_relations_bot import InvestorRelationsBot
from .it_helpdesk_bot import ITHelpdeskBot
from .knowledge_mgmt_bot import KnowledgeMgmtBot
from .l_d_bot import LDBot
from .maintenance_ops_bot import MaintenanceOpsBot
from .merchandising_bot import MerchandisingBot
from .ml_platform_bot import MLPlatformBot
from .model_risk_bot import ModelRiskBot
from .partner_channel_bot import PartnerChannelBot
from .pmo_epmo_bot import PMOEPMOBot
from .pricing_bot import PricingBot
from .privacy_bot import PrivacyBot
from .procurement_bot import ProcurementBot
from .public_policy_bot import PublicPolicyBot
from .pv_bot import PVBot
from .qa_bot import QABot
from .quality_mgmt_bot import QualityMgmtBot
from .real_estate_workplace_bot import RealEstateWorkplaceBot
from .regional_ops_bot_amer import RegionalOpsBotAMER
from .regional_ops_bot_apac import RegionalOpsBotAPAC
from .regional_ops_bot_emea import RegionalOpsBotEMEA
from .revops_bot import RevOpsBot
from .s_and_op_bot import SAndOPBot
from .safety_mgmt_bot import SafetyMgmtBot
from .security_architecture_bot import SecurityArchitectureBot
from .sre_bot import SREBot
from .store_ops_bot import StoreOpsBot
from .tax_bot import TaxBot
from .total_rewards_bot import TotalRewardsBot
from .treasury_bot import TreasuryBot
from .workforce_planning_bot import WorkforcePlanningBot

BOT_REGISTRY = {
    "Treasury-BOT": TreasuryBot(),
    "Tax-BOT": TaxBot(),
    "Procurement-BOT": ProcurementBot(),
    "CorpDev/M&A-BOT": CorpDevMABot(),
    "Investor-Relations-BOT": InvestorRelationsBot(),
    "Internal-Audit-BOT": InternalAuditBot(),
    "GRC-BOT": GRCBot(),
    "Privacy-BOT": PrivacyBot(),
    "ESG/Sustainability-BOT": ESGSustainabilityBot(),
    "Ethics & Hotline-BOT": EthicsHotlineBot(),
    "Total-Rewards-BOT": TotalRewardsBot(),
    "Workforce-Planning-BOT": WorkforcePlanningBot(),
    "L&D-BOT": LDBot(),
    "DEI-BOT": DEIBot(),
    "RevOps-BOT": RevOpsBot(),
    "Pricing-BOT": PricingBot(),
    "Partner/Channel-BOT": PartnerChannelBot(),
    "CX-Insights-BOT": CXInsightsBot(),
    "PMO/EPMO-BOT": PMOEPMOBot(),
    "Design/UX-BOT": DesignUXBot(),
    "QA-BOT": QABot(),
    "SRE-BOT": SREBot(),
    "FinOps/Cost-Opt-BOT": FinOpsCostOptBot(),
    "Security-Architecture-BOT": SecurityArchitectureBot(),
    "IAM-BOT": IAMBot(),
    "Data-Eng-BOT": DataEngBot(),
    "Data-Governance-BOT": DataGovernanceBot(),
    "BI-BOT": BIBot(),
    "ML-Platform-BOT": MLPlatformBot(),
    "S&OP-BOT": SAndOPBot(),
    "Quality-Mgmt-BOT": QualityMgmtBot(),
    "EHS-BOT": EHSBot(),
    "Real-Estate/Workplace-BOT": RealEstateWorkplaceBot(),
    "IT-Helpdesk-BOT": ITHelpdeskBot(),
    "Change/Release-BOT": ChangeReleaseBot(),
    "DR/BCP-BOT": DRBCPBot(),
    "Public-Policy-BOT": PublicPolicyBot(),
    "Corporate-Comms-BOT": CorporateCommsBot(),
    "Knowledge-Mgmt-BOT": KnowledgeMgmtBot(),
    "Regional-Ops-BOT-AMER": RegionalOpsBotAMER(),
    "Regional-Ops-BOT-EMEA": RegionalOpsBotEMEA(),
    "Regional-Ops-BOT-APAC": RegionalOpsBotAPAC(),
    "Clinical-Ops-BOT": ClinicalOpsBot(),
    "PV-BOT": PVBot(),
    "GxP-BOT": GxPBot(),
    "Model-Risk-BOT": ModelRiskBot(),
    "AML/KYC-BOT": AMLKYCBot(),
    "ALM-BOT": ALMBot(),
    "Safety-Mgmt-BOT": SafetyMgmtBot(),
    "Maintenance-Ops-BOT": MaintenanceOpsBot(),
    "Asset-Ops-BOT": AssetOpsBot(),
    "Grid-Reliability-BOT": GridReliabilityBot(),
    "Merchandising-BOT": MerchandisingBot(),
    "Store-Ops-BOT": StoreOpsBot(),
    "Grants-BOT": GrantsBot(),
    "Compliance-BOT": ComplianceBot(),
}
