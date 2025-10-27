"""Bot registry and utilities."""
import importlib
import pkgutil
from typing import Dict, Type

from orchestrator.base import BaseBot


def available_bots() -> Dict[str, Type[BaseBot]]:
    """Discover available bots in this package."""
    bots: Dict[str, Type[BaseBot]] = {}
    package_path = __path__  # type: ignore[name-defined]
    for module in pkgutil.iter_modules(package_path):
        mod = importlib.import_module(f"{__name__}.{module.name}")
        for attr in dir(mod):
            obj = getattr(mod, attr)
            if isinstance(obj, type) and issubclass(obj, BaseBot) and obj is not BaseBot:
                bots[obj.name] = obj
    return bots
from .alm_bot import ALMBot
from .aml_kyc_bot import AMLKYCBot
from .asset_ops_bot import AssetOpsBot
from .base import BaseBot  # noqa: F401
from .bi_bot import BIBot
from .change_release_bot import ChangeReleaseBot
from .comms import CommsBot
from .finance import FinanceBot
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
from .gtm import GTMBot
from .grc import GRCBot as AdvisoryGRCBot
from .grc_bot import GRCBot
from .grid_reliability_bot import GridReliabilityBot
from .gxp_bot import GxPBot
from .iam_bot import IAMBot
from .internal_audit_bot import InternalAuditBot
from .investor_relations_bot import InvestorRelationsBot
from .industry import IndustryBot
from .it import ITBot
from .it_helpdesk_bot import ITHelpdeskBot
from .knowledge_mgmt_bot import KnowledgeMgmtBot
from .l_d_bot import LDBot
from .maintenance_ops_bot import MaintenanceOpsBot
from .merchandising_bot import MerchandisingBot
from .ml_platform_bot import MLPlatformBot
from .ops import OpsBot
from .model_risk_bot import ModelRiskBot
from .partner_channel_bot import PartnerChannelBot
from .pmo_epmo_bot import PMOEPMOBot
from .pricing_bot import PricingBot
from .product_eng_data import ProductEngDataBot
from .privacy_bot import PrivacyBot
from .procurement_bot import ProcurementBot
from .public_policy_bot import PublicPolicyBot
from .pv_bot import PVBot
from .qa_bot import QABot
from .regional import RegionalBot
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
from .people import PeopleBot
from .total_rewards_bot import TotalRewardsBot
from .treasury_bot import TreasuryBot
from .lucidia_bot import LucidiaBot
from .cadillac_bot import CadillacBot
from .alice_bot import AliceBot
from .cecilia_bot import (
    CeciliaBot,
    CECILIA_AGENT_ID,
    CECILIA_ALIASES,
    CECILIA_LEGACY_NAME,
)
from .silas_bot import SilasBot
from .athena_bot import AthenaBot
from .anastasia_bot import AnastasiaBot
from .elias_bot import EliasBot
from .workforce_planning_bot import WorkforcePlanningBot
from .helix_bot import HelixBot
from .orion_bot import OrionBot
from .vera_bot import VeraBot
from .eon_bot import EonBot
from .myra_bot import MyraBot

cecilia_bot = CeciliaBot()

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
    "Lucidia-BOT": LucidiaBot(),
    "Cadillac-BOT": CadillacBot(),
    "Alice-BOT": AliceBot(),
    CECILIA_AGENT_ID: cecilia_bot,
    CECILIA_LEGACY_NAME: cecilia_bot,
    "Silas-BOT": SilasBot(),
    "Athena-BOT": AthenaBot(),
    "Anastasia-BOT": AnastasiaBot(),
    "Elias-BOT": EliasBot(),
    "Helix-BOT": HelixBot(),
    "Orion-BOT": OrionBot(),
    "Vera-BOT": VeraBot(),
    "Eon-BOT": EonBot(),
    "Myra-BOT": MyraBot(),

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
    "Finance-BOT": FinanceBot(),
    "People-BOT": PeopleBot(),
    "GTM-BOT": GTMBot(),
    "Product-Eng-Data-BOT": ProductEngDataBot(),
    "Ops-BOT": OpsBot(),
    "IT-BOT": ITBot(),
    "Comms-BOT": CommsBot(),
    "Regional-BOT": RegionalBot(),
    "Industry-BOT": IndustryBot(),
    "GRC-Advisory-BOT": AdvisoryGRCBot(),
}

for alias in CECILIA_ALIASES:
    BOT_REGISTRY.setdefault(alias, cecilia_bot)
