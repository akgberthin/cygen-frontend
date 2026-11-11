"""Check numbers for the comparison projection engine (owner-supplied, must match exactly).
Run from the repo root: pytest tests/test_compare.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from compare import project  # noqa: E402


def test_cop_only_stays_flat():
    r = project(300000, 10, 7)
    assert r["gp_capital"] == 270000.00
    assert r["first_cop"] == 1575.00
    assert r["adjustments"][0]["cop_after"] == 1575.00  # resized, unchanged
    assert r["ownership_pct"] == 10.0
    assert r["completed_month"] is None
    assert r["builds_equity"] is False


def test_cadence_6_with_500_monthly():
    r = project(300000, 10, 7, cadence_months=6, extra_monthly=500.0)
    assert r["first_cop"] == 1575.00
    adj = {a["month"]: a for a in r["adjustments"]}
    assert adj[7]["cop_after"] == 1557.50    # months 7-12
    assert adj[13]["cop_after"] == 1540.00   # months 13-18
    assert adj[7]["equity_in_window"] == 3000.00
    assert adj[7]["gp_after"] == 267000.00


def test_one_time_payment_inside_window():
    r = project(300000, 10, 7, cadence_months=6, extra_monthly=500.0, one_times=[(8, 12000.0)])
    adj = {a["month"]: a for a in r["adjustments"]}
    assert adj[7]["cop_after"] == 1557.50          # one-time is inside window 2
    assert adj[13]["gp_after"] == 252000.00
    assert adj[13]["cop_after"] == 1470.00         # months 13-18
    assert adj[13]["equity_in_window"] == 15000.00


def test_cadence_12_with_500_monthly():
    r = project(300000, 10, 7, cadence_months=12, extra_monthly=500.0)
    assert r["first_cop"] == 1575.00
    adj = {a["month"]: a for a in r["adjustments"]}
    assert 7 not in adj                             # no adjustment at month 7
    assert adj[13]["cop_after"] == 1540.00          # from month 13
    assert adj[13]["equity_in_window"] == 6000.00


def test_completion_and_totals():
    r = project(300000, 10, 7, cadence_months=6, extra_monthly=2000.0)
    assert r["completed_month"] is not None
    assert r["ownership_pct"] == 100.0
    assert r["total_cop"] is not None and r["total_paid"] is not None
    assert r["total_paid"] > r["gp_capital"]


def test_not_within_projection():
    r = project(900000, 0, 12, cadence_months=6, extra_monthly=10.0)
    assert r["completed_month"] is None  # 1200-month cap respected
