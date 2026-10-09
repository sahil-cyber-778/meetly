import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine
from routers.meetings import router as meetings_router
from seed import seed_database
from routers.search import router as search_router
from sqlalchemy import inspect


@asynccontextmanager
async def lifespan(_: FastAPI):
    first_run = not inspect(engine).has_table('meetings')
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if first_run and os.getenv("SEED_DEMO", "true").lower() == "true":
            seed_database(db)
    yield


app = FastAPI(title="Meetly API", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(meetings_router)
app.include_router(search_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

