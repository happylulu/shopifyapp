"""
Rule Engine API Endpoints
FastAPI routes for rule management and testing
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Dict, Any, Optional
from datetime import datetime

from models_v2 import get_db
from rule_models import Rule, RuleExecution, RuleVersion, RuleStatus
from rule_engine import RuleManager, RuleEngine
from rule_schemas import RuleSchema, RuleValidationResult, RuleTestPayload
from api_models import BaseResponse

router = APIRouter(prefix="/rules", tags=["Rule Engine"])


# ============================================================================
# RULE MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/", response_model=BaseResponse)
async def create_rule(
    request: Request,
    rule_data: RuleSchema,
    session: AsyncSession = Depends(get_db)
):
    """Create a new rule"""
    shop_domain = request.headers.get("X-Shopify-Shop-Domain", "demo.myshopify.com")
    created_by = request.headers.get("X-User-ID", "system")
    
    try:
        rule_manager = RuleManager(session)
        rule = await rule_manager.create_rule(
            shop_domain=shop_domain,
            rule_data=rule_data.dict(),
            created_by=created_by
        )
        
        return BaseResponse(
            success=True,
            message="Rule created successfully",
            data={
                "rule_id": str(rule.id),
                "name": rule.name,
                "status": rule.status,
                "version": rule.version
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=BaseResponse)
async def list_rules(
    request: Request,
    status: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db)
):
    """List rules for a shop"""
    shop_domain = request.headers.get("X-Shopify-Shop-Domain", "demo.myshopify.com")
    
    try:
        # Build query
        query = select(Rule).where(Rule.shop_domain == shop_domain)
        
        if status:
            query = query.where(Rule.status == status)
        if event_type:
            query = query.where(Rule.event_type == event_type)
        
        query = query.order_by(Rule.priority.asc(), Rule.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        result = await session.execute(query)
        rules = result.scalars().all()
        
        rules_data = []
        for rule in rules:
            rules_data.append({
                "id": str(rule.id),
                "name": rule.name,
                "description": rule.description,
                "event_type": rule.event_type,
                "status": rule.status,
                "priority": rule.priority,
                "version": rule.version,
                "execution_count": rule.execution_count,
                "last_executed_at": rule.last_executed_at.isoformat() if rule.last_executed_at else None,
                "created_at": rule.created_at.isoformat(),
                "updated_at": rule.updated_at.isoformat() if rule.updated_at else None
            })
        
        return BaseResponse(
            success=True,
            data={
                "rules": rules_data,
                "total": len(rules_data),
                "offset": offset,
                "limit": limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{rule_id}", response_model=BaseResponse)
async def get_rule(
    rule_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Get a specific rule"""
    try:
        query = select(Rule).where(Rule.id == rule_id)
        result = await session.execute(query)
        rule = result.scalar_one_or_none()
        
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return BaseResponse(
            success=True,
            data={
                "id": str(rule.id),
                "name": rule.name,
                "description": rule.description,
                "event_type": rule.event_type,
                "status": rule.status,
                "priority": rule.priority,
                "conditions": rule.conditions,
                "actions": rule.actions,
                "version": rule.version,
                "execution_count": rule.execution_count,
                "last_executed_at": rule.last_executed_at.isoformat() if rule.last_executed_at else None,
                "created_at": rule.created_at.isoformat(),
                "updated_at": rule.updated_at.isoformat() if rule.updated_at else None,
                "created_by": rule.created_by
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{rule_id}", response_model=BaseResponse)
async def update_rule(
    rule_id: str,
    rule_data: RuleSchema,
    request: Request,
    session: AsyncSession = Depends(get_db)
):
    """Update a rule"""
    updated_by = request.headers.get("X-User-ID", "system")
    
    try:
        rule_manager = RuleManager(session)
        rule = await rule_manager.update_rule(
            rule_id=rule_id,
            rule_data=rule_data.dict(),
            updated_by=updated_by
        )
        
        return BaseResponse(
            success=True,
            message="Rule updated successfully",
            data={
                "rule_id": str(rule.id),
                "name": rule.name,
                "version": rule.version
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{rule_id}/activate", response_model=BaseResponse)
async def activate_rule(
    rule_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Activate a rule"""
    try:
        rule_manager = RuleManager(session)
        rule = await rule_manager.activate_rule(rule_id)
        
        return BaseResponse(
            success=True,
            message="Rule activated successfully",
            data={"rule_id": str(rule.id), "status": rule.status}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{rule_id}/deactivate", response_model=BaseResponse)
async def deactivate_rule(
    rule_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Deactivate a rule"""
    try:
        rule_manager = RuleManager(session)
        rule = await rule_manager.deactivate_rule(rule_id)
        
        return BaseResponse(
            success=True,
            message="Rule deactivated successfully",
            data={"rule_id": str(rule.id), "status": rule.status}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{rule_id}", response_model=BaseResponse)
async def delete_rule(
    rule_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Delete a rule (archive)"""
    try:
        rule_manager = RuleManager(session)
        success = await rule_manager.delete_rule(rule_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        return BaseResponse(
            success=True,
            message="Rule deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# RULE TESTING & VALIDATION ENDPOINTS
# ============================================================================

@router.post("/validate", response_model=BaseResponse)
async def validate_rule(
    rule_data: RuleSchema,
    session: AsyncSession = Depends(get_db)
):
    """Validate a rule without saving it"""
    try:
        rule_manager = RuleManager(session)
        validation_result = rule_manager.validate_rule(rule_data.dict())
        
        return BaseResponse(
            success=validation_result.valid,
            message="Rule validation completed",
            data={
                "valid": validation_result.valid,
                "errors": validation_result.errors,
                "warnings": validation_result.warnings
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test", response_model=BaseResponse)
async def test_rule(
    rule_data: RuleSchema,
    test_payload: RuleTestPayload,
    session: AsyncSession = Depends(get_db)
):
    """Test a rule against sample data"""
    try:
        rule_manager = RuleManager(session)
        result = await rule_manager.test_rule(
            rule_data=rule_data.dict(),
            test_payload=test_payload.event_data
        )
        
        return BaseResponse(
            success=True,
            message="Rule test completed",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# RULE EXECUTION & ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/{rule_id}/executions", response_model=BaseResponse)
async def get_rule_executions(
    rule_id: str,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db)
):
    """Get execution history for a rule"""
    try:
        query = select(RuleExecution).where(
            RuleExecution.rule_id == rule_id
        ).order_by(desc(RuleExecution.executed_at)).offset(offset).limit(limit)
        
        result = await session.execute(query)
        executions = result.scalars().all()
        
        executions_data = []
        for execution in executions:
            executions_data.append({
                "id": str(execution.id),
                "event_type": execution.event_type,
                "customer_id": execution.customer_id,
                "conditions_met": execution.conditions_met,
                "actions_executed": execution.actions_executed,
                "execution_time_ms": execution.execution_time_ms,
                "success": execution.success,
                "error_message": execution.error_message,
                "executed_at": execution.executed_at.isoformat()
            })
        
        return BaseResponse(
            success=True,
            data={
                "executions": executions_data,
                "total": len(executions_data),
                "offset": offset,
                "limit": limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{rule_id}/versions", response_model=BaseResponse)
async def get_rule_versions(
    rule_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Get version history for a rule"""
    try:
        query = select(RuleVersion).where(
            RuleVersion.rule_id == rule_id
        ).order_by(desc(RuleVersion.version_number))
        
        result = await session.execute(query)
        versions = result.scalars().all()
        
        versions_data = []
        for version in versions:
            versions_data.append({
                "id": str(version.id),
                "version_number": version.version_number,
                "name": version.name,
                "description": version.description,
                "event_type": version.event_type,
                "conditions": version.conditions,
                "actions": version.actions,
                "created_at": version.created_at.isoformat(),
                "created_by": version.created_by,
                "change_notes": version.change_notes
            })
        
        return BaseResponse(
            success=True,
            data={"versions": versions_data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EVENT PROCESSING ENDPOINT
# ============================================================================

@router.post("/process-event", response_model=BaseResponse)
async def process_event(
    request: Request,
    event_data: Dict[str, Any],
    session: AsyncSession = Depends(get_db)
):
    """Process an event through the rule engine"""
    shop_domain = request.headers.get("X-Shopify-Shop-Domain", "demo.myshopify.com")
    
    try:
        rule_engine = RuleEngine(session)
        results = await rule_engine.process_event(
            shop_domain=shop_domain,
            event_type=event_data.get("event_type"),
            event_data=event_data
        )
        
        return BaseResponse(
            success=True,
            message="Event processed successfully",
            data={
                "results": results,
                "rules_processed": len(results),
                "successful_executions": sum(1 for r in results if r.get("success", False))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
