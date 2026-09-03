from pathlib import Path, PurePosixPath
import secrets
import unicodedata


def normalize_filename(filename: str) -> str:
    normalized = unicodedata.normalize("NFKC", filename.replace("\\", "/"))
    basename = PurePosixPath(normalized).name
    cleaned = "".join(
        char for char in basename if char.isprintable() and char not in {"/", "\\"}
    )
    cleaned = " ".join(cleaned.split())
    if cleaned in {".", ".."}:
        return "upload"
    return (cleaned or "upload")[:255]


class LocalMediaStorage:
    """Filesystem adapter that keeps every key inside the configured media root."""

    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def resolve(self, storage_key: str) -> Path:
        key_path = PurePosixPath(storage_key)
        if key_path.is_absolute() or ".." in key_path.parts or "\\" in storage_key:
            raise ValueError("invalid storage key")
        target = (self.root / Path(*key_path.parts)).resolve()
        try:
            target.relative_to(self.root)
        except ValueError as exc:
            raise ValueError("invalid storage key") from exc
        return target

    def save(
        self, content: bytes, original_name: str, mime_type: str | None = None
    ) -> str:
        normalized_name = normalize_filename(original_name)
        extension = Path(normalized_name).suffix.lower()
        if extension not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            extension = {
                "image/jpeg": ".jpg",
                "image/png": ".png",
                "image/webp": ".webp",
                "image/gif": ".gif",
            }.get(mime_type or "", ".bin")
        key = f"{secrets.token_hex(2)}/{secrets.token_hex(16)}{extension}"
        target = self.resolve(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return key

    def delete(self, storage_key: str) -> None:
        target = self.resolve(storage_key)
        if target.exists():
            target.unlink()
