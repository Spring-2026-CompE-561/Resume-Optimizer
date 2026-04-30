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
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+psycopg://resume:resume@localhost:5432/resume_optimizer"
    database_echo: bool = False

    # Security
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Password reset
    password_reset_token_expire_minutes: int = 60

    # Optimization
    optimize_ai_mode: str = "local"
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.5"
    openai_timeout_seconds: int = 60
    openai_reasoning_effort: str = "low"

    # Storage
    storage_root: str = "storage"
    pdf_author: str = "Resume Optimizer"

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

    @field_validator("database_echo", mode="before")
    @classmethod
    def parse_database_echo(cls, value: bool | str) -> bool | str:
        return cls.parse_debug(value)

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
        valid_modes = {"local", "openai", "rate_limit", "fail"}
        if normalized not in valid_modes:
            raise ValueError(
                f"Invalid optimize AI mode: {value}. Expected one of {sorted(valid_modes)}"
            )
        return normalized

    @field_validator("openai_reasoning_effort", mode="before")
    @classmethod
    def normalize_reasoning_effort(cls, value: str) -> str:
        normalized = value.strip().lower()
        valid_efforts = {"minimal", "low", "medium", "high"}
        if normalized not in valid_efforts:
            raise ValueError(
                f"Invalid OpenAI reasoning effort: {value}. Expected one of {sorted(valid_efforts)}"
            )
        return normalized


settings = Settings()
