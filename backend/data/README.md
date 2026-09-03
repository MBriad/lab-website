# Local CMS content snapshot

This directory contains the development content snapshot used by the
robotics-lab site:

- `cms.db` stores the configured news, research areas, awards, gallery
  records, site settings, and media metadata.
- `media/` stores the corresponding uploaded image files.

Administrator accounts are intentionally not included in the snapshot. After
cloning, create a local administrator with an explicit password:

```powershell
python backend/scripts/create_admin.py admin "your-local-password"
```

The production Docker Compose stack uses PostgreSQL and the `media_data` volume.
This SQLite snapshot is for local reproduction; production deployments should
import the content into PostgreSQL and copy `media/` into the persistent media
volume.
