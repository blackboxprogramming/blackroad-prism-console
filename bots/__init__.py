from .comms import CommsBot
from .finance import FinanceBot
from .grc import GRCBot
from .gtm import GTMBot
from .industry import IndustryBot
from .it import ITBot
from .ops import OpsBot
from .people import PeopleBot
from .product_eng_data import ProductEngDataBot
from .regional import RegionalBot

BOT_REGISTRY = {
    "finance": FinanceBot,
    "grc": GRCBot,
    "people": PeopleBot,
    "gtm": GTMBot,
    "product_eng_data": ProductEngDataBot,
    "ops": OpsBot,
    "it": ITBot,
    "comms": CommsBot,
    "regional": RegionalBot,
    "industry": IndustryBot,
}

__all__ = ["BOT_REGISTRY", "FinanceBot", "GRCBot", "PeopleBot", "GTMBot", "ProductEngDataBot", "OpsBot", "ITBot", "CommsBot", "RegionalBot", "IndustryBot"]
