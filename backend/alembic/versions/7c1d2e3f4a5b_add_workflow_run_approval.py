"""add workflow run approval

Revision ID: 7c1d2e3f4a5b
Revises: 41bca2d4d019
Create Date: 2026-10-28 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7c1d2e3f4a5b"
down_revision: str | Sequence[str] | None = "41bca2d4d019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "workflow_runs",
        sa.Column(
            "approval_status",
            sa.String(length=50),
            nullable=False,
            server_default="pending",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("workflow_runs", "approval_status")
