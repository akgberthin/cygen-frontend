"""CYGEN comparison projection engine (single source of truth for the check numbers).

COP = cost of capital ONLY: a simple, non-compounding charge on the General
Partner's remaining (outstanding) capital. COP per month = remaining GP capital
x annual COP rate / 12, rounded to cents. It never contains an Equity part.

The COP in force is fixed for an adjustment window and re-sized from the
remaining GP capital at the start of month cadence+1, 2*cadence+1, ... (cadence
6 -> months 7, 13, 19, ...; cadence 12 -> months 13, 25, 37, ...). Equity paid
inside a window raises ownership at once but changes the COP only at the next
adjustment month. The only required monthly payment is the COP.
"""


def _cents(x):
    return round(x + 1e-9, 2)


def project(
    home_value,
    equity_pct,
    annual_cop_rate_pct,
    cadence_months=6,
    extra_monthly=0.0,
    extra_start=1,
    extra_end=None,
    one_times=None,
    horizon=1200,
):
    """Simulate the partnership month by month.

    one_times: list of (month, amount). Returns COP now, the adjustment table,
    ownership % and the projected month of 100% equity (None if not within the
    horizon) plus COP totals. All money rounded to cents."""
    one = {}
    for m, amount in one_times or []:
        m = int(m)
        one[m] = one.get(m, 0.0) + float(amount)

    gp0 = home_value * (1 - equity_pct / 100.0)
    balance = gp0
    cop = _cents(balance * annual_cop_rate_pct / 1200.0)
    first_cop = cop
    adjustments = []
    month = 0
    equity_window = 0.0
    window_start_balance = balance
    total_cop = 0.0
    total_equity_paid = 0.0

    while balance > 0.004 and month < horizon:
        month += 1
        if month > 1 and (month - 1) % cadence_months == 0:
            new_cop = _cents(balance * annual_cop_rate_pct / 1200.0)
            adjustments.append({
                "month": month,
                "gp_before": _cents(window_start_balance),
                "gp_after": _cents(balance),
                "cop_before": cop,
                "cop_after": new_cop,
                "change": _cents(new_cop - cop),
                "equity_in_window": _cents(equity_window),
            })
            cop = new_cop
            equity_window = 0.0
            window_start_balance = balance
        total_cop += cop
        equity = 0.0
        if extra_monthly > 0 and month >= extra_start and (extra_end is None or month <= extra_end):
            equity += extra_monthly
        equity += one.get(month, 0.0)
        equity = min(equity, balance)
        balance -= equity
        equity_window += equity
        total_equity_paid += equity

    completed_month = month if balance <= 0.004 else None
    months_run = month
    ownership_pct = round((home_value - balance) / home_value * 100.0, 2) if home_value else 0.0
    return {
        "gp_capital": _cents(gp0),
        "first_cop": first_cop,
        "cop_now": first_cop,
        "adjustments": adjustments,
        "completed_month": completed_month,
        "months": months_run,
        "ownership_pct": ownership_pct,
        "remaining_capital": _cents(balance),
        "total_cop": _cents(total_cop) if completed_month else None,
        "total_paid": _cents(gp0 + total_cop) if completed_month else None,
        "equity_paid": _cents(total_equity_paid),
        "builds_equity": (extra_monthly > 0) or bool(one),
    }
