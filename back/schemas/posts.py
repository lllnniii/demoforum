from pydantic import BaseModel
from datetime import datetime
from .users import User


class PostBase(BaseModel):
    title: str
    content: str
    category_id: int


class CreatePost(PostBase):
    pass


class Post(PostBase):
    id: int
    author: User
    created_at: datetime

    class Config:
        from_attributes = True
