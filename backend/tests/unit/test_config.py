import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_defaults_are_safe_for_local_development() -> None:
    settings = Settings.model_validate({})

    assert settings.app_name == "CodeForge AI"
    assert settings.environment == "development"
    assert settings.debug is False
    assert settings.api_v1_prefix == "/api/v1"
    assert settings.log_level == "INFO"
    assert settings.cors_origins == ["http://localhost:3000"]


def test_cors_origins_are_split_from_comma_separated_env(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "CODEFORGE_CORS_ORIGINS",
        "http://localhost:3000, https://example.com",
    )

    settings = Settings()

    assert settings.cors_origins == [
        "http://localhost:3000",
        "https://example.com",
    ]


def test_log_level_is_normalized() -> None:
    settings = Settings.model_validate({"log_level": "debug"})

    assert settings.log_level == "DEBUG"


def test_invalid_log_level_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings.model_validate({"log_level": "LOUD"})


def test_invalid_environment_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings.model_validate({"environment": "invalid"})


def test_api_prefix_requires_leading_slash() -> None:
    with pytest.raises(ValidationError):
        Settings.model_validate({"api_v1_prefix": "api/v1"})


def test_api_prefix_trailing_slash_is_removed() -> None:
    settings = Settings.model_validate({"api_v1_prefix": "/api/v1/"})

    assert settings.api_v1_prefix == "/api/v1"


def test_llm_defaults_target_deepseek() -> None:
    settings = Settings.model_validate({})

    assert settings.llm_provider == "deepseek"
    assert settings.llm_model == "deepseek-chat"
    assert settings.deepseek_api_key is None
