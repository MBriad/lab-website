from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import create_access_token, verify_password
from app.models import Admin
from app.schemas import AdminLoginRequest, AdminPublic, ErrorResponse, TokenResponse
from app.services.serializers import admin_public


router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    summary="Log in to the administrator API",
)
def login(
    payload: AdminLoginRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    username = payload.username.strip()
    admin = db.scalar(select(Admin).where(Admin.username == username))
    password = payload.password.get_secret_value()
    valid = admin is not None and verify_password(password, admin.password_hash)
    if not valid or admin is None or not admin.is_active:
        raise AppError(
            401,
            "invalid_credentials",
            "Username or password is incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token, expires_in = create_access_token(str(admin.id), settings)
    return TokenResponse(
        access_token=token, expires_in=expires_in, admin=admin_public(admin)
    )


@router.get(
    "/me", response_model=AdminPublic, responses={401: {"model": ErrorResponse}}
)
def current_admin(admin: Admin = Depends(get_current_admin)) -> AdminPublic:
    return admin_public(admin)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}},
)
def logout(_admin: Admin = Depends(get_current_admin)) -> None:
    """Bearer tokens are short-lived and stateless; the client discards this token on logout."""
    return None
