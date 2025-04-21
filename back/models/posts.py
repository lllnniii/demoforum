from database.base import Base
from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, func, DateTime
from sqlalchemy.orm import relationship
from models.users import User
from models.replies import Reply


class Post(Base):
    __tablename__ = 'posts'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), index=True)
    content = Column(String)
    author_id = Column(Integer, ForeignKey('users.id'))
    category_id = Column(Integer, ForeignKey('categories.id'))
    is_pinned = Column(Boolean, default=False)
    is_closed = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", backref="posts")
    replies = relationship("Reply", back_populates="post")
    
