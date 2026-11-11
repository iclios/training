#!/usr/bin/env python3
"""
Génère un PDF depuis une URL/page HTML via le protocole DevTools de Chrome
(Page.printToPDF), avec header/footer personnalisés — donc de vrais numéros
de page (« Page X / Y ») et aucun en-tête parasite (date/URL).

Zéro dépendance externe : client WebSocket minimal en bibliothèque standard.

Usage :
  print-pdf.py <fiche.html> <sortie.pdf> <root_absolu> [titre_court]

- <root_absolu> : racine du projet, pour réécrire ../css, ../js, ../img en
  chemins file:// absolus (headless ne résout pas les chemins relatifs).
- injecte css/support-a4.css et css/support-encarts.css (comme build-j1.sh).
"""
import base64
import hashlib
import json
import os
import re
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request

# ------------------------------------------------------------------ influx
src, out_pdf, root = sys.argv[1], sys.argv[2], sys.argv[3]
short_title = sys.argv[4] if len(sys.argv) > 4 else ""

src_abs = os.path.abspath(src)
html = open(src_abs, encoding="utf-8").read()
html = html.replace('href="../css/', 'href="file://%s/css/' % root)
html = html.replace('src="../js/',   'src="file://%s/js/'   % root)
html = html.replace('src="../img/',  'src="file://%s/img/'  % root)
html = html.replace(
    "</head>",
    '<link rel="stylesheet" href="file://%s/css/support-a4.css" />\n'
    '<link rel="stylesheet" href="file://%s/css/support-encarts.css" />\n</head>'
    % (root, root),
)
tmp_html = tempfile.NamedTemporaryFile(
    "w", suffix=".html", delete=False, encoding="utf-8"
)
tmp_html.write(html)
tmp_html.close()
page_url = "file://" + tmp_html.name

# ------------------------------------------------------- WebSocket minimal
def ws_connect(url):
    m = re.match(r"ws://([^:/]+):(\d+)(/.*)", url)
    host, port, path = m.group(1), int(m.group(2)), m.group(3)
    s = socket.create_connection((host, port))
    key = base64.b64encode(os.urandom(16)).decode()
    req = (
        "GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\n"
        "Connection: Upgrade\r\nSec-WebSocket-Key: %s\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n" % (path, host, port, key)
    )
    s.send(req.encode())
    resp = b""
    while b"\r\n\r\n" not in resp:
        resp += s.recv(4096)
    return s


def ws_send(s, payload):
    data = payload.encode()
    hdr = bytearray([0x81])
    ln = len(data)
    if ln < 126:
        hdr.append(0x80 | ln)
    elif ln < 65536:
        hdr.append(0x80 | 126)
        hdr += struct.pack(">H", ln)
    else:
        hdr.append(0x80 | 127)
        hdr += struct.pack(">Q", ln)
    mask = os.urandom(4)
    hdr += mask
    masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
    s.send(bytes(hdr) + masked)


def ws_recv(s):
    def recvn(n):
        buf = b""
        while len(buf) < n:
            chunk = s.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("closed")
            buf += chunk
        return buf

    b1, b2 = recvn(2)
    ln = b2 & 0x7F
    if ln == 126:
        ln = struct.unpack(">H", recvn(2))[0]
    elif ln == 127:
        ln = struct.unpack(">Q", recvn(8))[0]
    data = recvn(ln)
    return data.decode(errors="replace")


# --------------------------------------------------------------- Chrome
port = 9333
chrome = subprocess.Popen(
    [
        "google-chrome",
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--remote-debugging-port=%d" % port,
        "about:blank",
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
try:
    # attendre l'endpoint de debug
    ws_url = None
    for _ in range(50):
        try:
            data = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % port))
            for t in data:
                if t.get("type") == "page":
                    ws_url = t["webSocketDebuggerUrl"]
                    break
            if ws_url:
                break
        except Exception:
            pass
        time.sleep(0.2)
    if not ws_url:
        raise SystemExit("ECHEC: Chrome DevTools indisponible")

    s = ws_connect(ws_url)
    counter = [0]

    def call(method, params=None):
        counter[0] += 1
        mid = counter[0]
        ws_send(s, json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws_recv(s))
            if msg.get("id") == mid:
                return msg

    call("Page.enable")
    call("Page.navigate", {"url": page_url})
    time.sleep(3)  # laisser le rendu + polices

    footer = (
        '<div style="width:100%%;font-size:9px;font-family:Arial,sans-serif;'
        'color:#888;padding:0 13mm;display:flex;justify-content:space-between;">'
        "<span>%s</span>"
        '<span>Page <span class="pageNumber"></span> / '
        '<span class="totalPages"></span></span>'
        "</div>" % short_title
    )
    empty = '<div style="font-size:0;"></div>'

    res = call(
        "Page.printToPDF",
        {
            "printBackground": True,
            "displayHeaderFooter": True,
            "headerTemplate": empty,
            "footerTemplate": footer,
            "preferCSSPageSize": True,
        },
    )
    b64 = res["result"]["data"]
    open(out_pdf, "wb").write(base64.b64decode(b64))
    print("OK %s" % out_pdf)
finally:
    chrome.terminate()
    try:
        chrome.wait(timeout=5)
    except Exception:
        chrome.kill()
    os.unlink(tmp_html.name)
