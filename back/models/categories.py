from back.database.base import Base
from sqlalchemy import Column, Integer, String


class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    description = Column(String(300))
