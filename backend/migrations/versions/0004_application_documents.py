"""Antecedentes privados y requisitos de postulación por oferta."""
from alembic import op
import sqlalchemy as sa


revision = "0004"
down_revision = "0003"


def upgrade():
    # Existing offers predate document requirements; do not retroactively claim they required a CV.
    op.add_column("internship_offers", sa.Column("cv_required", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.alter_column("internship_offers", "cv_required", server_default=sa.true())
    op.add_column("internship_offers", sa.Column("cover_letter_required", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("internship_offers", sa.Column("additional_requirements", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False))
    op.add_column("applications", sa.Column("cover_letter_text", sa.Text()))
    op.add_column("applications", sa.Column("profile_snapshot", sa.JSON(), server_default=sa.text("'{}'::json"), nullable=False))
    op.create_table(
        "application_documents",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=False),
        sa.Column("content", sa.LargeBinary(), nullable=False),
        sa.Column("sha256", sa.Text(), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_current", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("kind IN ('cv', 'carta_presentacion', 'adicional')", name="valid_application_document_kind"),
        sa.CheckConstraint("version > 0 AND size > 0", name="positive_application_document_metadata"),
        sa.UniqueConstraint("application_id", "label", "version", name="unique_application_document_version"),
    )
    op.create_index("ix_application_documents_application_id", "application_documents", ["application_id"])


def downgrade():
    op.drop_table("application_documents")
    op.drop_column("applications", "profile_snapshot")
    op.drop_column("applications", "cover_letter_text")
    op.drop_column("internship_offers", "additional_requirements")
    op.drop_column("internship_offers", "cover_letter_required")
    op.drop_column("internship_offers", "cv_required")
