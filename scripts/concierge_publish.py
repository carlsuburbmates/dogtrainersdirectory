#!/usr/bin/env python3
"""
Canonical scaffolded publish path for Phase 17 / CS-1004.

Reads the concierge mapping artifact, publishes only mapping-ready candidates,
and inserts scaffolded/unclaimed listings into the live directory with
encryption-aware contact handling.

No AI sourcing, no blind discovery, and no claim mutation.
"""
from __future__ import annotations

import argparse
import json
import os
import ssl
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAPPING_JSON = REPO_ROOT / "qa_artifacts" / "concierge" / "concierge_mapping_artifact.json"
DEFAULT_REPORT_JSON = REPO_ROOT / "qa_artifacts" / "concierge" / "concierge_publish_report.json"


@dataclass(frozen=True)
class PreparedPublishCandidate:
    input_row_index: int
    source_url: str
    business_name_hint: str
    businesses_payload: dict[str, Any]
    contact_evidence: dict[str, Any]
    sensitive_contact_payload: dict[str, Any]
    trainer_specializations_rows: list[dict[str, Any]]
    trainer_services_rows: list[dict[str, Any]]
    trainer_behavior_issues_rows: list[dict[str, Any]]


class SupabaseRestPublisher:
    def __init__(self) -> None:
        supabase_url = (os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
        service_role_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
        encrypt_key = os.environ.get("SUPABASE_PGCRYPTO_KEY") or ""
        if not supabase_url or not service_role_key:
            raise SystemExit(
                "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for concierge publish apply mode"
            )
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key
        self.encrypt_key = encrypt_key
        self.context = ssl.create_default_context()

    def _request(
        self,
        method: str,
        path: str,
        *,
        payload: Any | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        headers = {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Accept": "application/json",
        }
        body = None
        if payload is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(payload).encode("utf-8")
        if extra_headers:
            headers.update(extra_headers)

        request = Request(f"{self.supabase_url}{path}", data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=20, context=self.context) as response:
                raw = response.read().decode("utf-8")
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"{method} {path} failed: HTTP {exc.code} {exc.reason}: {detail}") from exc
        except URLError as exc:
            raise RuntimeError(f"{method} {path} failed: URLError: {exc.reason}") from exc

        if not raw:
            return None
        return json.loads(raw)

    def encrypt_sensitive(self, value: str) -> str:
        if not self.encrypt_key:
            raise RuntimeError("SUPABASE_PGCRYPTO_KEY is required to encrypt concierge contact fields")
        payload = {
            "p_input": value,
            "p_key": self.encrypt_key,
        }
        data = self._request("POST", "/rest/v1/rpc/encrypt_sensitive", payload=payload)
        if not isinstance(data, str) or not data:
            raise RuntimeError("encrypt_sensitive returned no encrypted value")
        return data

    def insert_business(self, payload: dict[str, Any]) -> int:
        data = self._request(
            "POST",
            "/rest/v1/businesses?select=id",
            payload=payload,
            extra_headers={"Prefer": "return=representation"},
        )
        if not isinstance(data, list) or not data or "id" not in data[0]:
            raise RuntimeError("business insert returned no id")
        return int(data[0]["id"])

    def insert_rows(self, table: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        self._request(
            "POST",
            f"/rest/v1/{table}",
            payload=rows,
            extra_headers={"Prefer": "return=minimal"},
        )

    def delete_business(self, business_id: int) -> None:
        query = urlencode({"id": f"eq.{business_id}"})
        self._request(
            "DELETE",
            f"/rest/v1/businesses?{query}",
            extra_headers={"Prefer": "return=minimal"},
        )


def load_mapping_artifact(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"Mapping artifact not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "records" not in data:
        raise SystemExit(f"Mapping artifact is malformed: {path}")
    return data


def prepare_publish_candidate(record: dict[str, Any]) -> PreparedPublishCandidate:
    businesses_payload = dict(record.get("businesses_payload") or {})
    contact_evidence = dict(record.get("contact_evidence") or {})
    sensitive_contact_payload = dict(record.get("sensitive_contact_payload") or {})
    trainer_specializations_rows = list(record.get("trainer_specializations_rows") or [])
    trainer_services_rows = list(record.get("trainer_services_rows") or [])
    trainer_behavior_issues_rows = list(record.get("trainer_behavior_issues_rows") or [])

    errors: list[str] = []
    if record.get("mapping_status") != "mapping_ready":
        errors.append(f"mapping_status is {record.get('mapping_status')}, not mapping_ready")
    if not businesses_payload.get("name"):
        errors.append("businesses_payload.name is required")
    if businesses_payload.get("suburb_id") in (None, ""):
        errors.append("businesses_payload.suburb_id is required")
    if businesses_payload.get("resource_type") == "trainer" and not trainer_specializations_rows:
        errors.append("trainer publish candidate requires at least one specialization row")
    if any(key in businesses_payload for key in ("phone", "email")):
        errors.append("businesses_payload must not carry plaintext phone/email for publish")
    if sensitive_contact_payload.get("requires_encryption") and not (
        contact_evidence.get("phone_plaintext") or contact_evidence.get("email_plaintext")
    ):
        errors.append("sensitive contact payload requires encryption but no plaintext contact evidence is present")

    if errors:
        raise ValueError("; ".join(errors))

    return PreparedPublishCandidate(
        input_row_index=int(record["input_row_index"]),
        source_url=str(record["source_url"]),
        business_name_hint=str(record["business_name_hint"]),
        businesses_payload=businesses_payload,
        contact_evidence=contact_evidence,
        sensitive_contact_payload=sensitive_contact_payload,
        trainer_specializations_rows=trainer_specializations_rows,
        trainer_services_rows=trainer_services_rows,
        trainer_behavior_issues_rows=trainer_behavior_issues_rows,
    )


def build_business_insert_payload(
    candidate: PreparedPublishCandidate,
    *,
    encrypted_phone: str | None,
    encrypted_email: str | None,
) -> dict[str, Any]:
    return {
        "profile_id": None,
        "name": candidate.businesses_payload["name"],
        "phone": None,
        "email": None,
        "website": candidate.businesses_payload.get("website"),
        "address": candidate.businesses_payload.get("address"),
        "suburb_id": candidate.businesses_payload["suburb_id"],
        "bio": candidate.businesses_payload.get("bio"),
        "pricing": None,
        "abn": None,
        "abn_verified": False,
        "verification_status": "pending",
        "resource_type": candidate.businesses_payload["resource_type"],
        "phone_encrypted": encrypted_phone,
        "email_encrypted": encrypted_email,
        "abn_encrypted": None,
        "is_scaffolded": True,
        "is_claimed": False,
        "service_type_primary": candidate.businesses_payload.get("service_type_primary"),
    }


def build_relation_rows(table: str, business_id: int, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    relation_key = {
        "trainer_specializations": "age_specialty",
        "trainer_services": "service_type",
        "trainer_behavior_issues": "behavior_issue",
    }[table]
    shaped: list[dict[str, Any]] = []
    for row in rows:
        shaped_row = {"business_id": business_id, relation_key: row[relation_key]}
        if table == "trainer_services":
            shaped_row["is_primary"] = bool(row.get("is_primary", False))
        shaped.append(shaped_row)
    return shaped


def publish_mapping_artifact(
    artifact: dict[str, Any],
    *,
    apply: bool,
    publisher: SupabaseRestPublisher | Any | None = None,
) -> dict[str, Any]:
    inventory_status = ((artifact.get("inventory_duplicate_check") or {}).get("status")) or "unknown"
    results: list[dict[str, Any]] = []
    published = 0
    skipped = 0
    failed = 0
    dry_run_ready = 0

    if apply and publisher is None:
        publisher = SupabaseRestPublisher()

    for record in artifact.get("records", []):
        input_row_index = int(record["input_row_index"])
        if record.get("mapping_status") != "mapping_ready":
            skipped += 1
            results.append(
                {
                    "input_row_index": input_row_index,
                    "source_url": record.get("source_url", ""),
                    "mapping_status": record.get("mapping_status"),
                    "publish_action": "skipped_non_ready",
                    "business_id": None,
                    "reasons": list(record.get("mapping_blockers") or record.get("mapping_warnings") or []),
                }
            )
            continue

        try:
            candidate = prepare_publish_candidate(record)
        except ValueError as exc:
            failed += 1
            results.append(
                {
                    "input_row_index": input_row_index,
                    "source_url": record.get("source_url", ""),
                    "mapping_status": record.get("mapping_status"),
                    "publish_action": "failed_validation",
                    "business_id": None,
                    "reasons": [str(exc)],
                }
            )
            continue

        if inventory_status != "available":
            failed += 1
            results.append(
                {
                    "input_row_index": input_row_index,
                    "source_url": candidate.source_url,
                    "mapping_status": record.get("mapping_status"),
                    "publish_action": "failed_validation",
                    "business_id": None,
                    "reasons": ["inventory duplicate coverage is not available in the mapping artifact"],
                }
            )
            continue

        if not apply:
            dry_run_ready += 1
            results.append(
                {
                    "input_row_index": input_row_index,
                    "source_url": candidate.source_url,
                    "mapping_status": record.get("mapping_status"),
                    "publish_action": "dry_run_ready",
                    "business_id": None,
                    "reasons": [],
                    "business_insert_preview": build_business_insert_payload(
                        candidate,
                        encrypted_phone="ENCRYPT_ON_APPLY" if candidate.contact_evidence.get("phone_plaintext") else None,
                        encrypted_email="ENCRYPT_ON_APPLY" if candidate.contact_evidence.get("email_plaintext") else None,
                    ),
                }
            )
            continue

        business_id: int | None = None
        try:
            encrypted_phone = (
                publisher.encrypt_sensitive(candidate.contact_evidence["phone_plaintext"])
                if candidate.contact_evidence.get("phone_plaintext")
                else None
            )
            encrypted_email = (
                publisher.encrypt_sensitive(candidate.contact_evidence["email_plaintext"])
                if candidate.contact_evidence.get("email_plaintext")
                else None
            )
            business_payload = build_business_insert_payload(
                candidate,
                encrypted_phone=encrypted_phone,
                encrypted_email=encrypted_email,
            )
            business_id = publisher.insert_business(business_payload)
            publisher.insert_rows(
                "trainer_specializations",
                build_relation_rows("trainer_specializations", business_id, candidate.trainer_specializations_rows),
            )
            publisher.insert_rows(
                "trainer_services",
                build_relation_rows("trainer_services", business_id, candidate.trainer_services_rows),
            )
            publisher.insert_rows(
                "trainer_behavior_issues",
                build_relation_rows("trainer_behavior_issues", business_id, candidate.trainer_behavior_issues_rows),
            )
        except Exception as exc:
            if business_id is not None:
                try:
                    publisher.delete_business(business_id)
                except Exception as rollback_exc:
                    failed += 1
                    results.append(
                        {
                            "input_row_index": input_row_index,
                            "source_url": candidate.source_url,
                            "mapping_status": record.get("mapping_status"),
                            "publish_action": "failed_with_partial_rollback",
                            "business_id": business_id,
                            "reasons": [str(exc), f"rollback failed: {rollback_exc}"],
                        }
                    )
                    continue
            failed += 1
            results.append(
                {
                    "input_row_index": input_row_index,
                    "source_url": candidate.source_url,
                    "mapping_status": record.get("mapping_status"),
                    "publish_action": "failed",
                    "business_id": None,
                    "reasons": [str(exc)],
                }
            )
            continue

        published += 1
        results.append(
            {
                "input_row_index": input_row_index,
                "source_url": candidate.source_url,
                "mapping_status": record.get("mapping_status"),
                "publish_action": "published",
                "business_id": business_id,
                "reasons": [],
                "claim_state": {
                    "profile_id": None,
                    "is_scaffolded": True,
                    "is_claimed": False,
                    "verification_status": "pending",
                    "abn_verified": False,
                },
            }
        )

    return {
        "pipeline": "concierge_scaffolded_publish",
        "phase": "17",
        "task": "CS-1004",
        "generated_at": datetime.now().astimezone().isoformat(),
        "apply_mode": apply,
        "input_mapping_artifact_inventory_status": inventory_status,
        "counts": {
            "published": published,
            "skipped_non_ready": skipped,
            "failed": failed,
            "dry_run_ready": dry_run_ready,
            "total": len(artifact.get("records", [])),
        },
        "records": results,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Publish mapping-ready concierge candidates as scaffolded listings.")
    parser.add_argument("--mapping-json", type=Path, default=DEFAULT_MAPPING_JSON, help="Concierge mapping artifact JSON path")
    parser.add_argument("--report-json", type=Path, default=DEFAULT_REPORT_JSON, help="Publish report JSON path")
    parser.add_argument("--apply", action="store_true", help="Apply live inserts instead of producing a dry-run report")
    args = parser.parse_args(argv)

    artifact = load_mapping_artifact(args.mapping_json)
    report = publish_mapping_artifact(artifact, apply=args.apply)
    args.report_json.parent.mkdir(parents=True, exist_ok=True)
    args.report_json.write_text(json.dumps(report, indent=2, ensure_ascii=True, sort_keys=False), encoding="utf-8")
    print(f"Wrote concierge publish report: {args.report_json}")
    print(
        "Counts: "
        f"published={report['counts']['published']} "
        f"skipped_non_ready={report['counts']['skipped_non_ready']} "
        f"failed={report['counts']['failed']} "
        f"dry_run_ready={report['counts']['dry_run_ready']} "
        f"total={report['counts']['total']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
