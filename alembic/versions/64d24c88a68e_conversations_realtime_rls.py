"""conversations realtime rls

Revision ID: 64d24c88a68e
Revises: d827cbc0d515
Create Date: 2026-07-12 10:35:34.475458

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '64d24c88a68e'
down_revision: Union[str, Sequence[str], None] = 'd827cbc0d515'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        -- Clients only read (via Realtime); all writes go through the backend.
        grant select on table public.conversations to authenticated;

        -- 'enable' (not 'force'): the backend writes as the postgres role, which
        -- bypasses RLS. 'force' would subject it to RLS and break append_turn.
        alter table public.conversations enable row level security;

        -- Realtime authorizes a subscription against this SELECT policy: a client
        -- receives a change only for rows it is allowed to select (its own).
        create policy "conversations_select_own" on public.conversations
          for select to authenticated
          using ((select auth.uid()) = user_id);

        -- FULL so the UPDATE event carries user_id (RLS check) and thread_id
        -- (client filter), which default replica identity would omit.
        alter table public.conversations replica identity full;

        -- Broadcast this table's changes over Supabase Realtime.
        alter publication supabase_realtime add table public.conversations;
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        alter publication supabase_realtime drop table public.conversations;
        alter table public.conversations replica identity default;
        drop policy if exists "conversations_select_own" on public.conversations;
        alter table public.conversations disable row level security;
        revoke select on table public.conversations from authenticated;
    """)
