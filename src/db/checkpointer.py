from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

from src.config import settings

_DB_URI = settings.DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

_CONNECTION_KWARGS = {"autocommit": True, "prepare_threshold": 0}

_CHECKPOINT_TABLES = (
    "checkpoints",
    "checkpoint_blobs",
    "checkpoint_writes",
    "checkpoint_migrations",
)


def build_checkpointer() -> tuple[PostgresSaver, ConnectionPool]:
    pool = ConnectionPool(
        conninfo=_DB_URI,
        max_size=20,
        kwargs=_CONNECTION_KWARGS,
        open=True,
    )
    checkpointer = PostgresSaver(pool)
    checkpointer.setup()
    with pool.connection() as conn:
        for table in _CHECKPOINT_TABLES:
            conn.execute(
                f"alter table if exists public.{table} enable row level security"
            )
    return checkpointer, pool
