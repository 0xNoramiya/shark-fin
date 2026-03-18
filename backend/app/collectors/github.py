"""GitHub public repository scanner for leaked credentials."""

from typing import AsyncIterator

from app.collectors.base import BaseCollector, RawIntel


class GitHubCollector(BaseCollector):
    """Search GitHub code search API for Indonesian financial data leaks."""

    async def collect(self) -> AsyncIterator[RawIntel]:
        # TODO: Use PyGithub with settings.GITHUB_TOKEN
        # TODO: Search for Indonesian financial keywords / patterns
        # TODO: Yield RawIntel for matching code snippets
        return  # type: ignore[return-value]
        yield
