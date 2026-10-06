#!/usr/bin/env python3
"""Simu paiement J2 — 2 téléphones (marchand QR ↔ payeur confirme)."""

from __future__ import annotations

import json
import socket
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

HOST = "0.0.0.0"
PORT = 8790
ROOT = Path(__file__).resolve().parent
VENDOR_QR = ROOT.parents[1] / "js" / "vendor" / "qrcode.min.js"

# id -> trx
TRX: dict[str, dict] = {}


def lan_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Handler(BaseHTTPRequestHandler):
    server_version = "J2PaySim/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _file(self, path: Path, content_type: str) -> None:
        if not path.is_file():
            self.send_error(404)
            return
        data = path.read_bytes()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/marchand", "/marchand.html"):
            self._file(ROOT / "marchand.html", "text/html; charset=utf-8")
            return
        if path in ("/payer", "/payer.html"):
            self._file(ROOT / "payer.html", "text/html; charset=utf-8")
            return
        if path == "/js/qrcode.min.js":
            self._file(VENDOR_QR, "application/javascript; charset=utf-8")
            return
        if path == "/api/meta":
            ip = lan_ip()
            self._json(
                200,
                {
                    "baseUrl": f"http://{ip}:{PORT}",
                    "lanIp": ip,
                    "port": PORT,
                },
            )
            return
        if path.startswith("/api/trx/"):
            trx_id = path[len("/api/trx/") :].strip("/")
            trx = TRX.get(trx_id)
            if not trx:
                self._json(404, {"error": "Transaction introuvable"})
                return
            self._json(200, trx)
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "JSON invalide"})
            return

        if path == "/api/trx":
            amount = str(data.get("amount") or "").strip()
            merchant = str(data.get("merchant") or "Stand démo").strip()[:40]
            currency = str(data.get("currency") or "GHS").strip()[:6] or "GHS"
            if not amount:
                self._json(400, {"error": "Montant requis"})
                return
            trx_id = uuid4().hex[:10]
            trx = {
                "id": trx_id,
                "merchant": merchant,
                "amount": amount,
                "currency": currency,
                "status": "pending",
                "createdAt": now_iso(),
                "paidAt": None,
                "payerLabel": None,
            }
            TRX[trx_id] = trx
            ip = lan_ip()
            pay_url = f"http://{ip}:{PORT}/payer.html?id={trx_id}"
            self._json(201, {**trx, "payUrl": pay_url})
            return

        if path.startswith("/api/trx/") and path.endswith("/pay"):
            trx_id = path[len("/api/trx/") : -len("/pay")].strip("/")
            trx = TRX.get(trx_id)
            if not trx:
                self._json(404, {"error": "Transaction introuvable"})
                return
            if trx["status"] == "paid":
                self._json(200, trx)
                return
            trx["status"] = "paid"
            trx["paidAt"] = now_iso()
            trx["payerLabel"] = str(data.get("payer") or "Payeur téléphone B")[:40]
            self._json(200, trx)
            return

        if path.startswith("/api/trx/") and path.endswith("/reset"):
            trx_id = path[len("/api/trx/") : -len("/reset")].strip("/")
            trx = TRX.get(trx_id)
            if not trx:
                self._json(404, {"error": "Transaction introuvable"})
                return
            trx["status"] = "pending"
            trx["paidAt"] = None
            trx["payerLabel"] = None
            self._json(200, trx)
            return

        self.send_error(404)


def main() -> None:
    ip = lan_ip()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"J2 pay-sim → http://{ip}:{PORT}/marchand.html")
    print(f"             http://127.0.0.1:{PORT}/marchand.html")
    print("Téléphone A = marchand · Téléphone B scanne le QR")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
