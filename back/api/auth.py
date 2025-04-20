from fastapi import APIRouter, HTTPException, Depends
from back.schemas.users import CreateUser, UserInDB
from back.models.users import User as UserDB
from back.utils.auth import (password_hash, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES,
                             get_current_active_user)
from back.database.base import SessionDep
from back.schemas.token import Token
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from datetime import timedelta


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post('/register')
async def register(user_data: CreateUser, db: SessionDep):
    if (db.query(UserDB).filter(UserDB.email == user_data.email).first() or
            db.query(UserDB).filter(UserDB.username == user_data.username).first()):
        raise HTTPException(status_code=400, detail="already registered")

    hashed_password = password_hash(user_data.password)
    db_user = UserDB(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    return {'message': 'User created'}


@router.post("/login")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: SessionDep) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password",
                            headers={"WWW-Authenticate": "Bearer"})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: Annotated[UserInDB, Depends(get_current_active_user)]):
    return current_user
