from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    role: str
    is_active: bool

    class Config:
        from_attributes = True
        
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

class UserStatusResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True