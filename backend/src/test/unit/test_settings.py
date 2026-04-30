from src.app.core.settings import Settings


def test_settings_accepts_optimize_ai_mode_from_env_file(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPTIMIZE_AI_MODE=local\n", encoding="utf-8")

    settings = Settings(_env_file=env_file)

    assert settings.optimize_ai_mode == "local"


def test_settings_normalizes_optimize_ai_mode_values() -> None:
    settings = Settings(optimize_ai_mode=" RATE_LIMIT ")

    assert settings.optimize_ai_mode == "rate_limit"


def test_settings_default_to_postgres_database_url() -> None:
    settings = Settings()

    assert settings.database_url.startswith("postgresql+psycopg://")


def test_settings_normalize_openai_reasoning_effort() -> None:
    settings = Settings(openai_reasoning_effort=" HIGH ")

    assert settings.openai_reasoning_effort == "high"
