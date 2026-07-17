from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .carriers import select_carriers
from .config import get_allowed_origins
from .models import CarrierRequest, CarrierResponse


FRONTEND_DIST_DIR = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app(frontend_dist_dir: Path = FRONTEND_DIST_DIR) -> FastAPI:
    application = FastAPI(
        title="Genlogs Carrier API",
        description="Static carrier availability for the Genlogs route simulation.",
        version="0.1.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=False,
        allow_methods=["POST"],
        allow_headers=["Content-Type"],
    )

    @application.post("/api/carriers", response_model=CarrierResponse)
    def lookup_carriers(request: CarrierRequest) -> CarrierResponse:
        carriers = select_carriers(request.origin_city, request.destination_city)
        return CarrierResponse(carriers=list(carriers))

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Register the frontend last so explicit API and health routes win.
    if frontend_dist_dir.is_dir():
        application.mount(
            "/",
            StaticFiles(directory=str(frontend_dist_dir), html=True),
            name="frontend",
        )

    return application


app = create_app()
