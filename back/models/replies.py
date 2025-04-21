from back.database.base import Base
from sqlalchemy import Column, Integer, ForeignKey, String, Boolean, func, DateTime
from sqlalchemy.orm import relationship
from back.models.users import User
from back.models.posts import Post


class Reply(Base):
    __tablename__ = 'replies'
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    author_id = Column(Integer, ForeignKey('users.id'))
    post_id = Column(Integer, ForeignKey('posts.id'))
    created_at = Column(DateTime, server_default=func.now())

    author = relationship("User", backref="replies")
    post = relationship("Post", back_populates="replies")
