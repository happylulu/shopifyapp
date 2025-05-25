import datetime
import os
import sys

# Ensure imports work when tests are run from repository root
sys.path.insert(0, os.path.dirname(__file__))

from services import PointsService


def test_revenue_impact_with_mock_data():
    service = PointsService()
    start = datetime.datetime(2025, 4, 1, tzinfo=datetime.timezone.utc)
    end = datetime.datetime(2025, 6, 1, tzinfo=datetime.timezone.utc)
    revenue = service.get_revenue_impact(start, end)
    assert revenue == 75.0
