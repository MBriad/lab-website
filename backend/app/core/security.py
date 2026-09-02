from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings
from app.core.errors import AppError


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: str, settings: Settings) -> tuple[str, int]:
    if not settings.secret_key:
        raise AppError(
            500, "configuration_error", "The authentication secret is not configured"
        )
    expires_in = settings.access_token_expire_minutes * 60
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256"), expires_in


def decode_access_token(token: str, settings: Settings) -> str:
    if not settings.secret_key:
        raise AppError(
            500, "configuration_error", "The authentication secret is not configured"
        )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        subject = payload.get("sub")
    except jwt.PyJWTError as exc:
        raise AppError(
            401,
            "authentication_required",
            "The access token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    if not isinstance(subject, str) or not subject:
        raise AppError(
            401,
            "authentication_required",
            "The access token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return subject
