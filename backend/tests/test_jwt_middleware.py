import pytest

fastapi = pytest.importorskip("fastapi")
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from jwt_middleware import JWTMiddleware, encode


def create_app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(JWTMiddleware)

    @app.get("/protected")
    async def protected(request: Request):
        return {"sub": request.state.jwt_payload["sub"]}

    return app


def test_valid_token():
    app = create_app()
    client = TestClient(app)
    token = encode({"sub": "user1"})
    res = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() == {"sub": "user1"}


def test_invalid_token():
    app = create_app()
    client = TestClient(app)
    res = client.get("/protected", headers={"Authorization": "Bearer bad"})
    assert res.status_code == 401
