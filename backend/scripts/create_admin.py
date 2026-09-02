"""Create or replace a local administrator from explicit command-line input."""

import argparse
from pathlib import Path
import sys
import uuid


backend_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_root))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models import Admin  # noqa: E402


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("username")
parser.add_argument("password")
args = parser.parse_args()

with SessionLocal() as db:
    admin = db.query(Admin).filter(Admin.username == args.username).one_or_none()
    if admin is None:
        admin = Admin(
            id=uuid.uuid4(),
            username=args.username,
            password_hash=hash_password(args.password),
            is_active=True,
        )
        db.add(admin)
    else:
        admin.password_hash = hash_password(args.password)
        admin.is_active = True
    db.commit()
    print(f"Administrator ready: {admin.username}")
