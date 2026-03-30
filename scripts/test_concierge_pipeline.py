#!/usr/bin/env python3
"""Focused verification for the Phase 17 concierge seed pipeline."""
from __future__ import annotations

import csv
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import concierge_pipeline  # noqa: E402

PILOT_CSV = REPO_ROOT / "data" / "concierge_seed_queue_inner_melbourne_pilot_19.csv"
SUBURBS_SQL = REPO_ROOT / "supabase" / "data-import.sql"


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    return list(csv.DictReader(path.read_text(encoding="utf-8").splitlines()))


def fake_extract_page_fields(url: str, business_name_hint: str, service_hint: str) -> dict[str, object]:
    parsed = urlparse(url)
    safe_domain = parsed.netloc[4:] if parsed.netloc.startswith("www.") else parsed.netloc
    domain_score = sum(ord(char) for char in safe_domain) % 1000
    return {
        "fetch": {
            "source_url": url,
            "final_url": url,
            "http_status": 200,
            "content_type": "text/html",
            "charset": "utf-8",
            "error": "",
            "domain": safe_domain,
        },
        "snapshot": {
            "title": business_name_hint,
            "headings": {"h1": business_name_hint, "h2": "", "h3": ""},
            "meta": {"description": service_hint},
            "canonical_url": url,
            "links": [],
            "body_text": service_hint,
            "jsonld": [],
        },
        "text_blob": f"{business_name_hint} {service_hint}",
        "contacts": {
            "website": url,
            "phone": f"0400 {domain_score:03d} {domain_score:03d}",
            "email": f"hello+{safe_domain.replace('.', '-') }@example.com",
            "address": "123 Example St",
        },
        "business_name": business_name_hint,
        "taxonomy": {
            "resource_type": "trainer",
            "service_types": ["private_training"],
            "age_specialties": ["adult_18m_7y"],
            "behavior_issues": ["anxiety_general"],
        },
        "evidence": {
            "name": ["h1"],
            "resource_type": ["default trainer"],
            "service_types": ["private training keyword"],
            "age_specialties": ["adult/general keyword"],
            "behavior_issues": ["anxiety keyword"],
        },
        "blocked_issues": [],
        "advisory_warnings": [],
    }


def test_canonical_pilot_rows():
    rows = load_csv_rows(PILOT_CSV)
    assert len(rows) == 19
    assert set(rows[0].keys()) == {
        "source_url",
        "business_name_hint",
        "suburb_hint",
        "service_hint",
        "notes",
    }
    assert all(row["source_url"].startswith(("http://", "https://")) for row in rows)
    assert len({row["source_url"] for row in rows}) == 19


def test_rejects_non_http_source_urls_before_fetch():
    with tempfile.TemporaryDirectory(prefix="dtd-concierge-invalid-") as tmp:
        temp_csv = Path(tmp) / "queue.csv"
        temp_csv.write_text(
            "\n".join(
                [
                    "source_url,business_name_hint,suburb_hint,service_hint,notes",
                    "ftp://example.com/listing,Example Trainer,Carlton,private training,",
                ]
            ),
            encoding="utf-8",
        )

        try:
            concierge_pipeline.parse_seed_queue(temp_csv)
        except SystemExit as exc:
            assert "non-approved source_url" in str(exc)
        else:
            raise AssertionError("Expected parse_seed_queue to reject non-http source_url values")


def test_rejects_out_of_catchment_suburb_hints_before_fetch():
    with tempfile.TemporaryDirectory(prefix="dtd-concierge-out-of-catchment-") as tmp:
        temp_csv = Path(tmp) / "queue.csv"
        temp_csv.write_text(
            "\n".join(
                [
                    "source_url,business_name_hint,suburb_hint,service_hint,notes",
                    "https://example.com/listing,Example Trainer,Werribee,private training,",
                ]
            ),
            encoding="utf-8",
        )

        try:
            concierge_pipeline.parse_seed_queue(temp_csv)
        except SystemExit as exc:
            assert "approved Inner Melbourne catchment" in str(exc)
        else:
            raise AssertionError("Expected parse_seed_queue to reject out-of-catchment suburb hints")


def test_accepts_valid_inner_city_suburb_not_present_in_pilot_batch():
    with tempfile.TemporaryDirectory(prefix="dtd-concierge-inner-city-") as tmp:
        temp_csv = Path(tmp) / "queue.csv"
        temp_csv.write_text(
            "\n".join(
                [
                    "source_url,business_name_hint,suburb_hint,service_hint,notes",
                    "https://example.com/listing,Example Trainer,Docklands,private training,",
                ]
            ),
            encoding="utf-8",
        )

        rows = concierge_pipeline.parse_seed_queue(temp_csv)
        assert len(rows) == 1
        assert rows[0]["suburb_hint"] == "Docklands"


def test_resolve_suburb_uses_council_evidence_for_ambiguous_localities():
    councils, suburb_lookup, _ = concierge_pipeline.load_councils_and_suburbs()
    snapshot = {
        "title": "Eltham Dog Training",
        "headings": {"h1": "", "h2": "", "h3": ""},
        "meta": {"description": "Shire of Nillumbik"},
        "canonical_url": "",
        "links": [],
        "body_text": "Shire of Nillumbik",
        "jsonld": [],
    }

    match, warnings = concierge_pipeline.resolve_suburb(
        "Eltham",
        snapshot,
        suburb_lookup,
        councils,
    )

    assert match is not None
    assert match.council_name == "Shire of Nillumbik"
    assert warnings == ["resolved ambiguous suburb using council evidence 'Shire of Nillumbik'"]


def test_pipeline_emits_review_artifact_for_the_canonical_pilot():
    with tempfile.TemporaryDirectory(prefix="dtd-concierge-") as tmp:
        output_dir = Path(tmp)
        with patch.object(concierge_pipeline, "extract_page_fields", side_effect=fake_extract_page_fields):
            exit_code = concierge_pipeline.main(
                [
                    "--input",
                    str(PILOT_CSV),
                    "--output-dir",
                    str(output_dir),
                ]
            )

        assert exit_code == 0

        json_path = output_dir / "concierge_review_artifact.json"
        csv_path = output_dir / "concierge_review_artifact.csv"

        assert json_path.exists()
        assert csv_path.exists()

        artifact = json.loads(json_path.read_text(encoding="utf-8"))
        assert artifact["pipeline"] == "concierge_seed_pipeline"
        assert artifact["task"] == "CS-1002"
        assert artifact["approved_source_only"] is True
        assert artifact["input_csv"] == str(PILOT_CSV.resolve())
        assert artifact["review_counts"] == {
            "ready": 19,
            "needs_review": 0,
            "blocked": 0,
            "total": 19,
        }
        assert len(artifact["records"]) == 19

        richmond = next(record for record in artifact["records"] if record["suburb_hint"] == "Richmond")
        assert richmond["locality"]["resolved_suburb"] == "Richmond"
        assert richmond["locality"]["resolved_council"] == "City of Yarra"
        assert richmond["locality"]["suburb_id"] == 15
        assert richmond["publish_status"] == "ready"

        written_rows = list(csv.DictReader(csv_path.read_text(encoding="utf-8").splitlines()))
        assert len(written_rows) == 19
        assert written_rows[0]["source_url"].startswith("https://")


def test_pipeline_processes_only_manual_queue_urls():
    source_csv = "\n".join(
        [
            "source_url,business_name_hint,suburb_hint,service_hint,notes",
            "https://example.com/trainer,Example Trainer,Carlton,private training,",
        ]
    )
    calls: list[str] = []

    def record_extract(url: str, business_name_hint: str, service_hint: str) -> dict[str, object]:
        calls.append(url)
        return fake_extract_page_fields(url, business_name_hint, service_hint)

    with tempfile.TemporaryDirectory(prefix="dtd-concierge-single-") as tmp:
        tmp_path = Path(tmp)
        input_path = tmp_path / "queue.csv"
        input_path.write_text(source_csv, encoding="utf-8")

        with patch.object(concierge_pipeline, "extract_page_fields", side_effect=record_extract):
            exit_code = concierge_pipeline.main(
                [
                    "--input",
                    str(input_path),
                    "--output-dir",
                    str(tmp_path / "out"),
                ]
            )

    assert exit_code == 0
    assert calls == ["https://example.com/trainer"]


def test_duplicate_warnings_use_locality_scoped_multi_signal_matching():
    source_csv = "\n".join(
        [
            "source_url,business_name_hint,suburb_hint,service_hint,notes",
            "https://example.com/a,Example Trainer,Carlton,private training,",
            "https://example.com/b,Example Trainer,Carlton,private training,",
        ]
    )

    def duplicate_extract(url: str, business_name_hint: str, service_hint: str) -> dict[str, object]:
        return fake_extract_page_fields(url, business_name_hint, service_hint)

    with tempfile.TemporaryDirectory(prefix="dtd-concierge-dupe-") as tmp:
        tmp_path = Path(tmp)
        input_path = tmp_path / "queue.csv"
        input_path.write_text(source_csv, encoding="utf-8")

        with patch.object(concierge_pipeline, "extract_page_fields", side_effect=duplicate_extract):
            exit_code = concierge_pipeline.main(
                [
                    "--input",
                    str(input_path),
                    "--output-dir",
                    str(tmp_path / "out"),
                ]
            )

        assert exit_code == 0
        artifact = json.loads((tmp_path / "out" / "concierge_review_artifact.json").read_text(encoding="utf-8"))
        second = artifact["records"][1]
        assert any("domain+locality duplicates row 1" in warning for warning in second["duplicate_warnings"])
        assert any("name+locality duplicates row 1" in warning for warning in second["duplicate_warnings"])
        assert any("phone duplicates row 1" in warning for warning in second["duplicate_warnings"])
        assert any("email duplicates row 1" in warning for warning in second["duplicate_warnings"])


if __name__ == "__main__":
    test_canonical_pilot_rows()
    test_rejects_non_http_source_urls_before_fetch()
    test_rejects_out_of_catchment_suburb_hints_before_fetch()
    test_accepts_valid_inner_city_suburb_not_present_in_pilot_batch()
    test_resolve_suburb_uses_council_evidence_for_ambiguous_localities()
    test_pipeline_emits_review_artifact_for_the_canonical_pilot()
    test_pipeline_processes_only_manual_queue_urls()
    test_duplicate_warnings_use_locality_scoped_multi_signal_matching()
    print("OK test_concierge_pipeline.py")
