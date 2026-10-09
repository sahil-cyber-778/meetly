import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import main
from database import get_db


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    """Every test uses its own real SQLite file, never the user's database."""
    engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}", connect_args={"check_same_thread": False})
    factory = sessionmaker(bind=engine)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", factory)
    monkeypatch.setenv("SEED_DEMO", "true")
    def session():
        with factory() as db:
            yield db
    main.app.dependency_overrides[get_db] = session
    yield factory
    main.app.dependency_overrides.clear()
    engine.dispose()
