"""Webhook subscription management endpoints."""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.middleware.auth import require_api_key
from app.models.webhook import WebhookSubscription

router = APIRouter(prefix="/alerts", tags=["alerts"])


# ── Schemas ──


class WebhookRegisterRequest(BaseModel):
    """Request body for webhook registration."""
    url: str
    institution: str
    min_severity: str = "HIGH"
    api_key: str


class WebhookResponse(BaseModel):
    """Webhook subscription response (api_key masked)."""
    id: uuid.UUID
    url: str
    institution: str
    min_severity: str
    active: bool

    model_config = {"from_attributes": True}


class WebhookRegisterResponse(BaseModel):
    subscription_id: uuid.UUID
    message: str


# ── Endpoints ──


@router.post(
    "/webhook/register",
    response_model=WebhookRegisterResponse,
    dependencies=[Depends(require_api_key)],
)
async def register_webhook(
    body: WebhookRegisterRequest,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Register a webhook endpoint for alert delivery."""
    sub = WebhookSubscription(
        url=body.url,
        institution=body.institution,
        min_severity=body.min_severity.upper(),
        api_key=body.api_key,
    )
    session.add(sub)
    await session.commit()
    await session.refresh(sub)

    return {
        "subscription_id": sub.id,
        "message": "Webhook terdaftar",
    }


@router.get(
    "/webhook/subscriptions",
    response_model=List[WebhookResponse],
    dependencies=[Depends(require_api_key)],
)
async def list_webhooks(
    session: AsyncSession = Depends(get_session),
) -> list:
    """List all active webhook subscriptions."""
    stmt = select(WebhookSubscription).where(
        WebhookSubscription.active == True
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.delete(
    "/webhook/{subscription_id}",
    dependencies=[Depends(require_api_key)],
)
async def delete_webhook(
    subscription_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Deactivate a webhook subscription."""
    sub = await session.get(WebhookSubscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Webhook not found")

    sub.active = False
    await session.commit()
    return {"message": "Webhook dihapus", "id": str(subscription_id)}
