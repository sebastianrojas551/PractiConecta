"""Cuentas, perfiles y sesiones."""

from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.Text, nullable=False, unique=True),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("role", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("role IN ('estudiante', 'empresa')", name="valid_role"),
    )
    op.create_table(
        "student_profiles",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("nombre", sa.Text, nullable=False),
        sa.Column("carrera", sa.Text),
        sa.Column("institucion", sa.Text),
        sa.Column("nivel", sa.Text),
        sa.Column("ciudad", sa.Text),
        sa.Column("region", sa.Text),
        sa.Column("habilidades", sa.Text),
        sa.Column("disponibilidad", sa.Text),
        sa.Column("horas_objetivo", sa.Integer),
        sa.Column("modalidad", sa.Text),
        sa.Column("areas_interes", sa.Text),
    )
    op.create_table(
        "companies",
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("representante", sa.Text, nullable=False),
        sa.Column("razon_social", sa.Text),
        sa.Column("rut", sa.Text),
        sa.Column("rubro", sa.Text),
        sa.Column("ciudad", sa.Text),
        sa.Column("region", sa.Text),
        sa.Column("contacto", sa.Text),
        sa.Column("descripcion", sa.Text),
    )
    op.create_table(
        "login_sessions",
        sa.Column("token_hash", sa.Text, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_login_sessions_user_id", "login_sessions", ["user_id"])
    op.create_index("ix_login_sessions_expires_at", "login_sessions", ["expires_at"])


def downgrade():
    op.drop_table("login_sessions")
    op.drop_table("companies")
    op.drop_table("student_profiles")
    op.drop_table("users")
