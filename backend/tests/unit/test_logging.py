import json
import logging

from app.core.logging import JsonFormatter, request_id_var


def test_json_formatter_includes_request_id() -> None:
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hello",
        args=(),
        exc_info=None,
    )

    token = request_id_var.set("request-123")

    try:
        payload: dict[str, object] = json.loads(JsonFormatter().format(record))
    finally:
        request_id_var.reset(token)

    assert payload["level"] == "INFO"
    assert payload["logger"] == "test"
    assert payload["message"] == "hello"
    assert payload["request_id"] == "request-123"
