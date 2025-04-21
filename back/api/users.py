from fastapi import APIRouter, HTTPException, Depends
from models.users import User as UserDB
from schemas.users import User, CreateUser
from database.base import SessionDep
from utils.auth import get_current_active_user, password_hash


router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=User)
async def get_user_profile(user_id: int, db: SessionDep):
    user = db.query(UserDB).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/", response_model=list[User])
async def get_users(db: SessionDep):
    users = db.query(UserDB).all()
    return users


@router.put('/update/{user_id}')
def update_user(user_id: int, user: CreateUser, db: SessionDep,
                current_user: User = Depends(get_current_active_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Нельзя обновлять чужой профиль")
    user_upd = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user_upd:
        raise HTTPException(status_code=404, detail="User not found")

    user_upd.name = user.username
    user_upd.email = user.email
    if user.password:
        user_upd.password = password_hash(user.password)
    db.commit()
    db.refresh(user_upd)
    return user_upd


@router.delete('/delete/{user_id}')
def delete_user(user_id: int, db: SessionDep):
    user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return user



