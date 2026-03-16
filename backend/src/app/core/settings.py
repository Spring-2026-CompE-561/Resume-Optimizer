from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Resume Optimizer API"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    database_url: str = "sqlite:///./resume_optimizer.db"

    # Security
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Password reset
    password_reset_token_expire_minutes: int = 60


settings = Settings()
