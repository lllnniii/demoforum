from back.database.base import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), index=True, nullable=False)
    email = Column(String(50), unique=True)
    password = Column(String, nullable=False)
    role = Column(String(20), default='user') #user, moderator
    is_banned = Column(Boolean, default=False)
    registered = Column(DateTime, server_default=func.now())
