import os

from sqlalchemy import URL, create_engine
from sqlalchemy.orm import Session


database_url = URL.create(
    "postgresql+psycopg",
    username=os.getenv("POSTGRES_USER", "practiconecta"),
    password=os.environ["POSTGRES_PASSWORD"],
    host=os.getenv("POSTGRES_HOST", "db"),
    port=int(os.getenv("POSTGRES_PORT", "5432")),
    database=os.getenv("POSTGRES_DB", "practiconecta"),
)
engine = create_engine(database_url, pool_pre_ping=True)


def get_db():
    with Session(engine) as db:
        yield db
