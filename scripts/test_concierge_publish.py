#!/usr/bin/env python3
"""Focused verification for the Phase 17 concierge scaffolded publish path."""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import concierge_publish  # noqa: E402


class FakePublisher:
    def __init__(self) -> None:
        self.encrypted_inputs: list[str] = []
        self.business_payloads: list[dict[str, object]] = []
        self.inserted_rows: dict[str, list[dict[str, object]]] = {}
        self.deleted_business_ids: list[int] = []
        self._next_business_id = 501

    def encrypt_sensitive(self, value: str) -> str:
        self.encrypted_inputs.append(value)
        return f"enc::{value}"

    def insert_business(self, payload: dict[str, object]) -> int:
        self.business_payloads.append(payload)
        business_id = self._next_business_id
        self._next_business_id += 1
        return business_id

    def insert_rows(self, table: str, rows: list[dict[str, object]]) -> None:
        self.inserted_rows.setdefault(table, []).extend(rows)

    def delete_business(self, business_id: int) -> None:
        self.deleted_business_ids.append(business_id)


def make_mapping_record(
    *,
    index: int,
    mapping_status: str = "mapping_ready",
    business_name: str = "Example Trainer",
    suburb_id: int = 15,
    phone: str | None = "0400 111 111",
    email: str | None = "hello@example.com",
) -> dict[str, object]:
    return {
        "input_row_index": index,
        "source_url": f"https://example.com/{index}",
        "business_name_hint": business_name,
        "duplicate_assessment": {
            "status": "no_duplicate_concern",
            "matched_rows": [],
            "matched_inventory_ids": [],
            "signals": [],
            "warnings": [],
        },
        "mapping_status": mapping_status,
        "mapping_blockers": [] if mapping_status == "mapping_ready" else ["manual review required"],
        "mapping_warnings": [],
        "businesses_payload": {
            "name": business_name,
            "website": f"https://example.com/{index}",
            "address": "123 Example St",
            "suburb_id": suburb_id,
            "bio": "Structured concierge seed listing.",
            "resource_type": "trainer",
            "service_type_primary": "private_training",
        },
        "contact_evidence": {
            "website": f"https://example.com/{index}",
            "phone_plaintext": phone,
            "email_plaintext": email,
            "address": "123 Example St",
        },
        "sensitive_contact_payload": {
            "phone_encrypted_source": "contact_evidence.phone_plaintext" if phone else None,
            "email_encrypted_source": "contact_evidence.email_plaintext" if email else None,
            "requires_encryption": bool(phone or email),
        },
        "trainer_specializations_rows": [{"age_specialty": "adult_18m_7y"}],
        "trainer_services_rows": [{"service_type": "private_training", "is_primary": True}],
        "trainer_behavior_issues_rows": [{"behavior_issue": "anxiety_general"}],
    }


def make_mapping_artifact(*records: dict[str, object], inventory_status: str = "available") -> dict[str, object]:
    return {
        "pipeline": "concierge_seed_pipeline",
        "phase": "17",
        "task": "CS-1003",
        "generated_at": None,
        "input_csv": str(REPO_ROOT / "data" / "concierge_seed_queue_inner_melbourne_pilot_19.csv"),
        "inventory_duplicate_check": {
            "source": "supabase_rpc:search_trainers",
            "status": inventory_status,
            "record_count": 4,
            "contact_signals_decrypted": True,
            "warning": "" if inventory_status == "available" else "inventory duplicate coverage unavailable",
        },
        "records": list(records),
    }


def test_only_mapping_ready_candidates_publish():
    artifact = make_mapping_artifact(
        make_mapping_record(index=1, mapping_status="mapping_ready"),
        make_mapping_record(index=2, mapping_status="needs_review"),
    )
    publisher = FakePublisher()

    report = concierge_publish.publish_mapping_artifact(artifact, apply=True, publisher=publisher)

    assert report["counts"] == {
        "published": 1,
        "skipped_non_ready": 1,
        "failed": 0,
        "dry_run_ready": 0,
        "total": 2,
    }
    assert len(publisher.business_payloads) == 1
    assert report["records"][0]["publish_action"] == "published"
    assert report["records"][1]["publish_action"] == "skipped_non_ready"


def test_published_rows_remain_scaffolded_and_unclaimed_with_encrypted_contacts():
    artifact = make_mapping_artifact(make_mapping_record(index=1))
    publisher = FakePublisher()

    report = concierge_publish.publish_mapping_artifact(artifact, apply=True, publisher=publisher)

    business_payload = publisher.business_payloads[0]
    assert business_payload["profile_id"] is None
    assert business_payload["is_scaffolded"] is True
    assert business_payload["is_claimed"] is False
    assert business_payload["verification_status"] == "pending"
    assert business_payload["abn_verified"] is False
    assert business_payload["phone"] is None
    assert business_payload["email"] is None
    assert business_payload["phone_encrypted"] == "enc::0400 111 111"
    assert business_payload["email_encrypted"] == "enc::hello@example.com"
    assert publisher.encrypted_inputs == ["0400 111 111", "hello@example.com"]
    assert report["records"][0]["claim_state"] == {
        "profile_id": None,
        "is_scaffolded": True,
        "is_claimed": False,
        "verification_status": "pending",
        "abn_verified": False,
    }


def test_linked_trainer_rows_insert_with_business_id():
    artifact = make_mapping_artifact(make_mapping_record(index=1))
    publisher = FakePublisher()

    concierge_publish.publish_mapping_artifact(artifact, apply=True, publisher=publisher)

    assert publisher.inserted_rows["trainer_specializations"] == [
        {"business_id": 501, "age_specialty": "adult_18m_7y"}
    ]
    assert publisher.inserted_rows["trainer_services"] == [
        {"business_id": 501, "service_type": "private_training", "is_primary": True}
    ]
    assert publisher.inserted_rows["trainer_behavior_issues"] == [
        {"business_id": 501, "behavior_issue": "anxiety_general"}
    ]


def test_non_ready_candidates_are_not_silently_published():
    artifact = make_mapping_artifact(make_mapping_record(index=1, mapping_status="blocked"))
    publisher = FakePublisher()

    report = concierge_publish.publish_mapping_artifact(artifact, apply=True, publisher=publisher)

    assert report["counts"]["published"] == 0
    assert report["counts"]["skipped_non_ready"] == 1
    assert publisher.business_payloads == []


def test_dry_run_report_keeps_publish_preview_without_writing():
    artifact = make_mapping_artifact(make_mapping_record(index=1))

    report = concierge_publish.publish_mapping_artifact(artifact, apply=False)

    assert report["counts"] == {
        "published": 0,
        "skipped_non_ready": 0,
        "failed": 0,
        "dry_run_ready": 1,
        "total": 1,
    }
    preview = report["records"][0]["business_insert_preview"]
    assert preview["is_scaffolded"] is True
    assert preview["is_claimed"] is False
    assert preview["phone_encrypted"] == "ENCRYPT_ON_APPLY"
    assert preview["email_encrypted"] == "ENCRYPT_ON_APPLY"


if __name__ == "__main__":
    test_only_mapping_ready_candidates_publish()
    test_published_rows_remain_scaffolded_and_unclaimed_with_encrypted_contacts()
    test_linked_trainer_rows_insert_with_business_id()
    test_non_ready_candidates_are_not_silently_published()
    test_dry_run_report_keeps_publish_preview_without_writing()
    print("OK test_concierge_publish.py")
