import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Resume Optimizer API"
    app_description: str = (
        "Backend API for authentication, resume ingestion, job posting analysis, "
        "and resume optimization."
    )
    app_version: str = "0.1.0"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"
    log_level: str = "INFO"

    # Database
    database_url: str = "sqlite:///./resume_optimizer.db"

    # Security
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Password reset
    password_reset_token_expire_minutes: int = 60

    # Optimization
    optimize_ai_mode: str = "local"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str] | str:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return []
            if normalized.startswith("["):
                return json.loads(normalized)
            return [origin.strip() for origin in normalized.split(",") if origin.strip()]
        return value

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value: bool | str) -> bool | str:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "dev", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "prod", "production"}:
                return False
        return value

    @field_validator("log_level", mode="before")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        normalized = value.strip().upper()
        valid_levels = {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG", "NOTSET"}
        if normalized not in valid_levels:
            raise ValueError(f"Invalid log level: {value}")
        return normalized

    @field_validator("optimize_ai_mode", mode="before")
    @classmethod
    def normalize_optimize_ai_mode(cls, value: str) -> str:
        normalized = value.strip().lower()
        valid_modes = {"local", "rate_limit", "fail"}
        if normalized not in valid_modes:
            raise ValueError(
                f"Invalid optimize AI mode: {value}. Expected one of {sorted(valid_modes)}"
            )
        return normalized


settings = Settings()
