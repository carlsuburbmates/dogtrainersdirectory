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
        self.resolved_localities: list[tuple[str, str]] = []
        self._next_business_id = 501

    def encrypt_sensitive(self, value: str) -> str:
        self.encrypted_inputs.append(value)
        return f"enc::{value}"

    def publish_candidate_transaction(
        self,
        candidate: concierge_publish.PreparedPublishCandidate,
        *,
        live_suburb_id: int,
        encrypted_phone: str | None,
        encrypted_email: str | None,
    ) -> int:
        payload = concierge_publish.build_business_insert_payload(
            candidate,
            live_suburb_id=live_suburb_id,
            encrypted_phone=encrypted_phone,
            encrypted_email=encrypted_email,
        )
        self.business_payloads.append(payload)
        business_id = self._next_business_id
        self._next_business_id += 1
        self.inserted_rows["trainer_specializations"] = concierge_publish.build_relation_rows(
            "trainer_specializations", business_id, candidate.trainer_specializations_rows
        )
        self.inserted_rows["trainer_services"] = concierge_publish.build_relation_rows(
            "trainer_services", business_id, candidate.trainer_services_rows
        )
        self.inserted_rows["trainer_behavior_issues"] = concierge_publish.build_relation_rows(
            "trainer_behavior_issues", business_id, candidate.trainer_behavior_issues_rows
        )
        return business_id

    def resolve_live_suburb_id(self, suburb_name: str, council_name: str) -> int:
        self.resolved_localities.append((suburb_name, council_name))
        return 902


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


def make_locality_lookup(
    *row_indexes: int,
    suburb_name: str = "Abbotsford",
    council_name: str = "City of Yarra",
) -> dict[int, dict[str, str]]:
    return {
        row_index: {"resolved_suburb": suburb_name, "resolved_council": council_name}
        for row_index in row_indexes
    }


def test_only_mapping_ready_candidates_publish():
    artifact = make_mapping_artifact(
        make_mapping_record(index=1, mapping_status="mapping_ready"),
        make_mapping_record(index=2, mapping_status="needs_review"),
    )
    publisher = FakePublisher()

    report = concierge_publish.publish_mapping_artifact(
        artifact,
        apply=True,
        locality_lookup=make_locality_lookup(1, 2),
        publisher=publisher,
    )

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

    report = concierge_publish.publish_mapping_artifact(
        artifact,
        apply=True,
        locality_lookup=make_locality_lookup(1, suburb_name="Balaclava", council_name="City of Port Phillip"),
        publisher=publisher,
    )

    business_payload = publisher.business_payloads[0]
    assert business_payload["profile_id"] is None
    assert business_payload["is_scaffolded"] is True
    assert business_payload["is_claimed"] is False
    assert business_payload["verification_status"] == "pending"
    assert business_payload["abn_verified"] is False
    assert business_payload["phone"] is None
    assert business_payload["email"] is None
    assert business_payload["suburb_id"] == 902
    assert business_payload["phone_encrypted"] == "enc::0400 111 111"
    assert business_payload["email_encrypted"] == "enc::hello@example.com"
    assert publisher.encrypted_inputs == ["0400 111 111", "hello@example.com"]
    assert publisher.resolved_localities == [("Balaclava", "City of Port Phillip")]
    assert report["records"][0]["claim_state"] == {
        "profile_id": None,
        "is_scaffolded": True,
        "is_claimed": False,
        "verification_status": "pending",
        "abn_verified": False,
    }
    assert report["records"][0]["locality_resolution"] == {
        "resolved_suburb": "Balaclava",
        "resolved_council": "City of Port Phillip",
        "artifact_suburb_id": 15,
        "live_suburb_id": 902,
    }


def test_linked_trainer_rows_insert_with_business_id():
    artifact = make_mapping_artifact(make_mapping_record(index=1))
    publisher = FakePublisher()

    concierge_publish.publish_mapping_artifact(
        artifact,
        apply=True,
        locality_lookup=make_locality_lookup(1),
        publisher=publisher,
    )

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

    report = concierge_publish.publish_mapping_artifact(
        artifact,
        apply=True,
        locality_lookup=make_locality_lookup(1),
        publisher=publisher,
    )

    assert report["counts"]["published"] == 0
    assert report["counts"]["skipped_non_ready"] == 1
    assert publisher.business_payloads == []


def test_dry_run_report_keeps_publish_preview_without_writing():
    artifact = make_mapping_artifact(make_mapping_record(index=1))

    report = concierge_publish.publish_mapping_artifact(
        artifact,
        apply=False,
        locality_lookup=make_locality_lookup(1, suburb_name="Elwood", council_name="City of Port Phillip"),
    )

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
    assert preview["suburb_id"] == -1
    assert report["records"][0]["locality_resolution_preview"] == {
        "resolved_suburb": "Elwood",
        "resolved_council": "City of Port Phillip",
        "artifact_suburb_id": 15,
        "live_suburb_id": "RESOLVE_ON_APPLY",
    }


def test_publish_fails_cleanly_when_live_locality_cannot_be_resolved():
    class MissingLocalityPublisher(FakePublisher):
        def resolve_live_suburb_id(self, suburb_name: str, council_name: str) -> int:
            raise RuntimeError(
                f"live suburb resolution found no match for suburb '{suburb_name}' in council '{council_name}'"
            )

    artifact = make_mapping_artifact(make_mapping_record(index=1))
    publisher = MissingLocalityPublisher()

    report = concierge_publish.publish_mapping_artifact(
        artifact,
        apply=True,
        locality_lookup=make_locality_lookup(1, suburb_name="Docklands", council_name="City of Melbourne"),
        publisher=publisher,
    )

    assert report["counts"] == {
        "published": 0,
        "skipped_non_ready": 0,
        "failed": 1,
        "dry_run_ready": 0,
        "total": 1,
    }
    assert report["records"][0]["publish_action"] == "failed"
    assert "live suburb resolution found no match" in report["records"][0]["reasons"][0]
    assert publisher.business_payloads == []


def test_transaction_sql_includes_specializations_before_commit():
    record = make_mapping_record(index=1, suburb_id=17)
    candidate = concierge_publish.prepare_publish_candidate(
        record,
        locality_lookup=make_locality_lookup(1, suburb_name="Abbotsford", council_name="City of Yarra"),
    )
    payload = concierge_publish.build_business_insert_payload(
        candidate,
        live_suburb_id=17,
        encrypted_phone="enc::0400 111 111",
        encrypted_email="enc::hello@example.com",
    )

    sql = concierge_publish.build_transaction_sql(candidate, payload)

    assert "BEGIN;" in sql
    assert "inserted_business AS" in sql
    assert "insert_specializations AS" in sql
    assert "INSERT INTO trainer_specializations" in sql
    assert "SELECT id FROM inserted_business;" in sql
    assert "COMMIT;" in sql


if __name__ == "__main__":
    test_only_mapping_ready_candidates_publish()
    test_published_rows_remain_scaffolded_and_unclaimed_with_encrypted_contacts()
    test_linked_trainer_rows_insert_with_business_id()
    test_non_ready_candidates_are_not_silently_published()
    test_dry_run_report_keeps_publish_preview_without_writing()
    test_publish_fails_cleanly_when_live_locality_cannot_be_resolved()
    test_transaction_sql_includes_specializations_before_commit()
    print("OK test_concierge_publish.py")
