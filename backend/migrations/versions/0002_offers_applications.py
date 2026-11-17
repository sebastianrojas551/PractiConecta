"""Ofertas y postulaciones."""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"


def upgrade():
    op.create_table(
        "internship_offers",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("company_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.Text, nullable=False), sa.Column("area", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=False), sa.Column("requirements", sa.Text, nullable=False),
        sa.Column("city", sa.Text), sa.Column("region", sa.Text), sa.Column("modality", sa.Text, nullable=False),
        sa.Column("hours", sa.Integer, nullable=False), sa.Column("vacancies", sa.Integer, nullable=False),
        sa.Column("benefits", sa.Text), sa.Column("deadline", sa.DateTime(timezone=True)),
        sa.Column("status", sa.Text, server_default="publicada", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("status IN ('publicada', 'pausada', 'cerrada')", name="valid_offer_status"),
        sa.CheckConstraint("modality IN ('presencial', 'híbrida', 'remota')", name="valid_offer_modality"),
        sa.CheckConstraint("hours > 0 AND vacancies > 0", name="positive_offer_numbers"),
    )
    op.create_index("ix_internship_offers_company_id", "internship_offers", ["company_id"])
    op.create_table(
        "applications", sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("offer_id", sa.Integer, sa.ForeignKey("internship_offers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text), sa.Column("status", sa.Text, server_default="enviada", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("offer_id", "student_id", name="unique_offer_application"),
        sa.CheckConstraint("status IN ('enviada', 'en_revision', 'entrevista', 'rechazada', 'retirada')", name="valid_application_status"),
    )
    op.create_index("ix_applications_offer_id", "applications", ["offer_id"])
    op.create_index("ix_applications_student_id", "applications", ["student_id"])
    op.create_table(
        "application_events", sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("application_id", sa.Integer, sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer, sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("previous_status", sa.Text), sa.Column("next_status", sa.Text, nullable=False),
        sa.Column("comment", sa.Text), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])


def downgrade():
    op.drop_table("application_events")
    op.drop_table("applications")
    op.drop_table("internship_offers")
