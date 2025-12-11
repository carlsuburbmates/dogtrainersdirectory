#!/usr/bin/env python3
"""Doc Divergence Detector – enforces SSOT/archived banners across documentation."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CANONICAL_DOCS = [
    "README.md",
    "README_DEVELOPMENT.md",
    "DOCS/blueprint_ssot_v1.1.md",
    "DOCS/PLAN_REVIEW.md",
    "DOCS/FRONTEND_VERIFICATION_FINDINGS.md",
    "DOCS/MONETIZATION_ROLLOUT_PLAN.md",
    "DOCS/automation/ABN-ABR-GUID_automation/ABR-ABN-Lookup.md",
    "DOCS/automation/ABN-ABR-GUID_automation/ABN-Rollout-Checklist.md",
    "DOCS/automation/ABN-ABR-GUID_automation/ABN-Release-Notes.md",
]

ARCHIVED_DOCS = [
    "DOCS/_legacy_conflicts/FILE_MANIFEST.md",
    "DOCS/_legacy_conflicts/FRONTEND_IMPLEMENTATION_GAP_ANALYSIS.md",
    "DOCS/_legacy_conflicts/webhook_README_DTD.md",
    "DOCS/_legacy_conflicts/README_STRIPE_WEBHOOK.md",
]

SSOT_MARKER = "SSOT – Canonical Source of Truth"
ARCHIVE_MARKER = "ARCHIVED / CONFLICTING DOCUMENT"
OPT_OUT_MARKER = "<!-- DOCS_DIVERGENCE_IGNORE: supporting index or changelog -->"


def read_text(rel_path: str) -> str:
    path = ROOT / rel_path
    return path.read_text(encoding="utf-8")


def ensure_contains(paths: list[str], marker: str, label: str) -> list[str]:
    missing: list[str] = []
    for rel in paths:
        file_path = ROOT / rel
        if not file_path.exists():
            continue
        content = read_text(rel)
        if marker not in content:
            missing.append(rel)
    if missing:
        print(f"::error ::{label} documents missing required marker '{marker}':")
        for rel in missing:
            print(f"  - {rel}")
    return missing


def get_modified_docs(base_ref: str) -> list[str]:
    try:
        diff_output = subprocess.check_output(
            ["git", "diff", "--name-only", f"{base_ref}...HEAD"],
            cwd=ROOT,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        print("::error ::Failed to compute git diff for doc divergence checks")
        print(exc)
        sys.exit(1)
    modified = []
    for line in diff_output.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("DOCS/") and line.endswith(".md"):
            modified.append(line)
    return modified


def ensure_modified_docs_have_marker(modified_docs: list[str]) -> list[str]:
    missing: list[str] = []
    for rel in modified_docs:
        if rel in CANONICAL_DOCS or rel in ARCHIVED_DOCS:
            continue
        file_path = ROOT / rel
        if not file_path.exists():
            continue
        content = read_text(rel)
        if (
            SSOT_MARKER not in content
            and ARCHIVE_MARKER not in content
            and OPT_OUT_MARKER not in content
        ):
            missing.append(rel)
    if missing:
        print(
            "::error ::New/modified DOCS markdown files must include an SSOT badge, "
            "archive banner, or the explicit opt-out comment."
        )
        for rel in missing:
            print(f"  - {rel}")
    return missing


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate documentation divergence markers.")
    parser.add_argument(
        "--base-ref",
        default="origin/main",
        help="Git base reference to diff against (default: origin/main)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    failed: list[str] = []

    failed += ensure_contains(CANONICAL_DOCS, SSOT_MARKER, "Canonical")
    failed += ensure_contains(ARCHIVED_DOCS, ARCHIVE_MARKER, "Archived")

    modified_docs = get_modified_docs(args.base_ref)
    failed += ensure_modified_docs_have_marker(modified_docs)

    if failed:
        return 1
    print("Doc Divergence Detector: all checks passed ✅")
    return 0


if __name__ == "__main__":
    sys.exit(main())
