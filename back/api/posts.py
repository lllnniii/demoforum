from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Annotated
from sqlalchemy import or_, func
from models.posts import Post
from schemas.posts import CreatePost, Post as PostSchema
from schemas.users import User
from database.base import SessionDep
from utils.auth import (get_current_active_user)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=list[PostSchema])
def read_posts(db: SessionDep):
    post = db.query(Post).all()
    return post


@router.post("/new", response_model=PostSchema)
def create_post(post: CreatePost, db: SessionDep,
                current_user: Annotated[User, Depends(get_current_active_user)]) -> PostSchema:
    db_post = Post(title=post.title, content=post.content,
                   author_id=current_user.id, category_id=post.category_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


@router.get('/user/my')
def get_my_posts(db: SessionDep, current_user: Annotated[User, Depends(get_current_active_user)]):
    post = db.query(Post).filter(Post.author_id == current_user.id).all()
    return post


@router.get('/{post_id}')
def get_post(post_id: int, db: SessionDep):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail='Post doesnt found')
    return post


@router.delete('/delete/{post_id}')
def delete_post(post_id: int, db: SessionDep,
                current_user: Annotated[User, Depends(get_current_active_user)]):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if current_user.id == post.author_id:
        db.delete(post)
    db.commit()
    return post


@router.get('/search/')
def search_post(db: SessionDep,
                search_query: str = Query(..., min_length=2, max_length=100, description="Поисковая строка")):
    search_pattern = f"%{search_query.lower()}%"
    query = db.query(Post).filter(
        or_(func.lower(Post.title).ilike(search_pattern),
            func.lower(Post.content).ilike(search_pattern)))
    return query.all()


@router.get('/posts_by_category/{category_id}')
def get_post(category_id: int, db: SessionDep):
    post = db.query(Post).filter(Post.category_id == category_id).all()
    if not post:
        raise HTTPException(status_code=404, detail='Post doesnt found')
    return post
