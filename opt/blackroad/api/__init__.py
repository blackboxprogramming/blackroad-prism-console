from fastapi import APIRouter
from .astro_meteoroid import router as astro_meteoroid_router
from .exceptions import router as exceptions_router

api_router = APIRouter()
api_router.include_router(astro_meteoroid_router)
api_router.include_router(exceptions_router)
