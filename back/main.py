from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from database.base import Base, engine
import models
from api import auth as auth_r, users as users_r, categories as categories_r, posts as posts_r, replies as replies_r)
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

frontend_path = Path(__file__).parent.parent / "front"
app.mount("/static", StaticFiles(directory=str(frontend_path), html=True), name="static")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

app.include_router(categories_r.router)
app.include_router(auth_r.router)
app.include_router(users_r.router)
app.include_router(posts_r.router)
app.include_router(replies_r.router)


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
