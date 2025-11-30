#!/usr/bin/env python3
"""Simple unit tests for scripts/abn_recheck.py.

These tests avoid external dependencies; they test the parsing and matching
logic against representative sample JSON payloads.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from abn_recheck import normalize_name, similarity, find_name_in_json  # noqa: E402


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


if __name__ == "__main__":
    test_normalize_name()
    test_similarity_basic()
    test_find_name_in_json_simple()
    test_find_name_in_json_nested()
    print("OK test_abn_recheck.py")
