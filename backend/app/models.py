from pydantic import BaseModel, ConfigDict, StrictStr, field_validator


class CarrierRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    origin_city: StrictStr
    destination_city: StrictStr

    @field_validator("origin_city", "destination_city")
    @classmethod
    def city_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("city must not be blank")
        return stripped


class Carrier(BaseModel):
    model_config = ConfigDict(frozen=True)

    name: str
    trucks_per_day: int


class CarrierResponse(BaseModel):
    carriers: list[Carrier]

