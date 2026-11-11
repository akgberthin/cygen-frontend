"""Frontend <-> backend path parity: every path in frontend/src/lib/api.js must
have a matching FastAPI route, and every backend route (except platform cron
endpoints) must be listed in api.js. Run: pytest tests/test_api_parity.py"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API_JS = ROOT / "frontend" / "src" / "lib" / "api.js"
SERVER_PY = ROOT / "backend" / "server.py"


def _normalize(path: str) -> str:
    path = re.sub(r"\$\{[^}]+\}", "{p}", path)   # template params
    path = re.sub(r"\{[^}]+\}", "{p}", path)      # FastAPI params
    return path


def frontend_paths():
    src = API_JS.read_text()
    static = re.findall(r'"(/api/[^"]*)"', src)
    templated = re.findall(r"`(/api/[^`]*)`", src)
    return {_normalize(p) for p in static + templated}


def backend_paths():
    src = SERVER_PY.read_text()
    found = re.findall(r'@api_router\.\w+\(\s*"(/[^"]*)"', src)
    paths = {"/api" + _normalize(p) for p in found}
    return {p for p in paths if not p.startswith("/api/cron/")}


def test_frontend_paths_exist_on_backend():
    missing = frontend_paths() - backend_paths()
    assert not missing, f"frontend paths with no backend route: {sorted(missing)}"


def test_backend_routes_are_listed_in_frontend():
    missing = backend_paths() - frontend_paths()
    assert not missing, f"backend routes missing from api.js: {sorted(missing)}"
