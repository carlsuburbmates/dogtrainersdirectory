#!/usr/bin/env python3
"""Simple unit tests for scripts/abn_recheck.py.

These tests avoid external dependencies; they test the parsing and matching
logic against representative sample JSON payloads.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from abn_recheck import normalize_name, similarity, find_name_in_json  # noqa: E402
from abn_recheck import update_row_verified, process_row, Row  # noqa: E402
import subprocess
from unittest.mock import patch


def test_normalize_name():
    assert normalize_name("ACME Pty Ltd") == "acme pty ltd"
    assert normalize_name("ACME  (Pty)   Ltd.") == "acme pty ltd"


def test_similarity_basic():
    a = "ACME Pty Ltd"
    b = "Acme Pty Ltd"
    assert similarity(a, b) > 0.95


def test_find_name_in_json_simple():
    j = {"EntityName": "Bob's Dog Care"}
    assert find_name_in_json(j) == "Bob's Dog Care"


def test_find_name_in_json_nested():
    j = {"a": {"businessName": "Fido Trainers"}}
    assert find_name_in_json(j) == "Fido Trainers"


def test_update_row_verified_dry_run():
    # Ensure subprocess.run is NOT called in dry-run
    with patch("subprocess.run") as mock_run:
        ok = update_row_verified("dummy_conn", 1, "verified", "X", 1.0, "{}", dry_run=True)
        assert ok is True
        mock_run.assert_not_called()


def test_process_row_dry_run_no_write():
    # Process a fake row but ensure psql is not invoked when dry-run is set
    r = Row(id=1, abn="12345678901", business_name="Test Business")
    with patch("abn_recheck.call_abr") as call_mock:
        call_mock.return_value = (200, '{"EntityName":"Test Business"}')
        with patch("subprocess.run") as mock_run:
            process_row("dummy_conn", r, api_key=None, guid=None, dry_run=True, auto_apply=False)
            # script should not try to write in dry-run/auto_apply=False
            mock_run.assert_not_called()


if __name__ == "__main__":
    test_normalize_name()
    test_similarity_basic()
    test_find_name_in_json_simple()
    test_find_name_in_json_nested()
    print("OK test_abn_recheck.py")
