from pydantic import BaseModel
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: str


class CreateUser(UserBase):
    password: str


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    id: int
    role: str
    is_banned: bool
    registered: datetime

    class Config:
        from_attributes = True
