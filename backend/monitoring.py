"""
Monitoring and Observability for Event Streaming System
Provides metrics, health checks, and performance monitoring
"""

import asyncio
import time
import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import logging

import redis.asyncio as redis
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import APIRouter, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from event_streaming import EventStreamer, EventStreamMonitor
from rule_models import RuleExecution, Rule
from models_v2 import get_db

logger = logging.getLogger(__name__)

# Prometheus metrics
event_counter = Counter('loyalty_events_total', 'Total events processed', ['event_type', 'status'])
rule_execution_counter = Counter('loyalty_rules_executed_total', 'Total rule executions', ['shop_domain', 'rule_name', 'status'])
rule_execution_duration = Histogram('loyalty_rule_execution_duration_seconds', 'Rule execution duration')
webhook_delivery_counter = Counter('loyalty_webhooks_delivered_total', 'Total webhook deliveries', ['status'])
stream_lag_gauge = Gauge('loyalty_stream_lag_messages', 'Number of messages behind in stream processing')
active_consumers_gauge = Gauge('loyalty_active_consumers', 'Number of active stream consumers')

# Create monitoring router
monitoring_router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


@dataclass
class SystemMetrics:
    """System-wide metrics"""
    timestamp: datetime
    events_processed_1h: int
    events_processed_24h: int
    rules_executed_1h: int
    rules_executed_24h: int
    average_processing_time_ms: float
    error_rate_1h: float
    stream_lag: int
    active_consumers: int
    webhook_success_rate_1h: float


@dataclass
class ShopMetrics:
    """Per-shop metrics"""
    shop_domain: str
    events_processed_1h: int
    rules_executed_1h: int
    top_triggered_rules: List[Dict[str, Any]]
    error_rate_1h: float
    average_processing_time_ms: float


class MetricsCollector:
    """Collects and aggregates metrics from various sources"""
    
    def __init__(self):
        self.stream_monitor = EventStreamMonitor()
        self.metrics_cache = {}
        self.cache_ttl = 300  # 5 minutes

    async def get_system_metrics(self) -> SystemMetrics:
        """Get system-wide metrics"""
        cache_key = "system_metrics"
        
        if cache_key in self.metrics_cache:
            cached_time, cached_data = self.metrics_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                return cached_data

        async with get_db() as db:
            now = datetime.utcnow()
            one_hour_ago = now - timedelta(hours=1)
            twenty_four_hours_ago = now - timedelta(hours=24)

            # Events processed
            events_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    RuleExecution.executed_at >= one_hour_ago
                )
            )
            events_1h_count = events_1h.scalar() or 0

            events_24h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    RuleExecution.executed_at >= twenty_four_hours_ago
                )
            )
            events_24h_count = events_24h.scalar() or 0

            # Rules executed
            rules_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.executed_at >= one_hour_ago,
                        RuleExecution.conditions_met == True
                    )
                )
            )
            rules_1h_count = rules_1h.scalar() or 0

            rules_24h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.executed_at >= twenty_four_hours_ago,
                        RuleExecution.conditions_met == True
                    )
                )
            )
            rules_24h_count = rules_24h.scalar() or 0

            # Average processing time
            avg_time_result = await db.execute(
                select(func.avg(RuleExecution.execution_time_ms)).where(
                    RuleExecution.executed_at >= one_hour_ago
                )
            )
            avg_processing_time = float(avg_time_result.scalar() or 0)

            # Error rate
            errors_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.executed_at >= one_hour_ago,
                        RuleExecution.success == False
                    )
                )
            )
            errors_1h_count = errors_1h.scalar() or 0
            error_rate = (errors_1h_count / max(events_1h_count, 1)) * 100

            # Stream metrics
            stream_info = await self.stream_monitor.get_stream_info()
            stream_lag = stream_info.get("pending_info", {}).get("pending", 0)
            
            # Active consumers (simplified)
            active_consumers = len(stream_info.get("groups_info", []))

            metrics = SystemMetrics(
                timestamp=now,
                events_processed_1h=events_1h_count,
                events_processed_24h=events_24h_count,
                rules_executed_1h=rules_1h_count,
                rules_executed_24h=rules_24h_count,
                average_processing_time_ms=avg_processing_time,
                error_rate_1h=error_rate,
                stream_lag=stream_lag,
                active_consumers=active_consumers,
                webhook_success_rate_1h=95.0  # Placeholder - would calculate from webhook logs
            )

            # Cache the result
            self.metrics_cache[cache_key] = (time.time(), metrics)
            return metrics

    async def get_shop_metrics(self, shop_domain: str) -> ShopMetrics:
        """Get metrics for a specific shop"""
        cache_key = f"shop_metrics_{shop_domain}"
        
        if cache_key in self.metrics_cache:
            cached_time, cached_data = self.metrics_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                return cached_data

        async with get_db() as db:
            now = datetime.utcnow()
            one_hour_ago = now - timedelta(hours=1)

            # Events processed for this shop
            events_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.shop_domain == shop_domain,
                        RuleExecution.executed_at >= one_hour_ago
                    )
                )
            )
            events_1h_count = events_1h.scalar() or 0

            # Rules executed for this shop
            rules_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.shop_domain == shop_domain,
                        RuleExecution.executed_at >= one_hour_ago,
                        RuleExecution.conditions_met == True
                    )
                )
            )
            rules_1h_count = rules_1h.scalar() or 0

            # Top triggered rules
            top_rules_result = await db.execute(
                select(
                    Rule.name,
                    func.count(RuleExecution.id).label('execution_count')
                ).join(RuleExecution).where(
                    and_(
                        RuleExecution.shop_domain == shop_domain,
                        RuleExecution.executed_at >= one_hour_ago,
                        RuleExecution.conditions_met == True
                    )
                ).group_by(Rule.name).order_by(
                    func.count(RuleExecution.id).desc()
                ).limit(5)
            )
            
            top_rules = [
                {"rule_name": row.name, "execution_count": row.execution_count}
                for row in top_rules_result
            ]

            # Error rate for this shop
            errors_1h = await db.execute(
                select(func.count(RuleExecution.id)).where(
                    and_(
                        RuleExecution.shop_domain == shop_domain,
                        RuleExecution.executed_at >= one_hour_ago,
                        RuleExecution.success == False
                    )
                )
            )
            errors_1h_count = errors_1h.scalar() or 0
            error_rate = (errors_1h_count / max(events_1h_count, 1)) * 100

            # Average processing time for this shop
            avg_time_result = await db.execute(
                select(func.avg(RuleExecution.execution_time_ms)).where(
                    and_(
                        RuleExecution.shop_domain == shop_domain,
                        RuleExecution.executed_at >= one_hour_ago
                    )
                )
            )
            avg_processing_time = float(avg_time_result.scalar() or 0)

            metrics = ShopMetrics(
                shop_domain=shop_domain,
                events_processed_1h=events_1h_count,
                rules_executed_1h=rules_1h_count,
                top_triggered_rules=top_rules,
                error_rate_1h=error_rate,
                average_processing_time_ms=avg_processing_time
            )

            # Cache the result
            self.metrics_cache[cache_key] = (time.time(), metrics)
            return metrics

    async def get_rule_performance(self, rule_id: str, hours: int = 24) -> Dict[str, Any]:
        """Get performance metrics for a specific rule"""
        async with get_db() as db:
            since = datetime.utcnow() - timedelta(hours=hours)

            # Execution stats
            stats_result = await db.execute(
                select(
                    func.count(RuleExecution.id).label('total_executions'),
                    func.sum(func.cast(RuleExecution.conditions_met, db.Integer)).label('conditions_met_count'),
                    func.avg(RuleExecution.execution_time_ms).label('avg_execution_time'),
                    func.max(RuleExecution.execution_time_ms).label('max_execution_time'),
                    func.sum(func.cast(RuleExecution.success, db.Integer)).label('success_count')
                ).where(
                    and_(
                        RuleExecution.rule_id == rule_id,
                        RuleExecution.executed_at >= since
                    )
                )
            )
            
            stats = stats_result.first()
            
            if not stats or stats.total_executions == 0:
                return {
                    "rule_id": rule_id,
                    "period_hours": hours,
                    "total_executions": 0,
                    "conditions_met_rate": 0,
                    "success_rate": 0,
                    "avg_execution_time_ms": 0,
                    "max_execution_time_ms": 0
                }

            return {
                "rule_id": rule_id,
                "period_hours": hours,
                "total_executions": stats.total_executions,
                "conditions_met_count": stats.conditions_met_count or 0,
                "conditions_met_rate": (stats.conditions_met_count or 0) / stats.total_executions * 100,
                "success_rate": (stats.success_count or 0) / stats.total_executions * 100,
                "avg_execution_time_ms": float(stats.avg_execution_time or 0),
                "max_execution_time_ms": stats.max_execution_time or 0
            }


# Initialize metrics collector
metrics_collector = MetricsCollector()


# ============================================================================
# MONITORING ENDPOINTS
# ============================================================================

@monitoring_router.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")


@monitoring_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        async with get_db() as db:
            await db.execute(select(1))
        
        # Check Redis connection
        streamer = EventStreamer()
        await streamer.connect()
        await streamer.disconnect()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "database": "healthy",
                "redis": "healthy",
                "event_streaming": "healthy"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }


@monitoring_router.get("/system-metrics")
async def get_system_metrics():
    """Get system-wide metrics"""
    try:
        metrics = await metrics_collector.get_system_metrics()
        return asdict(metrics)
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system metrics")


@monitoring_router.get("/shop-metrics/{shop_domain}")
async def get_shop_metrics(shop_domain: str):
    """Get metrics for a specific shop"""
    try:
        metrics = await metrics_collector.get_shop_metrics(shop_domain)
        return asdict(metrics)
    except Exception as e:
        logger.error(f"Failed to get shop metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get shop metrics")


@monitoring_router.get("/rule-performance/{rule_id}")
async def get_rule_performance(rule_id: str, hours: int = 24):
    """Get performance metrics for a specific rule"""
    try:
        performance = await metrics_collector.get_rule_performance(rule_id, hours)
        return performance
    except Exception as e:
        logger.error(f"Failed to get rule performance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get rule performance")


@monitoring_router.get("/stream-info")
async def get_stream_info():
    """Get Redis stream information"""
    try:
        monitor = EventStreamMonitor()
        stream_info = await monitor.get_stream_info()
        lag_info = await monitor.get_consumer_lag()
        
        return {
            "stream_info": stream_info,
            "lag_info": lag_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get stream info: {e}")
        raise HTTPException(status_code=500, detail="Failed to get stream info")


# ============================================================================
# ALERTING SYSTEM
# ============================================================================

class AlertManager:
    """Simple alerting system for monitoring thresholds"""
    
    def __init__(self):
        self.alert_thresholds = {
            "error_rate_threshold": 5.0,  # 5% error rate
            "processing_time_threshold": 1000,  # 1 second
            "stream_lag_threshold": 1000,  # 1000 messages
            "webhook_failure_threshold": 10.0  # 10% failure rate
        }
        self.active_alerts = set()

    async def check_alerts(self):
        """Check for alert conditions"""
        try:
            metrics = await metrics_collector.get_system_metrics()
            
            alerts = []
            
            # Check error rate
            if metrics.error_rate_1h > self.alert_thresholds["error_rate_threshold"]:
                alert = f"High error rate: {metrics.error_rate_1h:.2f}%"
                alerts.append(alert)
                if alert not in self.active_alerts:
                    await self.send_alert("error_rate", alert)
                    self.active_alerts.add(alert)
            
            # Check processing time
            if metrics.average_processing_time_ms > self.alert_thresholds["processing_time_threshold"]:
                alert = f"High processing time: {metrics.average_processing_time_ms:.2f}ms"
                alerts.append(alert)
                if alert not in self.active_alerts:
                    await self.send_alert("processing_time", alert)
                    self.active_alerts.add(alert)
            
            # Check stream lag
            if metrics.stream_lag > self.alert_thresholds["stream_lag_threshold"]:
                alert = f"High stream lag: {metrics.stream_lag} messages"
                alerts.append(alert)
                if alert not in self.active_alerts:
                    await self.send_alert("stream_lag", alert)
                    self.active_alerts.add(alert)
            
            # Remove resolved alerts
            self.active_alerts = {alert for alert in self.active_alerts if alert in alerts}
            
            return alerts
            
        except Exception as e:
            logger.error(f"Failed to check alerts: {e}")
            return []

    async def send_alert(self, alert_type: str, message: str):
        """Send alert notification"""
        logger.warning(f"ALERT [{alert_type}]: {message}")
        
        # Here you would integrate with your alerting system:
        # - Send to Slack/Discord
        # - Send email
        # - Send to PagerDuty
        # - etc.


# Initialize alert manager
alert_manager = AlertManager()


@monitoring_router.get("/alerts")
async def get_active_alerts():
    """Get currently active alerts"""
    alerts = await alert_manager.check_alerts()
    return {
        "active_alerts": list(alerts),
        "timestamp": datetime.utcnow().isoformat()
    }
