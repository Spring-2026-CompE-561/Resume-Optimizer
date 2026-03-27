from src.app.core.settings import Settings


def test_settings_accepts_optimize_ai_mode_from_env_file(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPTIMIZE_AI_MODE=local\n", encoding="utf-8")

    settings = Settings(_env_file=env_file)

    assert settings.optimize_ai_mode == "local"


def test_settings_normalizes_optimize_ai_mode_values() -> None:
    settings = Settings(optimize_ai_mode=" RATE_LIMIT ")

    assert settings.optimize_ai_mode == "rate_limit"
