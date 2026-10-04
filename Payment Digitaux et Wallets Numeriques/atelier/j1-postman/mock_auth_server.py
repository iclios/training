#!/usr/bin/env python3
"""
Mock Auth + Clearing J1 — vrais messages ISO 8583 (MTI + bitmap + DE),
représentés en hex (comme sur un lien host), plus vue décodée pour la salle.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from datetime import datetime, timezone
from uuid import uuid4

HOST = "127.0.0.1"
PORT = 8787

# Spécification pédagogique des DE (ISO 8583-ish)
# type: n / an / ans / llvar_n / lllvar_ans
DE_SPEC: dict[int, tuple[str, int | None, str]] = {
    2: ("llvar_n", None, "PAN"),
    3: ("n", 6, "Processing code"),
    4: ("n", 12, "Amount, transaction"),
    7: ("n", 10, "Transmission date & time (MMDDhhmmss)"),
    11: ("n", 6, "STAN"),
    12: ("n", 6, "Local time (hhmmss)"),
    13: ("n", 4, "Local date (MMDD)"),
    14: ("n", 4, "Expiration date (YYMM)"),
    18: ("n", 4, "MCC"),
    22: ("n", 3, "POS entry mode"),
    25: ("n", 2, "POS condition code"),
    37: ("an", 12, "RRN"),
    38: ("an", 6, "Authorization ID response"),
    39: ("an", 2, "Response code"),
    41: ("ans", 8, "Card acceptor terminal ID"),
    42: ("ans", 15, "Card acceptor ID code (MID)"),
    43: ("ans", 40, "Card acceptor name/location"),
    49: ("n", 3, "Currency code, transaction"),
    50: ("n", 3, "Currency code, settlement"),
    15: ("n", 4, "Date, settlement (MMDD)"),
    60: ("lllvar_ans", None, "Private / additional data"),
    66: ("n", 1, "Settlement code"),
    74: ("n", 10, "Credits, number"),
    75: ("n", 10, "Credits, reversal number"),
    76: ("n", 10, "Debits, number"),
    86: ("n", 16, "Credits, amount"),
    87: ("n", 16, "Credits, reversal amount"),
    88: ("n", 16, "Debits, amount"),
    90: ("n", 42, "Original data elements"),
    97: ("ans", 17, "Net reconciliation amount (C/D + value)"),
}

DE_LABELS = {str(k): v[2] for k, v in DE_SPEC.items()}
DE_LABELS.update(
    {
        "38": "Auth ID response — code d’autorisation émetteur",
        "39": "Response code — 00 approve · 51 fonds…",
        "90": "Original data elements — lien avec l’Auth (compensation)",
        "15": "Settlement date — date de règlement",
        "50": "Settlement currency",
        "66": "Settlement code",
        "74": "Nombre de crédits (totaux réconciliation)",
        "76": "Nombre de débits",
        "86": "Montant crédits",
        "88": "Montant débits",
        "97": "Net à régler (C crédit / D débit + montant)",
    }
)


def _utc_now():
    return datetime.now(timezone.utc)


def _de7(dt: datetime | None = None) -> str:
    return (dt or _utc_now()).strftime("%m%d%H%M%S")


def _stan() -> str:
    return f"{int(uuid4().int % 1_000_000):06d}"


def _rrn(stan: str, dt: datetime | None = None) -> str:
    dt = dt or _utc_now()
    return f"{dt.year % 10}{dt.strftime('%j')}{stan}"


def _pad_n(value: str, length: int) -> str:
    digits = "".join(c for c in str(value) if c.isdigit())
    return digits.zfill(length)[-length:]


def _pad_an(value: str, length: int) -> str:
    s = str(value)
    if len(s) >= length:
        return s[:length]
    return s + (" " * (length - len(s)))


def encode_field(de: int, value: str) -> bytes:
    kind, length, _ = DE_SPEC[de]
    if kind == "n":
        return _pad_n(value, length).encode("ascii")
    if kind in ("an", "ans"):
        return _pad_an(value, length).encode("ascii")
    if kind == "llvar_n":
        digits = "".join(c for c in str(value) if c.isdigit() or c in "Xx*")
        # garder masque X pour démo ; packer en ASCII
        body = digits.encode("ascii")
        return f"{len(body):02d}".encode("ascii") + body
    if kind == "lllvar_ans":
        body = str(value).encode("ascii")
        return f"{len(body):03d}".encode("ascii") + body
    raise ValueError(f"Type DE inconnu: {kind}")


def build_bitmap(present: set[int]) -> bytes:
    """Bitmap primaire (1–64) + secondaire (65–128) si besoin."""
    bits = ["0"] * 128
    need_secondary = any(de > 64 for de in present)
    if need_secondary:
        bits[0] = "1"  # DE1 = secondary bitmap present
    for de in present:
        if de < 1 or de > 128:
            continue
        bits[de - 1] = "1"
    primary = int("".join(bits[0:64]), 2).to_bytes(8, "big")
    if need_secondary:
        secondary = int("".join(bits[64:128]), 2).to_bytes(8, "big")
        return primary + secondary
    return primary


def bitmap_hex_and_bits(bitmap: bytes) -> dict:
    hex_str = bitmap.hex().upper()
    bits = "".join(f"{b:08b}" for b in bitmap)
    active = [i + 1 for i, bit in enumerate(bits) if bit == "1"]
    return {
        "hex": hex_str,
        "bits": bits,
        "active_de": active,
        "length_bytes": len(bitmap),
        "has_secondary": len(bitmap) == 16,
    }


def pack_message(mti: str, fields: dict[int, str]) -> dict:
    present = set(fields.keys())
    # DE1 n'est jamais dans fields : géré par bitmap
    present.discard(1)
    bitmap = build_bitmap(present)
    body = bytearray()
    body.extend(mti.encode("ascii"))
    body.extend(bitmap)
    ordered = []
    for de in sorted(present):
        if de not in DE_SPEC:
            continue
        raw = encode_field(de, fields[de])
        body.extend(raw)
        ordered.append(
            {
                "de": de,
                "name": DE_SPEC[de][2],
                "value": fields[de],
                "encoded_hex": raw.hex().upper(),
                "encoded_ascii": raw.decode("ascii", errors="replace"),
            }
        )
    return {
        "mti": mti,
        "bitmap": bitmap_hex_and_bits(bitmap),
        "fields": {str(k): fields[k] for k in sorted(fields)},
        "de_detail": ordered,
        "message_hex": body.hex().upper(),
        "message_ascii": body.decode("ascii", errors="replace"),
        "message_length": len(body),
    }


def parse_incoming_fields(req: dict) -> dict[int, str]:
    raw = req.get("fields") or {}
    out: dict[int, str] = {}
    for k, v in raw.items():
        out[int(k)] = str(v)
    # raccourcis
    if "amount" in req and 4 not in out:
        cents = int(round(float(req["amount"]) * 100))
        out[4] = f"{cents:012d}"
    if "terminalId" in req and 41 not in out:
        out[41] = _pad_an(str(req["terminalId"]), 8)
    if "merchantId" in req and 42 not in out:
        out[42] = _pad_an(str(req["merchantId"]).replace("-", ""), 15)
    return out


def sample_auth_0100(**overrides) -> dict[int, str]:
    dt = _utc_now()
    stan = _stan()
    fields = {
        2: "4761730000000010",
        3: "000000",
        4: "000000002500",
        7: _de7(dt),
        11: stan,
        12: dt.strftime("%H%M%S"),
        13: dt.strftime("%m%d"),
        14: "2812",
        18: "5411",
        22: "051",
        25: "00",
        41: "TIDLANE1",
        42: "MIDDEMO00000001",
        43: "BOULANGERIE DEMO     PARIS        FR",
        49: "978",
    }
    fields.update(overrides)
    return fields


def build_auth_exchange(approve: bool, incoming: dict) -> dict:
    base = sample_auth_0100()
    base.update(parse_incoming_fields(incoming))
    # PAN masqué côté réponse pédagogique si demandé
    if "panMasked" in incoming:
        digits = "".join(c for c in str(incoming["panMasked"]) if c.isdigit())
        if len(digits) >= 10:
            base[2] = digits

    req_msg = pack_message("0100", base)
    stan = base[11]
    rrn = _rrn(stan)
    resp_fields = {
        3: base[3],
        4: base[4],
        7: _de7(),
        11: stan,
        12: base.get(12, _utc_now().strftime("%H%M%S")),
        13: base.get(13, _utc_now().strftime("%m%d")),
        37: rrn,
        39: "00" if approve else "51",
        41: base[41],
        42: base[42],
        49: base[49],
    }
    if approve:
        resp_fields[38] = "A1B2C3"
    resp_msg = pack_message("0110", resp_fields)

    return {
        "standard": "ISO 8583",
        "flow": "Authorization",
        "note": "Message packé MTI + bitmap + DE (ASCII). Hex = ce qui circule sur le lien host (échantillon pédagogique).",
        "request": req_msg,
        "response": resp_msg,
        "readout": {
            "decision": "APPROVED" if approve else "DECLINED",
            "DE39": resp_fields[39],
            "DE38": resp_fields.get(38),
            "DE37_RRN": rrn,
            "DE11_STAN": stan,
            "bitmap_request_hex": req_msg["bitmap"]["hex"],
            "bitmap_response_hex": resp_msg["bitmap"]["hex"],
            "message_request_hex": req_msg["message_hex"],
            "message_response_hex": resp_msg["message_hex"],
        },
        "labels": DE_LABELS,
    }


def build_clearing_exchange(incoming: dict) -> dict:
    """
    Compensation / présentment : MTI 0220 (acquirer presentment / clearing advice)
    → 0230 (issuer response). DE90 rattache à l'autorisation d'origine.
    """
    dt = _utc_now()
    stan_orig = str(incoming.get("originalStan") or incoming.get("stan") or "000142")
    auth_id = str(incoming.get("authId") or "A1B2C3")
    amount = parse_incoming_fields(incoming).get(4) or "000000002500"
    tid = parse_incoming_fields(incoming).get(41) or "TIDLANE1"
    mid = parse_incoming_fields(incoming).get(42) or "MIDDEMO00000001"
    stan = _stan()

    # DE90 — Original Data Elements (42 n) : MTI(4)+STAN(6)+date(10)+AIIC… simplifié
    # Format courant : original MTI + original STAN + original DE7 + acquiring IIN padding
    de7_orig = str(incoming.get("originalDE7") or "1003060000")
    de90 = _pad_n("0100" + stan_orig + de7_orig + "0" * 22, 42)

    presentment = {
        2: str(incoming.get("pan") or "4761730000000010"),
        3: "000000",
        4: amount,
        7: _de7(dt),
        11: stan,
        12: dt.strftime("%H%M%S"),
        13: dt.strftime("%m%d"),
        14: "2812",
        18: "5411",
        22: str(incoming.get("entryMode") or "051"),
        25: "00",
        37: _rrn(stan, dt),
        38: auth_id,
        41: tid,
        42: mid,
        43: "BOULANGERIE DEMO     PARIS        FR",
        49: "978",
        60: "CLR*PRESENTMENT*BATCH001",
        90: de90,
    }
    # overrides fields
    presentment.update(parse_incoming_fields(incoming))

    req_msg = pack_message("0220", presentment)
    resp_fields = {
        3: presentment[3],
        4: presentment[4],
        7: _de7(),
        11: presentment[11],
        37: presentment[37],
        39: "00",
        41: presentment[41],
        42: presentment[42],
        49: presentment[49],
        90: presentment[90],
    }
    resp_msg = pack_message("0230", resp_fields)

    return {
        "standard": "ISO 8583",
        "flow": "Clearing / Presentment (compensation)",
        "note": (
            "MTI 0220/0230 = présentment / avis de compensation rattaché à l’Auth "
            "(DE38 + DE90). En production, beaucoup de schemes utilisent aussi des "
            "fichiers de clearing (IPM, Base II…) : ici on montre l’équivalent message "
            "online pédagogique avec bitmap réel."
        ),
        "request": req_msg,
        "response": resp_msg,
        "readout": {
            "decision": "ACCEPTED",
            "DE39": "00",
            "DE38_originalAuth": presentment[38],
            "DE90_originalData": presentment[90],
            "DE4_amount": presentment[4],
            "DE11_STAN": presentment[11],
            "DE37_RRN": presentment[37],
            "bitmap_request_hex": req_msg["bitmap"]["hex"],
            "bitmap_response_hex": resp_msg["bitmap"]["hex"],
            "message_request_hex": req_msg["message_hex"],
            "message_response_hex": resp_msg["message_hex"],
            "link_to_auth": (
                f"Compensation de l’Auth STAN={stan_orig} / AuthID={auth_id} "
                f"(DE90 commence par MTI 0100 + STAN d’origine)"
            ),
        },
        "labels": DE_LABELS,
    }


def build_settlement_exchange(incoming: dict) -> dict:
    """
    Règlement / réconciliation : MTI 0500 (acquirer reconciliation request)
    → 0510 (response). Totaux de lot + net (DE97).
    """
    dt = _utc_now()
    fields_in = parse_incoming_fields(incoming)
    stan = fields_in.get(11) or _stan()

    credits_n = str(incoming.get("creditsNumber") or "0000000012")
    debits_n = str(incoming.get("debitsNumber") or "0000000003")
    credits_amt = str(incoming.get("creditsAmount") or "0000000000250000")  # 2500.00
    debits_amt = str(incoming.get("debitsAmount") or "0000000000035000")  # 350.00
    # net = credits - debits = 2150.00 → C0000000000215000
    try:
        net = int(credits_amt) - int(debits_amt)
    except ValueError:
        net = 215000
    net_field = ("C" if net >= 0 else "D") + f"{abs(net):016d}"

    settle_date = str(incoming.get("settlementDate") or dt.strftime("%m%d"))

    req_fields = {
        7: _de7(dt),
        11: _pad_n(stan, 6),
        15: _pad_n(settle_date, 4),
        50: fields_in.get(50) or "978",
        66: str(incoming.get("settlementCode") or "1"),
        74: _pad_n(credits_n, 10),
        75: _pad_n(str(incoming.get("creditsReversalNumber") or "0"), 10),
        76: _pad_n(debits_n, 10),
        86: _pad_n(credits_amt, 16),
        87: _pad_n(str(incoming.get("creditsReversalAmount") or "0"), 16),
        88: _pad_n(debits_amt, 16),
        97: net_field,
        60: str(incoming.get("batchId") or "STL*BATCH*EOD001"),
    }
    req_fields.update({k: v for k, v in fields_in.items() if k in DE_SPEC})

    req_msg = pack_message("0500", req_fields)
    resp_fields = {
        7: _de7(),
        11: req_fields[11],
        15: req_fields[15],
        39: "00",
        50: req_fields[50],
        66: req_fields[66],
        74: req_fields[74],
        76: req_fields[76],
        86: req_fields[86],
        88: req_fields[88],
        97: req_fields[97],
    }
    resp_msg = pack_message("0510", resp_fields)

    return {
        "standard": "ISO 8583",
        "flow": "Settlement / Reconciliation (règlement)",
        "note": (
            "MTI 0500/0510 = demande/réponse de réconciliation acquéreur "
            "(totaux de lot, net DE97). Distinct du présentment unitaire 0220 "
            "(compensation opération par opération) et de l’Auth 0100. "
            "En production, le règlement effectif (mouvement de fonds) peut "
            "passer par d’autres rails ; ce message aligne les totaux."
        ),
        "request": req_msg,
        "response": resp_msg,
        "readout": {
            "decision": "RECONCILED",
            "DE39": "00",
            "DE15_settlementDate": req_fields[15],
            "DE74_creditsNumber": req_fields[74],
            "DE76_debitsNumber": req_fields[76],
            "DE86_creditsAmount": req_fields[86],
            "DE88_debitsAmount": req_fields[88],
            "DE97_net": req_fields[97],
            "bitmap_request_hex": req_msg["bitmap"]["hex"],
            "bitmap_response_hex": resp_msg["bitmap"]["hex"],
            "message_request_hex": req_msg["message_hex"],
            "message_response_hex": resp_msg["message_hex"],
            "chrono": "Auth 0100 → Clearing/Presentment 0220 → Recon 05xx → Settlement (souvent hors 8583)",
        },
        "labels": DE_LABELS,
    }


def body_json(handler):
    length = int(handler.headers.get("Content-Length", 0))
    raw = handler.rfile.read(length) if length else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


class AuthMock(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[iso8583-mock] {self.address_string()} {fmt % args}")

    def _send(self, code, payload):
        data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if path in ("/", "/health"):
            self._send(
                200,
                {
                    "ok": True,
                    "service": "j1-iso8583-packed-mock",
                    "port": PORT,
                    "routes": [
                        "GET  /iso8583/legend",
                        "GET  /iso8583/examples/auth-approve",
                        "GET  /iso8583/examples/clearing",
                        "GET  /iso8583/examples/settlement",
                        "POST /iso8583/auth/approve",
                        "POST /iso8583/auth/decline",
                        "POST /iso8583/clearing/presentment",
                        "POST /iso8583/settlement/reconciliation",
                    ],
                },
            )
            return
        if path == "/iso8583/legend":
            self._send(
                200,
                {
                    "standard": "ISO 8583 — message packé (MTI + bitmap + DE)",
                    "mti": {
                        "0100": "Authorization request",
                        "0110": "Authorization response",
                        "0220": "Presentment / clearing advice (compensation)",
                        "0230": "Presentment / clearing advice response",
                        "0500": "Acquirer reconciliation request (règlement / totaux)",
                        "0510": "Acquirer reconciliation response",
                        "0520": "Acquirer reconciliation advice (variante)",
                        "0530": "Acquirer reconciliation advice response",
                    },
                    "chrono": "0100 Auth → 0220 Clearing → 05xx Réconciliation → Settlement (souvent hors 8583)",
                    "salle_table": [
                        {
                            "etape": "0100",
                            "role": "Auth",
                            "forme": "Message online",
                        },
                        {
                            "etape": "0220 / fichiers clearing",
                            "role": "Compensation (ops) → chambre / scheme",
                            "forme": "Message et/ou fichier",
                        },
                        {
                            "etape": "05xx",
                            "role": "Réconciliation des totaux",
                            "forme": "Message (quand utilisé) — pas le règlement",
                        },
                        {
                            "etape": "Settlement",
                            "role": "Règlement des positions nettes",
                            "forme": "Souvent hors 8583 (banque de settlement, RTGS…)",
                        },
                    ],
                    "bitmap": (
                        "8 octets (primaire) ; bit 1 = bitmap secondaire présent. "
                        "Chaque bit suivant signale la présence d’un DE."
                    ),
                    "data_elements": DE_LABELS,
                    "wire_format": "message_hex = MTI ASCII + bitmap binaire + DE encodés",
                },
            )
            return
        if path == "/iso8583/examples/auth-approve":
            self._send(200, build_auth_exchange(True, {}))
            return
        if path == "/iso8583/examples/auth-decline":
            self._send(200, build_auth_exchange(False, {"fields": {"4": "000000250000", "22": "071"}}))
            return
        if path == "/iso8583/examples/clearing":
            self._send(
                200,
                build_clearing_exchange(
                    {
                        "originalStan": "000142",
                        "authId": "A1B2C3",
                        "originalDE7": "1003061530",
                        "fields": {"4": "000000002500"},
                    }
                ),
            )
            return
        if path == "/iso8583/examples/settlement":
            self._send(200, build_settlement_exchange({}))
            return
        self._send(404, {"error": "not_found", "path": self.path})

    def do_POST(self):
        path = self.path.split("?", 1)[0].rstrip("/")
        req = body_json(self)

        if path in ("/iso8583/auth/approve", "/auth/approve"):
            self._send(200, build_auth_exchange(True, req))
            return
        if path in ("/iso8583/auth/decline", "/auth/decline"):
            self._send(200, build_auth_exchange(False, req))
            return
        if path in ("/iso8583/clearing/presentment", "/iso8583/clearing"):
            self._send(200, build_clearing_exchange(req))
            return
        if path in (
            "/iso8583/settlement/reconciliation",
            "/iso8583/settlement",
            "/iso8583/reconciliation",
        ):
            self._send(200, build_settlement_exchange(req))
            return

        self._send(
            404,
            {
                "error": "unknown_route",
                "hint": (
                    "POST /iso8583/auth/approve|decline · "
                    "/iso8583/clearing/presentment · "
                    "/iso8583/settlement/reconciliation"
                ),
            },
        )


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AuthMock)
    print(f"Mock ISO 8583 (packé) → http://{HOST}:{PORT}")
    print("  Auth        POST /iso8583/auth/approve|decline")
    print("  Clearing    POST /iso8583/clearing/presentment")
    print("  Settlement  POST /iso8583/settlement/reconciliation")
    print("  Examples    GET  /iso8583/examples/auth-approve|clearing|settlement")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt.")
        server.server_close()
