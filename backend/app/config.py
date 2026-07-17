import os


DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173"


def get_allowed_origins(value: str | None = None) -> list[str]:
    configured = value if value is not None else os.getenv(
        "ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]

