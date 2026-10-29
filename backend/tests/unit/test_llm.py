import pytest
from pydantic import SecretStr

from app.core.config import Settings
from app.services import llm


def test_create_llm_requires_deepseek_api_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        llm,
        "get_settings",
        lambda: Settings.model_validate({"deepseek_api_key": None}),
    )

    with pytest.raises(RuntimeError, match="DEEPSEEK_API_KEY"):
        llm.create_llm()


def test_create_llm_configures_deepseek(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        llm,
        "get_settings",
        lambda: Settings.model_validate(
            {
                "deepseek_api_key": "test-key",
                "llm_model": "deepseek-reasoner",
            }
        ),
    )

    model = llm.create_llm()

    assert model.model_name == "deepseek-reasoner"
    assert model.temperature == 0
    assert model.max_tokens == 2048
    assert isinstance(model.openai_api_key, SecretStr)
    assert model.openai_api_key.get_secret_value() == "test-key"
