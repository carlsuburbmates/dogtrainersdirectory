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


def test_process_row_dry_run_soap(monkeypatch):
        # If call_abr returns SOAP/XML payload, process_row should still find name
        r = Row(id=2, abn="98765432100", business_name="Soap Test Co")

        soap_body = '''<?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <ABRSearchByABNResponse>
                    <ABRSearchByABNResult>
                        <Response>
                            <ResponseBody>
                                <ABN>98765432100</ABN>
                                <EntityName>Soap Test Co</EntityName>
                                <ABNStatus>Active</ABNStatus>
                            </ResponseBody>
                        </Response>
                    </ABRSearchByABNResult>
                </ABRSearchByABNResponse>
            </soap:Body>
        </soap:Envelope>'''

        with patch("abn_recheck.call_abr") as call_mock:
                call_mock.return_value = (200, soap_body)
                with patch("subprocess.run") as mock_run:
                        process_row("dummy_conn", r, api_key=None, guid="GUID", dry_run=True, auto_apply=False)
                        mock_run.assert_not_called()


def test_process_row_soap_full_data(monkeypatch):
        r = Row(id=3, abn="53004085616", business_name="Loose Lead Training")
        soap_body = '''<?xml version="1.0"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <ABRSearchByABNResponse>
                    <ABRSearchByABNResult>
                        <Response>
                            <ResponseBody>
                                <ABN>53004085616</ABN>
                                <ABNStatus>Active</ABNStatus>
                                <EntityName>LOOSE LEAD TRAINING FITZROY PTY LTD</EntityName>
                                <BusinessName>Loose Lead Training</BusinessName>
                                <GstFlag>Y</GstFlag>
                                <GstEffectiveFrom>2024-01-01</GstEffectiveFrom>
                            </ResponseBody>
                        </Response>
                    </ABRSearchByABNResult>
                </ABRSearchByABNResponse>
            </soap:Body>
        </soap:Envelope>'''

        with patch("abn_recheck.call_abr") as call_mock:
                call_mock.return_value = (200, soap_body)
                with patch("subprocess.run") as mock_run:
                        process_row("dummy_conn", r, api_key=None, guid="GUID", dry_run=True, auto_apply=False)
                        mock_run.assert_not_called()


def test_process_row_soap_cancelled(monkeypatch):
        r = Row(id=4, abn="22222222222", business_name="Some Old Business")
        soap_body = '''<?xml version="1.0"?><soap:Envelope><soap:Body><ABRSearchByABNResponse><ABRSearchByABNResult><Response><ResponseBody><ABN>22222222222</ABN><ABNStatus>Cancelled</ABNStatus><DateCancelled>2024-10-10</DateCancelled></Response></Response></ABRSearchByABNResult></ABRSearchByABNResponse></soap:Body></soap:Envelope>'''
        with patch("abn_recheck.call_abr") as call_mock:
                call_mock.return_value = (200, soap_body)
                with patch("subprocess.run") as mock_run:
                        process_row("dummy_conn", r, api_key=None, guid="GUID", dry_run=True, auto_apply=False)
                        mock_run.assert_not_called()


def test_process_row_soap_not_found(monkeypatch):
        r = Row(id=5, abn="00000000000", business_name="No One")
        # Simulate SOAP response with no ResponseBody
        soap_body = '''<?xml version="1.0"?><soap:Envelope><soap:Body><ABRSearchByABNResponse><ABRSearchByABNResult><Response></Response></ABRSearchByABNResult></ABRSearchByABNResponse></soap:Body></soap:Envelope>'''
        with patch("abn_recheck.call_abr") as call_mock:
                call_mock.return_value = (200, soap_body)
                with patch("subprocess.run") as mock_run:
                        process_row("dummy_conn", r, api_key=None, guid="GUID", dry_run=True, auto_apply=False)
                        mock_run.assert_not_called()


def test_fetch_rows_http_and_update_http(monkeypatch):
    # Mock urllib.request.urlopen for fetch_rows HTTP
    class Resp:
        def __init__(self, body, code=200):
            self._b = body.encode()
            self._code = code

        def read(self):
            return self._b

        def getcode(self):
            return self._code

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    sample = '[{"id":1,"abn":"123","business_name":"Test Co"}]'

    def fake_urlopen(req, timeout=0):
        return Resp(sample)

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)

    rows = list(fetch_rows("dummy_conn", limit=1))
    assert len(rows) == 1
    assert rows[0].id == 1
    assert rows[0].abn == "123"

    # Test update via http: simulate a 204
    called = {}

    def fake_urlopen_patch(req, timeout=0):
        class PResp:
            def __init__(self):
                pass

            def getcode(self):
                return 204

            def read(self):
                return b''

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        called['url'] = req.full_url if hasattr(req, 'full_url') else getattr(req, 'host', '')
        return PResp()

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen_patch)
    ok = update_row_verified("dummy_conn", 1, "verified", "Test Co", 0.9, '{}', dry_run=False)
    assert ok is True


if __name__ == "__main__":
    test_normalize_name()
    test_similarity_basic()
    test_find_name_in_json_simple()
    test_find_name_in_json_nested()
    print("OK test_abn_recheck.py")
