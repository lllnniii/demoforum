from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
from back.models.replies import Reply as ReplyDB
from back.models.posts import Post
from back.schemas.replies import CreateReply, Reply
from back.schemas.users import User
from back.database.base import SessionDep
from back.utils.auth import (get_current_active_user)

router = APIRouter(prefix="/replies", tags=["replies"])


@router.get('/replies_of_post/{post_id}')
def get_replies(post_id: int, db: SessionDep):
    reply = db.query(ReplyDB).filter(ReplyDB.post_id == post_id).all()
    return reply


@router.get('/user/my')
def get_my_replies(db: SessionDep, current_user: Annotated[User, Depends(get_current_active_user)]):
    reply = db.query(ReplyDB).filter(ReplyDB.author_id == current_user.id).all()
    return reply


@router.post("/new", response_model=Reply)
def create_reply(reply: CreateReply, db: SessionDep,
                 current_user: Annotated[User, Depends(get_current_active_user)]) -> Reply:
    post = db.query(Post).filter(Post.id == reply.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db_reply = ReplyDB(content=reply.content, author_id=current_user.id, post_id =reply.post_id)
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    return db_reply


@router.delete('/delete/{reply_id}')
def delete_reply(reply_id: int, db: SessionDep,current_user: Annotated[User, Depends(get_current_active_user)]):
    reply = db.query(ReplyDB).filter(ReplyDB.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply doesnt found")
    if current_user.id == reply.author_id:
        db.delete(reply)
    db.commit()
    return reply