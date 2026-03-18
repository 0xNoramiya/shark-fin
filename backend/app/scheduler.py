"""APScheduler-based job scheduler for periodic collection runs.

Orchestrates collectors → classifier → scorer → dedup → DB persistence.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.classifier.dedup import content_hash
from app.classifier.patterns import EntityType, PatternScanner
from app.classifier.scorer import RiskScorer
from app.database import async_session
from app.models.threat import SourceType, Threat

logger = logging.getLogger(__name__)

scanner = PatternScanner()
scorer = RiskScorer()
scheduler = AsyncIOScheduler()

# Map collector source_type strings to ORM enum
_SOURCE_MAP: dict[str, SourceType] = {
    "TELEGRAM": SourceType.TELEGRAM,
    "PASTE": SourceType.PASTE,
    "GITHUB": SourceType.GITHUB,
    "HIBP": SourceType.HIBP,
    "GOOGLE_DORK": SourceType.GOOGLE_DORK,
}


async def _process_intel(
    source_type_str: str,
    source_url: str,
    content: str,
    posted_at: object,
    metadata: dict,
) -> None:
    """Classify, score, deduplicate, and persist a single intel item."""
    # Dedup check
    h = content_hash(content)

    async with async_session() as session:
        exists = await session.scalar(
            select(Threat.id).where(Threat.content_hash == h)
        )
        if exists:
            return

        # Classify
        entities = scanner.scan(content)
        if not entities:
            return

        # Score
        risk = scorer.score(
            entities,
            record_count=len(entities),
            posted_at=posted_at if hasattr(posted_at, "tzinfo") else None,
            source_label=source_type_str.lower(),
        )

        # Extract institution tags from detected bank names
        institution_tags = list({
            e.matched_value.upper()
            for e in entities
            if e.pattern_type == EntityType.BANK_NAME
        }) or None

        # Map to ORM severity enum (from models, not scorer)
        from app.models.threat import Severity as ModelSeverity
        severity_map = {
            "LOW": ModelSeverity.LOW,
            "MEDIUM": ModelSeverity.MEDIUM,
            "HIGH": ModelSeverity.HIGH,
            "CRITICAL": ModelSeverity.CRITICAL,
        }

        from app.models.threat import mask_sensitive
        preview = mask_sensitive(content)

        threat = Threat(
            source_type=_SOURCE_MAP.get(source_type_str, SourceType.PASTE),
            source_url=source_url,
            raw_content=content,
            content_preview=preview,
            detected_entities={
                "entities": [e.to_dict() for e in entities],
                "count": len(entities),
            },
            content_hash=h,
            risk_score=risk.score,
            severity=severity_map[risk.severity.value],
            institution_tags=institution_tags,
        )
        session.add(threat)
        await session.commit()
        logger.info(
            "Saved threat score=%d severity=%s from %s",
            risk.score, risk.severity.value, source_url,
        )


async def run_telegram_collector() -> None:
    """Execute the Telegram collector pipeline."""
    from app.collectors.telegram import TelegramCollector

    collector = TelegramCollector()
    try:
        async for intel in collector.collect():
            await _process_intel(
                intel.source_type,
                intel.source_url,
                intel.content,
                intel.posted_at,
                intel.metadata,
            )
    except Exception:
        logger.exception("Telegram collector failed")
    finally:
        await collector.disconnect()


async def run_paste_collector() -> None:
    """Execute the paste site collector pipeline."""
    from app.collectors.pastesite import PasteSiteCollector

    collector = PasteSiteCollector()
    try:
        async for intel in collector.collect():
            await _process_intel(
                intel.source_type,
                intel.source_url,
                intel.content,
                intel.posted_at,
                intel.metadata,
            )
    except Exception:
        logger.exception("Paste site collector failed")


async def run_github_collector() -> None:
    """Execute the GitHub collector pipeline."""
    from app.collectors.github import GitHubCollector

    collector = GitHubCollector()
    try:
        async for intel in collector.collect():
            await _process_intel(
                intel.source_type,
                intel.source_url,
                intel.content,
                intel.posted_at,
                intel.metadata,
            )
    except Exception:
        logger.exception("GitHub collector failed")


async def run_google_dork_collector() -> None:
    """Execute the Google Dork collector pipeline."""
    from app.collectors.google_dork import GoogleDorkCollector

    collector = GoogleDorkCollector()
    try:
        async for intel in collector.collect():
            await _process_intel(
                intel.source_type,
                intel.source_url,
                intel.content,
                intel.posted_at,
                intel.metadata,
            )
    except Exception:
        logger.exception("Google Dork collector failed")


def start_scheduler() -> None:
    """Register jobs and start the scheduler."""
    from app.config import settings

    scheduler.add_job(
        run_telegram_collector, "interval", minutes=5, id="telegram_collect",
    )
    scheduler.add_job(
        run_paste_collector, "interval", minutes=15, id="paste_collect",
    )
    scheduler.add_job(
        run_github_collector, "interval",
        seconds=settings.GITHUB_POLL_INTERVAL, id="github_collect",
    )
    scheduler.add_job(
        run_google_dork_collector, "interval",
        seconds=settings.GOOGLE_DORK_INTERVAL, id="google_dork_collect",
    )
    scheduler.start()
    logger.info(
        "Scheduler started: telegram (5m), paste (15m), github (%ds), google_dork (%ds)",
        settings.GITHUB_POLL_INTERVAL, settings.GOOGLE_DORK_INTERVAL,
    )


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    scheduler.shutdown(wait=False)
