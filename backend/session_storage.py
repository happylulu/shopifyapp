"""
Session Storage Service for FastAPI Backend

This service provides access to the shared session storage used by the Next.js frontend.
It allows FastAPI to retrieve shop-specific Shopify access tokens that were obtained
during the OAuth flow handled by the Next.js backend.

The session storage is shared between Next.js (using Prisma) and FastAPI (using SQLAlchemy).
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path
from sqlalchemy import Column, String, DateTime, Boolean, create_engine, select
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
def load_env():
    """Load environment variables from .env file."""
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

# Load environment before getting DATABASE_URL
load_env()

# Use the same database URL as the main models
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Please set it to your PostgreSQL connection string, e.g.: "
        "postgresql+asyncpg://user:pass@localhost/dbname"
    )

# Create async engine for session storage
session_engine = create_async_engine(DATABASE_URL, echo=False)
SessionStorageSession = async_sessionmaker(session_engine, class_=AsyncSession, expire_on_commit=False)

# Base for session storage models
SessionBase = declarative_base()


class ShopifySession(SessionBase):
    """
    Session model that matches the Prisma schema used by Next.js frontend.
    This allows FastAPI to read the same session data stored by the Next.js OAuth flow.
    """
    __tablename__ = "Session"  # Matches Prisma table name

    id = Column(String, primary_key=True)
    accessToken = Column(String, nullable=True)
    expires = Column(DateTime, nullable=True)
    isOnline = Column(Boolean, nullable=False)
    scope = Column(String, nullable=True)
    shop = Column(String, nullable=False)
    state = Column(String, nullable=False)
    apiKey = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    updatedAt = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class SessionStorageService:
    """Service for accessing shop-specific Shopify sessions and access tokens."""

    def __init__(self):
        self.session_factory = SessionStorageSession

    async def get_shop_access_token(self, shop_domain: str) -> Optional[str]:
        """
        Retrieve the offline access token for a specific shop.

        Args:
            shop_domain: The shop domain (e.g., 'mystore.myshopify.com')

        Returns:
            The access token for the shop, or None if not found
        """
        async with self.session_factory() as session:
            # Look for offline access token for this shop
            stmt = select(ShopifySession).where(
                ShopifySession.shop == shop_domain,
                ShopifySession.isOnline == False,  # Offline token
                ShopifySession.accessToken.isnot(None)
            ).order_by(ShopifySession.updatedAt.desc())

            result = await session.execute(stmt)
            shopify_session = result.scalar_one_or_none()

            if shopify_session and shopify_session.accessToken:
                return shopify_session.accessToken

            return None

    async def get_shop_session(self, shop_domain: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve the full session data for a specific shop.

        Args:
            shop_domain: The shop domain (e.g., 'mystore.myshopify.com')

        Returns:
            Dictionary containing session data, or None if not found
        """
        async with self.session_factory() as session:
            # Look for offline access token for this shop
            stmt = select(ShopifySession).where(
                ShopifySession.shop == shop_domain,
                ShopifySession.isOnline == False,  # Offline token
                ShopifySession.accessToken.isnot(None)
            ).order_by(ShopifySession.updatedAt.desc())

            result = await session.execute(stmt)
            shopify_session = result.scalar_one_or_none()

            if shopify_session:
                return {
                    "id": shopify_session.id,
                    "shop": shopify_session.shop,
                    "accessToken": shopify_session.accessToken,
                    "scope": shopify_session.scope,
                    "isOnline": shopify_session.isOnline,
                    "expires": shopify_session.expires,
                    "state": shopify_session.state,
                    "apiKey": shopify_session.apiKey,
                    "createdAt": shopify_session.createdAt,
                    "updatedAt": shopify_session.updatedAt,
                }

            return None

    async def is_shop_installed(self, shop_domain: str) -> bool:
        """
        Check if a shop has the app installed (has a valid access token).

        Args:
            shop_domain: The shop domain (e.g., 'mystore.myshopify.com')

        Returns:
            True if the shop has a valid access token, False otherwise
        """
        access_token = await self.get_shop_access_token(shop_domain)
        return access_token is not None

    async def list_installed_shops(self) -> list[str]:
        """
        Get a list of all shops that have the app installed.

        Returns:
            List of shop domains that have valid access tokens
        """
        async with self.session_factory() as session:
            stmt = select(ShopifySession.shop).where(
                ShopifySession.isOnline == False,  # Offline tokens
                ShopifySession.accessToken.isnot(None)
            ).distinct()

            result = await session.execute(stmt)
            shops = result.scalars().all()

            return list(shops)


# Global instance
session_storage = SessionStorageService()


async def get_session_storage() -> SessionStorageService:
    """Dependency for FastAPI endpoints to get the session storage service."""
    return session_storage
