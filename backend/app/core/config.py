from functools import lru_cache
from pathlib import Path
import secrets

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Robotics Laboratory CMS API"
    environment: str = "development"
    database_url: str = "sqlite:///./backend/data/cms.db"
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    access_token_expire_minutes: int = Field(default=30, ge=5, le=1440)
    frontend_origins: str = "http://localhost:3000"
    media_root: Path = Path("./backend/data/media")
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, ge=1024)
    max_image_pixels: int = Field(default=25_000_000, ge=1_000_000)
    # MPO is produced by some phone cameras and WeChat exports. The upload
    # route normalizes it to a browser-friendly JPEG after validation.
    allowed_image_mimes: str = "image/jpeg,image/png,image/webp,image/gif,image/mpo"

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]

    @property
    def allowed_mime_types(self) -> set[str]:
        return {
            mime.strip().lower()
            for mime in self.allowed_image_mimes.split(",")
            if mime.strip()
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()
