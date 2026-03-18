"""Alert / webhook dispatch endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/alerts", tags=["alerts"])


class WebhookPayload(BaseModel):
    """Incoming webhook registration or test payload."""
    url: str
    secret: str | None = None


@router.post("/webhook")
async def register_webhook(payload: WebhookPayload) -> dict:
    """Register or test a webhook endpoint for alert delivery."""
    # TODO: Persist webhook config and send test ping
    return {"status": "registered", "url": payload.url}
