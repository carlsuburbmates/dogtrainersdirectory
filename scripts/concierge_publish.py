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
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MAPPING_JSON = REPO_ROOT / "qa_artifacts" / "concierge" / "concierge_mapping_artifact.json"
DEFAULT_REVIEW_JSON = REPO_ROOT / "qa_artifacts" / "concierge" / "concierge_review_artifact.json"
DEFAULT_REPORT_JSON = REPO_ROOT / "qa_artifacts" / "concierge" / "concierge_publish_report.json"


@dataclass(frozen=True)
class PreparedPublishCandidate:
    input_row_index: int
    source_url: str
    business_name_hint: str
    resolved_suburb: str
    resolved_council: str
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
        connection_string = os.environ.get("SUPABASE_CONNECTION_STRING") or ""
        encrypt_key = os.environ.get("SUPABASE_PGCRYPTO_KEY") or ""
        if not supabase_url or not service_role_key or not connection_string:
            raise SystemExit(
                "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_CONNECTION_STRING are required for concierge publish apply mode"
            )
        self.supabase_url = supabase_url
        self.service_role_key = service_role_key
        self.connection_string = connection_string
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

    def resolve_live_suburb_id(self, suburb_name: str, council_name: str) -> int:
        query = urlencode(
            [
                ("select", "id,councils!inner(name)"),
                ("name", f"eq.{suburb_name}"),
                ("councils.name", f"eq.{council_name}"),
            ]
        )
        data = self._request("GET", f"/rest/v1/suburbs?{query}")
        if not isinstance(data, list):
            raise RuntimeError("live suburb resolution returned malformed response")
        if not data:
            raise RuntimeError(
                f"live suburb resolution found no match for suburb '{suburb_name}' in council '{council_name}'"
            )
        if len(data) > 1:
            raise RuntimeError(
                f"live suburb resolution found multiple matches for suburb '{suburb_name}' in council '{council_name}'"
            )
        return int(data[0]["id"])

    def publish_candidate_transaction(
        self,
        candidate: PreparedPublishCandidate,
        *,
        live_suburb_id: int,
        encrypted_phone: str | None,
        encrypted_email: str | None,
    ) -> int:
        business_payload = build_business_insert_payload(
            candidate,
            live_suburb_id=live_suburb_id,
            encrypted_phone=encrypted_phone,
            encrypted_email=encrypted_email,
        )
        sql = build_transaction_sql(candidate, business_payload)
        process = subprocess.run(
            [
                "psql",
                self.connection_string,
                "-X",
                "-q",
                "-t",
                "-A",
                "-v",
                "ON_ERROR_STOP=1",
            ],
            input=sql,
            text=True,
            capture_output=True,
            check=False,
        )
        if process.returncode != 0:
            raise RuntimeError(process.stderr.strip() or "transactional publish failed")
        business_id_text = process.stdout.strip().splitlines()[-1].strip() if process.stdout.strip() else ""
        if not business_id_text:
            raise RuntimeError("transactional publish returned no business id")
        return int(business_id_text)


def load_mapping_artifact(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"Mapping artifact not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "records" not in data:
        raise SystemExit(f"Mapping artifact is malformed: {path}")
    return data


def load_review_artifact(path: Path) -> dict[int, dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Review artifact not found: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "records" not in data:
        raise SystemExit(f"Review artifact is malformed: {path}")
    locality_lookup: dict[int, dict[str, str]] = {}
    for record in data["records"]:
        locality = record.get("locality") or {}
        locality_lookup[int(record["input_row_index"])] = {
            "resolved_suburb": str(locality.get("resolved_suburb") or ""),
            "resolved_council": str(locality.get("resolved_council") or ""),
        }
    return locality_lookup


def prepare_publish_candidate(
    record: dict[str, Any],
    *,
    locality_lookup: dict[int, dict[str, str]],
) -> PreparedPublishCandidate:
    businesses_payload = dict(record.get("businesses_payload") or {})
    contact_evidence = dict(record.get("contact_evidence") or {})
    sensitive_contact_payload = dict(record.get("sensitive_contact_payload") or {})
    trainer_specializations_rows = list(record.get("trainer_specializations_rows") or [])
    trainer_services_rows = list(record.get("trainer_services_rows") or [])
    trainer_behavior_issues_rows = list(record.get("trainer_behavior_issues_rows") or [])
    input_row_index = int(record["input_row_index"])
    locality_identity = locality_lookup.get(input_row_index) or {}
    resolved_suburb = str(locality_identity.get("resolved_suburb") or "")
    resolved_council = str(locality_identity.get("resolved_council") or "")

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
    if not resolved_suburb or not resolved_council:
        errors.append("review artifact locality identity is required for live suburb resolution")

    if errors:
        raise ValueError("; ".join(errors))

    return PreparedPublishCandidate(
        input_row_index=input_row_index,
        source_url=str(record["source_url"]),
        business_name_hint=str(record["business_name_hint"]),
        resolved_suburb=resolved_suburb,
        resolved_council=resolved_council,
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
    live_suburb_id: int,
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
        "suburb_id": live_suburb_id,
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


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def build_values_clause(rows: list[tuple[Any, ...]]) -> str:
    return ", ".join(f"({', '.join(sql_literal(value) for value in row)})" for row in rows)


def build_transaction_sql(candidate: PreparedPublishCandidate, business_payload: dict[str, Any]) -> str:
    ctes = [
        f"""inserted_business AS (
  INSERT INTO businesses (
    profile_id, name, phone, email, website, address, suburb_id, bio, pricing, abn,
    abn_verified, verification_status, resource_type, phone_encrypted, email_encrypted,
    abn_encrypted, is_scaffolded, is_claimed, service_type_primary
  ) VALUES (
    {sql_literal(business_payload['profile_id'])},
    {sql_literal(business_payload['name'])},
    {sql_literal(business_payload['phone'])},
    {sql_literal(business_payload['email'])},
    {sql_literal(business_payload['website'])},
    {sql_literal(business_payload['address'])},
    {sql_literal(business_payload['suburb_id'])},
    {sql_literal(business_payload['bio'])},
    {sql_literal(business_payload['pricing'])},
    {sql_literal(business_payload['abn'])},
    {sql_literal(business_payload['abn_verified'])},
    {sql_literal(business_payload['verification_status'])},
    {sql_literal(business_payload['resource_type'])},
    {sql_literal(business_payload['phone_encrypted'])},
    {sql_literal(business_payload['email_encrypted'])},
    {sql_literal(business_payload['abn_encrypted'])},
    {sql_literal(business_payload['is_scaffolded'])},
    {sql_literal(business_payload['is_claimed'])},
    {sql_literal(business_payload['service_type_primary'])}
  )
  RETURNING id
)"""
    ]

    if candidate.trainer_specializations_rows:
        spec_rows = [(row["age_specialty"],) for row in candidate.trainer_specializations_rows]
        ctes.append(
            f"""insert_specializations AS (
  INSERT INTO trainer_specializations (business_id, age_specialty)
  SELECT inserted_business.id, spec.age_specialty::age_specialty
  FROM inserted_business
  JOIN (VALUES {build_values_clause(spec_rows)}) AS spec(age_specialty) ON TRUE
)"""
        )

    if candidate.trainer_services_rows:
        service_rows = [(row["service_type"], bool(row.get("is_primary", False))) for row in candidate.trainer_services_rows]
        ctes.append(
            f"""insert_services AS (
  INSERT INTO trainer_services (business_id, service_type, is_primary)
  SELECT inserted_business.id, svc.service_type::service_type, svc.is_primary
  FROM inserted_business
  JOIN (VALUES {build_values_clause(service_rows)}) AS svc(service_type, is_primary) ON TRUE
)"""
        )

    if candidate.trainer_behavior_issues_rows:
        issue_rows = [(row["behavior_issue"],) for row in candidate.trainer_behavior_issues_rows]
        ctes.append(
            f"""insert_behavior_issues AS (
  INSERT INTO trainer_behavior_issues (business_id, behavior_issue)
  SELECT inserted_business.id, issue.behavior_issue::behavior_issue
  FROM inserted_business
  JOIN (VALUES {build_values_clause(issue_rows)}) AS issue(behavior_issue) ON TRUE
)"""
        )

    return (
        "BEGIN;\nWITH\n"
        + ",\n".join(ctes)
        + "\nSELECT id FROM inserted_business;\nCOMMIT;\n"
    )


def publish_mapping_artifact(
    artifact: dict[str, Any],
    *,
    apply: bool,
    locality_lookup: dict[int, dict[str, str]],
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
            candidate = prepare_publish_candidate(record, locality_lookup=locality_lookup)
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
                        live_suburb_id=-1,
                        encrypted_phone="ENCRYPT_ON_APPLY" if candidate.contact_evidence.get("phone_plaintext") else None,
                        encrypted_email="ENCRYPT_ON_APPLY" if candidate.contact_evidence.get("email_plaintext") else None,
                    ),
                    "locality_resolution_preview": {
                        "resolved_suburb": candidate.resolved_suburb,
                        "resolved_council": candidate.resolved_council,
                        "artifact_suburb_id": candidate.businesses_payload["suburb_id"],
                        "live_suburb_id": "RESOLVE_ON_APPLY",
                    },
                }
            )
            continue

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
            live_suburb_id = publisher.resolve_live_suburb_id(candidate.resolved_suburb, candidate.resolved_council)
            business_payload = build_business_insert_payload(
                candidate,
                live_suburb_id=live_suburb_id,
                encrypted_phone=encrypted_phone,
                encrypted_email=encrypted_email,
            )
            business_id = publisher.publish_candidate_transaction(
                candidate,
                live_suburb_id=live_suburb_id,
                encrypted_phone=encrypted_phone,
                encrypted_email=encrypted_email,
            )
        except Exception as exc:
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
                "locality_resolution": {
                    "resolved_suburb": candidate.resolved_suburb,
                    "resolved_council": candidate.resolved_council,
                    "artifact_suburb_id": candidate.businesses_payload["suburb_id"],
                    "live_suburb_id": business_payload["suburb_id"],
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
    parser.add_argument("--review-json", type=Path, default=DEFAULT_REVIEW_JSON, help="Concierge review artifact JSON path")
    parser.add_argument("--report-json", type=Path, default=DEFAULT_REPORT_JSON, help="Publish report JSON path")
    parser.add_argument("--apply", action="store_true", help="Apply live inserts instead of producing a dry-run report")
    args = parser.parse_args(argv)

    artifact = load_mapping_artifact(args.mapping_json)
    locality_lookup = load_review_artifact(args.review_json)
    report = publish_mapping_artifact(artifact, apply=args.apply, locality_lookup=locality_lookup)
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
