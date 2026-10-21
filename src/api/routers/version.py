import tomllib
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

PYPROJECT_PATH = Path(__file__).resolve().parents[3] / "pyproject.toml"


@lru_cache(maxsize=1)
def _read_version() -> str:
    with PYPROJECT_PATH.open("rb") as f:
        return tomllib.load(f)["project"]["version"]


@router.get("/version")
def version() -> dict[str, str]:
    return {"version": _read_version()}
