from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_
from back.schemas.categories import Category as CategorySchema, CreateCategory
from back.database.base import SessionDep
from back.models.categories import Category

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post('/new', response_model=CategorySchema)
async def create_category(category: CreateCategory, db: SessionDep) -> CategorySchema:
    db_category = Category(
        name=category.name,
        description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("/", response_model=list[CategorySchema])
def read_category(db: SessionDep):
    category = db.query(Category).all()
    return category


@router.get("/{id_category}/")
def read_category(category_id, db: SessionDep):
    category = db.query(Category).filter(Category.id == category_id).first()
    return category


@router.delete('/delete/{category_id}')
def delete_category(category_id: int, db: SessionDep):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return category


@router.put('/update/{category_id}')
def update_category(category_id: int, category: CreateCategory, db: SessionDep):
    category_to_up = db.query(Category).filter(Category.id == category_id).first()

    if not category_to_up:
        raise HTTPException(status_code=404, detail="Category not found")

    category_to_up.name = category.name
    category_to_up.description = category.description
    db.commit()
    db.refresh(category_to_up)
    return category_to_up
