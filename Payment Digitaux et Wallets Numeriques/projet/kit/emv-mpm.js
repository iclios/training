"use strict";

/** EMVCo QR MPM (Merchant-Presented) — TLV + CRC-16/CCITT-FALSE pédagogique */

function tlv(id, value) {
  const v = String(value);
  if (v.length > 99) throw new Error(`TLV ${id}: valeur trop longue`);
  return id + String(v.length).padStart(2, "0") + v;
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — EMV QR ID 63 */
function crc16CcittFalse(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseTlv(payload) {
  const map = {};
  let i = 0;
  const s = String(payload || "");
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    if (!Number.isFinite(len) || len < 0) break;
    const value = s.slice(i + 4, i + 4 + len);
    if (value.length !== len) break;
    map[id] = value;
    i += 4 + len;
  }
  return map;
}

function buildMpm({ amount, ref, merchantName = "PDWN DEMO", city = "PARIS" }) {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error("Montant invalide");
  const amountStr = amt.toFixed(2);
  const bill = String(ref || "").slice(0, 25);

  const mai = tlv("00", "fr.pdwn.formation") + tlv("01", "MERCHANT01");
  const additional = tlv("01", bill);

  const withoutCrc =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("26", mai) +
    tlv("52", "5411") +
    tlv("53", "978") +
    tlv("54", amountStr) +
    tlv("58", "FR") +
    tlv("59", merchantName.slice(0, 25)) +
    tlv("60", city.slice(0, 15)) +
    tlv("62", additional) +
    "6304";

  return withoutCrc + crc16CcittFalse(withoutCrc);
}

function decodeMpm(payload) {
  const raw = String(payload || "").trim();
  const tags = parseTlv(raw);
  const crcOk =
    tags["63"] != null &&
    raw.endsWith(tags["63"]) &&
    crc16CcittFalse(raw.slice(0, -4)) === tags["63"];

  const mai = tags["26"] ? parseTlv(tags["26"]) : {};
  const add = tags["62"] ? parseTlv(tags["62"]) : {};
  const amount = tags["54"] != null ? Number(tags["54"]) : null;

  return {
    ok: Boolean(tags["00"] === "01" && tags["01"] && crcOk),
    crcOk,
    payloadFormat: tags["00"] || null,
    poiMethod: tags["01"] || null,
    dynamic: tags["01"] === "12",
    guid: mai["00"] || null,
    merchantAccount: mai["01"] || null,
    mcc: tags["52"] || null,
    currency: tags["53"] || null,
    amount: Number.isFinite(amount) ? amount : null,
    country: tags["58"] || null,
    merchantName: tags["59"] || null,
    city: tags["60"] || null,
    billNumber: add["01"] || null,
    tags,
  };
}

module.exports = {
  tlv,
  crc16CcittFalse,
  parseTlv,
  buildMpm,
  decodeMpm,
};
