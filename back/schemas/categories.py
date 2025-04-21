from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    description: str


class CreateCategory(CategoryBase):
    pass


class Category(CategoryBase):
    id: int

    class Confirm:
        from_attributes = True
