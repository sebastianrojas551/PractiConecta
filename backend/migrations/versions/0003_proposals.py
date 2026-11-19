"""Propuestas, autorización externa informada y documentos privados."""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"


def upgrade():
    op.create_table(
        "proposals",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("application_id", sa.Integer, sa.ForeignKey("applications.id", ondelete="RESTRICT"), nullable=False, unique=True),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("hours", sa.Integer, nullable=False),
        sa.Column("conditions", sa.Text, nullable=False),
        sa.Column("company_name", sa.Text, nullable=False),
        sa.Column("company_rut", sa.Text),
        sa.Column("representative", sa.Text, nullable=False),
        sa.Column("student_name", sa.Text, nullable=False),
        sa.Column("student_email", sa.Text, nullable=False),
        sa.Column("offer_title", sa.Text, nullable=False),
        sa.Column("status", sa.Text, server_default="pendiente", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True)),
        sa.Column("academic_status", sa.Text, server_default="pendiente", nullable=False),
        sa.Column("academic_note", sa.Text),
        sa.Column("academic_updated_at", sa.DateTime(timezone=True)),
        sa.Column("evidence", sa.LargeBinary),
        sa.Column("evidence_sha256", sa.Text),
        sa.Column("letter_html", sa.Text),
        sa.Column("letter_issued_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("status IN ('pendiente', 'aceptada', 'rechazada')", name="valid_proposal_status"),
        sa.CheckConstraint("end_date >= start_date AND hours > 0", name="valid_proposal_terms"),
        sa.CheckConstraint("academic_status IN ('pendiente', 'en_tramite', 'autorizacion_informada', 'no_requerida', 'denegada')", name="valid_academic_status"),
    )
    op.create_table(
        "proposal_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("proposal_id", sa.Integer, sa.ForeignKey("proposals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("action", sa.Text, nullable=False),
        sa.Column("detail", sa.Text),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_proposal_events_proposal_id", "proposal_events", ["proposal_id"])


def downgrade():
    op.drop_table("proposal_events")
    op.drop_table("proposals")
