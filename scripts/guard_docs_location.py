#!/usr/bin/env python3
"""
Guardrail: prevent documentation from being stored in the app repo.

Docs live in the sibling repo: ../dtd-docs-private/DOCS
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

DOCS_ROOT = REPO_ROOT / "DOCS"
ALLOWED_DOCS_PATHS = {
    DOCS_ROOT / "SSOT",
}

FORBIDDEN_PATHS = [
    REPO_ROOT / "assessment",
    REPO_ROOT / "blueprint_handoff.zip",
    REPO_ROOT / "IMPLEMENTATION_SUMMARY.md",
    REPO_ROOT / "PHASE5_MERGE_PLAN.md",
    REPO_ROOT / "WEEK4_ERROR_FIXES.md",
    REPO_ROOT / "WEEK4_IMPLEMENTATION_SUMMARY.md",
]


def main() -> int:
    docs_repo_hint = os.environ.get("DTD_DOCS_DIR") or "../dtd-docs-private/DOCS"
    existing = [p for p in FORBIDDEN_PATHS if p.exists()]

    if DOCS_ROOT.exists():
        non_ssot = [
            p for p in DOCS_ROOT.iterdir()
            if p not in ALLOWED_DOCS_PATHS
        ]
        if non_ssot:
            existing.append(DOCS_ROOT)
    if not existing:
        return 0

    print("ERROR: Documentation content detected inside the app repo.", file=sys.stderr)
    print("Move docs into the docs repo (sibling):", file=sys.stderr)
    print(f"  {docs_repo_hint}", file=sys.stderr)
    print("\nForbidden paths found:", file=sys.stderr)
    for p in existing:
        print(f"  - {p.relative_to(REPO_ROOT)}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
