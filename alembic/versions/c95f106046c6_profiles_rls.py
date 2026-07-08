"""profiles rls

Revision ID: c95f106046c6
Revises: 46c433092e5c
Create Date: 2026-07-08 20:10:57.609992

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c95f106046c6'
down_revision: Union[str, Sequence[str], None] = '46c433092e5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        grant select, insert, update on table public.profiles to authenticated;

        alter table public.profiles enable row level security;
        alter table public.profiles force row level security;

        create policy "profiles_select_own" on public.profiles
          for select to authenticated
          using ((select auth.uid()) = id);

        create policy "profiles_insert_own" on public.profiles
          for insert to authenticated
          with check ((select auth.uid()) = id);

        create policy "profiles_update_own" on public.profiles
          for update to authenticated
          using ((select auth.uid()) = id)
          with check ((select auth.uid()) = id);

        create function public.handle_new_user()
        returns trigger
        language plpgsql
        security definer set search_path = ''
        as $$
        begin
          insert into public.profiles (id, username, email)
          values (
            new.id,
            new.raw_user_meta_data ->> 'username',
            new.email
          );
          return new;
        end;
        $$;

        revoke execute on function public.handle_new_user() from public, anon, authenticated;

        create trigger on_auth_user_created
          after insert on auth.users
          for each row execute function public.handle_new_user();
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
        drop trigger if exists on_auth_user_created on auth.users;
        drop function if exists public.handle_new_user();
        drop policy if exists "profiles_update_own" on public.profiles;
        drop policy if exists "profiles_insert_own" on public.profiles;
        drop policy if exists "profiles_select_own" on public.profiles;
        alter table public.profiles no force row level security;
        alter table public.profiles disable row level security;
        revoke select, insert, update on table public.profiles from authenticated;
    """)
