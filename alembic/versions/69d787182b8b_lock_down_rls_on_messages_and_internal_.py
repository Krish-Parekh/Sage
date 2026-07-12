"""lock down rls on messages and internal tables

Revision ID: 69d787182b8b
Revises: 64d24c88a68e
Create Date: 2026-07-12 10:39:06.768308

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '69d787182b8b'
down_revision: Union[str, Sequence[str], None] = '64d24c88a68e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        -- No client-facing policies: the frontend reads messages only through the
        -- backend API, which connects as the postgres role and bypasses RLS.
        -- Enabling RLS with zero policies denies all anon/authenticated access,
        -- which the default public grants would otherwise permit.
        alter table public.messages enable row level security;

        -- Migration bookkeeping should never be reachable via the PostgREST API.
        alter table public.alembic_version enable row level security;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        alter table public.alembic_version disable row level security;
        alter table public.messages disable row level security;
    """)
