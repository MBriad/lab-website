from collections.abc import Generator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Admin


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Admin:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppError(
            401,
            "authentication_required",
            "A bearer access token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    admin_id = decode_access_token(credentials.credentials, settings)
    try:
        from uuid import UUID

        identifier = UUID(admin_id)
    except ValueError as exc:
        raise AppError(
            401,
            "authentication_required",
            "The access token is invalid",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    admin = db.get(Admin, identifier)
    if admin is None or not admin.is_active:
        raise AppError(
            401,
            "authentication_required",
            "The administrator is not active",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return admin


CurrentAdmin = Generator[Admin, None, None]
