# Minimal app hook-up (if you don't already have one)
from fastapi import FastAPI
from api import api_router

app = FastAPI(title="BlackRoad API", docs_url="/_docs")
app.include_router(api_router)
