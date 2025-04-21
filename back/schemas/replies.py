from pydantic import BaseModel
from datetime import datetime
from .users import User


class ReplyBase(BaseModel):
    content: str
    post_id: int


class CreateReply(ReplyBase):
    pass


class Reply(ReplyBase):
    id: int
    author: User
    created_at: datetime

    class Config:
        from_attributes = True
