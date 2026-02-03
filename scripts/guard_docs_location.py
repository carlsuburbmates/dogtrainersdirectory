#!/usr/bin/env python3
"""
Guardrail: keep documentation canonical in DOCS/SSOT and keep pointer-only docs minimal.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

DOCS_ROOT = REPO_ROOT / "DOCS"
ALLOWED_DOCS_PATHS = {DOCS_ROOT / "SSOT"}

FORBIDDEN_PATHS = [
    REPO_ROOT / "assessment",
    REPO_ROOT / "blueprint_handoff.zip",
    REPO_ROOT / "IMPLEMENTATION_SUMMARY.md",
    REPO_ROOT / "PHASE5_MERGE_PLAN.md",
    REPO_ROOT / "WEEK4_ERROR_FIXES.md",
    REPO_ROOT / "WEEK4_IMPLEMENTATION_SUMMARY.md",
]

POINTER_ONLY_FILES = {
    REPO_ROOT / "README.md": {"Quick Start", "Authoritative Docs"},
    REPO_ROOT / "README_DEVELOPMENT.md": {"Quick Start", "Where to look"},
    REPO_ROOT / "supabase" / "LOCAL_SETUP.md": {"Where to look"},
}

FORBIDDEN_POINTER_TOKENS = {
    "dtd-docs-private",
}


def check_pointer_only(file_path: Path, allowed_headings: set[str]) -> list[str]:
    if not file_path.exists():
        return []
    errors: list[str] = []
    content = file_path.read_text(encoding="utf-8").splitlines()

    for idx, line in enumerate(content, start=1):
        if any(token in line for token in FORBIDDEN_POINTER_TOKENS):
            errors.append(f"{file_path.relative_to(REPO_ROOT)}:{idx} contains forbidden token")
        if line.startswith("### "):
            errors.append(f"{file_path.relative_to(REPO_ROOT)}:{idx} uses a disallowed heading level (###)")
        if line.startswith("## "):
            heading = line[3:].strip()
            if heading not in allowed_headings:
                errors.append(
                    f"{file_path.relative_to(REPO_ROOT)}:{idx} uses disallowed heading: '{heading}'"
                )
    return errors


def main() -> int:
    existing = [p for p in FORBIDDEN_PATHS if p.exists()]

    if DOCS_ROOT.exists():
        non_ssot = [
            p for p in DOCS_ROOT.iterdir()
            if p not in ALLOWED_DOCS_PATHS
        ]
        if non_ssot:
            existing.append(DOCS_ROOT)
    pointer_errors: list[str] = []
    for path, allowed in POINTER_ONLY_FILES.items():
        pointer_errors.extend(check_pointer_only(path, allowed))

    if not existing and not pointer_errors:
        return 0

    if existing:
        print("ERROR: Documentation content detected outside DOCS/SSOT.", file=sys.stderr)
        print("Only DOCS/SSOT is canonical in this repo.", file=sys.stderr)
        print("\nForbidden paths found:", file=sys.stderr)
        for p in existing:
            print(f"  - {p.relative_to(REPO_ROOT)}", file=sys.stderr)

    if pointer_errors:
        print("\nERROR: Pointer-only docs contain disallowed content.", file=sys.stderr)
        for err in pointer_errors:
            print(f"  - {err}", file=sys.stderr)
        print("\nFix: keep README.md, README_DEVELOPMENT.md, and supabase/LOCAL_SETUP.md as pointer-only.", file=sys.stderr)

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
