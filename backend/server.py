from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from seed import generate_properties

# ---- Config ----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

DEFAULT_SETTINGS = {
    "site_name": "The Casa",
    "accent_color": "#1E5E3F",
    "tagline": "Trouvez votre chez-vous au Gabon",
}

# ---- App ----
app = FastAPI(title="The Casa API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ---- Utils ----
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Jeton invalide")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

# ---- Models ----
class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    property_type: str  # Maison | Appartement
    transaction_type: str  # location | vente
    city: str
    neighborhood: str
    price: float
    currency: str = "XAF"
    bedrooms: int
    bathrooms: int
    area_m2: int
    features: List[str] = []
    images: List[str] = []
    hidden: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PropertyIn(BaseModel):
    title: str
    description: str
    property_type: str
    transaction_type: str
    city: str
    neighborhood: str
    price: float
    currency: str = "XAF"
    bedrooms: int
    bathrooms: int
    area_m2: int
    features: List[str] = []
    images: List[str] = []
    hidden: bool = False

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    transaction_type: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    price: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_m2: Optional[int] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    hidden: Optional[bool] = None

class InterestIn(BaseModel):
    name: str
    contact: str
    phone: str
    email: EmailStr
    message: Optional[str] = ""
    property_id: Optional[str] = None
    property_title: Optional[str] = None

class Interest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contact: str
    phone: str
    email: str
    message: str = ""
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SettingsIn(BaseModel):
    site_name: Optional[str] = None
    accent_color: Optional[str] = None
    tagline: Optional[str] = None

# ---- Startup: seed admin, settings, properties ----
@app.on_event("startup")
async def startup_seed():
    # Admin user
    existing_admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing_admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    # Settings
    settings = await db.settings.find_one({"key": "site"})
    if not settings:
        await db.settings.insert_one({"key": "site", **DEFAULT_SETTINGS})
    # Properties
    count = await db.properties.count_documents({})
    if count == 0:
        props = generate_properties(50)
        await db.properties.insert_many(props)
    logging.info("Startup seed complete")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ---- Public: settings ----
@api_router.get("/settings")
async def get_settings():
    s = await db.settings.find_one({"key": "site"}, {"_id": 0, "key": 0})
    return s or DEFAULT_SETTINGS

# ---- Public: properties ----
@api_router.get("/properties")
async def list_properties(
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    transaction_type: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    q: Optional[str] = None,
    limit: int = Query(200, le=500),
):
    query: dict = {"hidden": False}
    if city:
        query["city"] = city
    if neighborhood:
        query["neighborhood"] = neighborhood
    if transaction_type:
        query["transaction_type"] = transaction_type
    if property_type:
        query["property_type"] = property_type
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"neighborhood": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.properties.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return docs

@api_router.get("/properties/cities")
async def list_cities():
    cities = await db.properties.distinct("city", {"hidden": False})
    result = []
    for c in cities:
        neighborhoods = await db.properties.distinct("neighborhood", {"city": c, "hidden": False})
        result.append({"city": c, "neighborhoods": sorted(neighborhoods)})
    return sorted(result, key=lambda x: x["city"])

@api_router.get("/properties/{prop_id}")
async def get_property(prop_id: str):
    doc = await db.properties.find_one({"id": prop_id, "hidden": False}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Bien introuvable")
    return doc

# ---- Public: submit interest ----
@api_router.post("/interests")
async def submit_interest(payload: InterestIn):
    obj = Interest(**payload.model_dump())
    await db.interests.insert_one(obj.model_dump())
    return {"ok": True, "id": obj.id}

# ---- Auth ----
@api_router.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Email ou mot de passe incorrect")
    token = create_access_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {"id": user["id"], "email": user["email"], "name": user.get("name", ""), "role": user["role"]},
    }

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_admin)):
    return user

# ---- Admin: properties ----
@api_router.get("/admin/properties")
async def admin_list_properties(user: dict = Depends(get_current_admin)):
    docs = await db.properties.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.post("/admin/properties")
async def admin_create_property(payload: PropertyIn, user: dict = Depends(get_current_admin)):
    obj = Property(**payload.model_dump())
    await db.properties.insert_one(obj.model_dump())
    return obj

@api_router.put("/admin/properties/{prop_id}")
async def admin_update_property(prop_id: str, payload: PropertyUpdate, user: dict = Depends(get_current_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "Aucun champ à mettre à jour")
    res = await db.properties.update_one({"id": prop_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(404, "Bien introuvable")
    doc = await db.properties.find_one({"id": prop_id}, {"_id": 0})
    return doc

@api_router.delete("/admin/properties/{prop_id}")
async def admin_delete_property(prop_id: str, user: dict = Depends(get_current_admin)):
    res = await db.properties.delete_one({"id": prop_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Bien introuvable")
    return {"ok": True}

# ---- Admin: interests ----
@api_router.get("/admin/interests")
async def admin_list_interests(user: dict = Depends(get_current_admin)):
    docs = await db.interests.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs

@api_router.post("/admin/interests")
async def admin_create_interest(payload: InterestIn, user: dict = Depends(get_current_admin)):
    obj = Interest(**payload.model_dump())
    await db.interests.insert_one(obj.model_dump())
    return obj

@api_router.delete("/admin/interests/{iid}")
async def admin_delete_interest(iid: str, user: dict = Depends(get_current_admin)):
    res = await db.interests.delete_one({"id": iid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Souscription introuvable")
    return {"ok": True}

# ---- Admin: settings ----
@api_router.put("/admin/settings")
async def admin_update_settings(payload: SettingsIn, user: dict = Depends(get_current_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "Aucun champ à mettre à jour")
    await db.settings.update_one({"key": "site"}, {"$set": update}, upsert=True)
    s = await db.settings.find_one({"key": "site"}, {"_id": 0, "key": 0})
    return s

@api_router.get("/")
async def root():
    return {"message": "The Casa API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
