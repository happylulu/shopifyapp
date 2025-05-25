import os
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Boolean,
    Float,
    func,
    delete,
    select,
)
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

# Default Neon connection string with asyncpg driver
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://neondb_owner:npg_nTXijxMf0yL9@ep-divine-snow-a8px2qp1-pooler.eastus2.azure.neon.tech/shopify?sslmode=require",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(bind=engine, expire_on_commit=False)

Base = declarative_base()


class Shop(Base):
    __tablename__ = "shops"
    id = Column(Integer, primary_key=True)
    shop_domain = Column(String, unique=True, index=True)
    access_token = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    customer_id = Column(String)
    name = Column(String)
    email = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class LoyaltyPoint(Base):
    __tablename__ = "loyalty_points"
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    customer_id = Column(String)
    points = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())


class ReferralLink(Base):
    __tablename__ = "referral_links"
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    customer_id = Column(String)
    code = Column(String)
    url = Column(String)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    archived = Column(Boolean, default=False)


class VIPMember(Base):
    __tablename__ = "vip_members"
    id = Column(Integer, primary_key=True)
    shop_id = Column(Integer, ForeignKey("shops.id"))
    customer_id = Column(String)
    tier = Column(String)
    joined_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    archived = Column(Boolean, default=False)


async def init_db() -> None:
    """Create all tables asynchronously."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@asynccontextmanager
async def get_db() -> AsyncSession:
    session: AsyncSession = async_session()
    try:
        yield session
    finally:
        await session.close()


async def purge_shop_data(shop_domain: str) -> None:
    """Remove all records associated with a shop when the app is uninstalled."""
    async with async_session() as session:
        result = await session.execute(select(Shop.id).where(Shop.shop_domain == shop_domain))
        shop_id = result.scalar_one_or_none()
        if shop_id is None:
            return

        for model in (Customer, LoyaltyPoint, ReferralLink, VIPMember):
            await session.execute(delete(model).where(model.shop_id == shop_id))
        await session.execute(delete(Shop).where(Shop.id == shop_id))
        await session.commit()
