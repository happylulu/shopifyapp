"""
GraphQL API Server
Standalone FastAPI server for GraphQL API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import logging

from graphql_api import graphql_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Loyalty Program GraphQL API",
    description="Public GraphQL API for storefront loyalty features",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure appropriately for production
)

# Include GraphQL router
app.include_router(graphql_router, prefix="/graphql")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Loyalty Program GraphQL API",
        "version": "1.0.0",
        "graphql_endpoint": "/graphql",
        "graphiql": "/graphql"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "graphql-api",
        "timestamp": "2024-01-15T10:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
