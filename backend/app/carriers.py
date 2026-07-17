import re
import unicodedata

from .models import Carrier


NEW_YORK_TO_WASHINGTON = (
    Carrier(name="Knight-Swift Transport Services", trucks_per_day=10),
    Carrier(name="J.B. Hunt Transport Services Inc", trucks_per_day=7),
    Carrier(name="YRC Worldwide", trucks_per_day=5),
)

SAN_FRANCISCO_TO_LOS_ANGELES = (
    Carrier(name="XPO Logistics", trucks_per_day=9),
    Carrier(name="Schneider", trucks_per_day=6),
    Carrier(name="Landstar Systems", trucks_per_day=2),
)

FALLBACK_CARRIERS = (
    Carrier(name="UPS Inc.", trucks_per_day=11),
    Carrier(name="FedEx Corp", trucks_per_day=9),
)

_ALIASES = {
    "new york city": "new-york-city",
    "new york": "new-york-city",
    "nyc": "new-york-city",
    "washington dc": "washington-dc",
    "washington d c": "washington-dc",
    "washington": "washington-dc",
    "san francisco": "san-francisco",
    "los angeles": "los-angeles",
}

_SPECIAL_FIXTURES = {
    ("new-york-city", "washington-dc"): NEW_YORK_TO_WASHINGTON,
    ("san-francisco", "los-angeles"): SAN_FRANCISCO_TO_LOS_ANGELES,
}


def normalize_city(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold().strip()
    normalized = re.sub(r"[.,]", " ", normalized)
    normalized = " ".join(normalized.split())
    return _ALIASES.get(normalized, normalized)


def select_carriers(origin_city: str, destination_city: str) -> tuple[Carrier, ...]:
    pair = (normalize_city(origin_city), normalize_city(destination_city))
    return _SPECIAL_FIXTURES.get(pair, FALLBACK_CARRIERS)

