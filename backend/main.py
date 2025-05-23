from datetime import datetime, timezone, timedelta
import calendar

from fastapi import FastAPI

from .services import (
    get_total_points_issued,
    get_active_members,
    get_points_redeemed,
    get_revenue_impact,
)

app = FastAPI()


def first_day_of_month(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, 1, tzinfo=timezone.utc)


def last_day_of_month(dt: datetime) -> datetime:
    days = calendar.monthrange(dt.year, dt.month)[1]
    return datetime(dt.year, dt.month, days, 23, 59, 59, tzinfo=timezone.utc)


def pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)


@app.get("/dashboard/overview")
async def dashboard_overview():
    now = datetime.utcnow().replace(tzinfo=timezone.utc)

    current_start = first_day_of_month(now)
    current_end = last_day_of_month(now)

    prev_month = current_start - timedelta(days=1)
    previous_start = first_day_of_month(prev_month)
    previous_end = last_day_of_month(prev_month)

    points_current = get_total_points_issued(current_start, current_end)
    points_previous = get_total_points_issued(previous_start, previous_end)

    active_current = get_active_members(current_start, current_end)
    active_previous = get_active_members(previous_start, previous_end)

    redeemed_current = get_points_redeemed(current_start, current_end)
    redeemed_previous = get_points_redeemed(previous_start, previous_end)

    revenue_current = get_revenue_impact(current_start, current_end)
    revenue_previous = get_revenue_impact(previous_start, previous_end)

    return {
        "total_points_issued": {
            "value": points_current,
            "percent_change": pct_change(points_current, points_previous),
        },
        "active_members": {
            "value": active_current,
            "percent_change": pct_change(active_current, active_previous),
        },
        "points_redeemed": {
            "value": redeemed_current,
            "percent_change": pct_change(redeemed_current, redeemed_previous),
        },
        "revenue_impact": {
            "value": revenue_current,
            "percent_change": pct_change(revenue_current, revenue_previous),
        },
    }
