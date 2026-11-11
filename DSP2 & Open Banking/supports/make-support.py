#!/usr/bin/env python3
"""
Génère le PDF d'un support étudiant avec :
  - une page « Sommaire » (titres + numéros de page réels),
  - un pied de page « Page X / Y » (via DevTools printToPDF).

Principe (2 passes) :
  1. passe de repérage : on rend le doc sans sommaire, on repère sur quelle
     page commence chaque bloc (recherche du titre dans le texte du PDF),
  2. on injecte la page sommaire (avec ces numéros) juste après la couverture,
     puis on rend le PDF final.

Usage :
  make-support.py <support.html> <sortie.pdf> <titre_court> [cle1,cle2,...]

  Les clés (facultatif) servent au repérage : par défaut on cherche le titre
  de chaque bloc. On peut passer le libellé exact attendu dans le texte.
"""
import base64
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

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# ------------------------------------------------------------- DevTools / WS
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
    hdr += bytes(b ^ mask[i % 4] for i, b in enumerate(data))
    s.send(bytes(hdr))


def ws_recv(s):
    def recvn(n):
        buf = b""
        while len(buf) < n:
            c = s.recv(n - len(buf))
            if not c:
                raise ConnectionError("closed")
            buf += c
        return buf

    b1, b2 = recvn(2)
    ln = b2 & 0x7F
    if ln == 126:
        ln = struct.unpack(">H", recvn(2))[0]
    elif ln == 127:
        ln = struct.unpack(">Q", recvn(8))[0]
    return recvn(ln).decode(errors="replace")


class Chrome:
    def __init__(self, port=9334):
        self.port = port
        self.proc = subprocess.Popen(
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
        self.ws = None
        self.counter = [0]
        for _ in range(60):
            try:
                data = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % port))
                for t in data:
                    if t.get("type") == "page":
                        self.ws = ws_connect(t["webSocketDebuggerUrl"])
                        break
                if self.ws:
                    break
            except Exception:
                pass
            time.sleep(0.2)
        if not self.ws:
            raise SystemExit("ECHEC: DevTools indisponible")
        self.call("Page.enable")

    def call(self, method, params=None):
        self.counter[0] += 1
        mid = self.counter[0]
        ws_send(self.ws, json.dumps({"id": mid, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws_recv(self.ws))
            if msg.get("id") == mid:
                return msg

    def render(self, html_path, out_pdf, short_title, wait=3.0):
        self.call("Page.navigate", {"url": "file://" + os.path.abspath(html_path)})
        time.sleep(wait)
        footer = (
            '<div style="width:100%%;font-size:9px;font-family:Arial,sans-serif;'
            'color:#888;padding:0 13mm;display:flex;justify-content:space-between;">'
            "<span>%s</span>"
            '<span>Page <span class="pageNumber"></span> / '
            '<span class="totalPages"></span></span></div>' % short_title
        )
        res = self.call(
            "Page.printToPDF",
            {
                "printBackground": True,
                "displayHeaderFooter": True,
                "headerTemplate": '<div style="font-size:0;"></div>',
                "footerTemplate": footer,
                "preferCSSPageSize": True,
            },
        )
        open(out_pdf, "wb").write(base64.b64decode(res["result"]["data"]))

    def close(self):
        self.proc.terminate()
        try:
            self.proc.wait(timeout=5)
        except Exception:
            self.proc.kill()


# ------------------------------------------------------------------ outillage
def prepare_html(src, extra_css=()):
    html = open(src, encoding="utf-8").read()
    html = html.replace('href="../css/', 'href="file://%s/css/' % ROOT)
    html = html.replace('src="../js/',   'src="file://%s/js/'   % ROOT)
    html = html.replace('src="../img/',  'src="file://%s/img/'  % ROOT)
    links = "".join(
        '<link rel="stylesheet" href="file://%s/css/%s" />\n' % (ROOT, c)
        for c in ("support-a4.css", "support-encarts.css") + tuple(extra_css)
    )
    html = html.replace("</head>", links + "</head>")
    return html


def extract_toc(html):
    """Liste (num, label) des blocs, dans l'ordre."""
    items = []
    for m in re.finditer(r'<article class="support-bloc"[^>]*data-num="(\d+)"[^>]*>(.*?)</article>', html, re.S):
        num, inner = m.group(1), m.group(2)
        h = re.search(r"<h1>(.*?)</h1>", inner, re.S)
        label = re.sub(r"<[^>]+>", "", h.group(1)).strip() if h else num
        label = label.replace("&nbsp;", " ").replace("&amp;", "&").strip()
        items.append((num, label))
    return items


def _page_text(pdf_path, p):
    return subprocess.run(
        ["pdftotext", "-f", str(p), "-l", str(p), pdf_path, "-"],
        capture_output=True, text=True,
    ).stdout


def find_toc_page(pdf_path, npages):
    """Page où se trouve le sommaire (« Sommaire » + entrées)."""
    for p in range(1, npages + 1):
        if "sommaire" in _page_text(pdf_path, p).lower():
            return p
    return None


def page_of_block(pdf_path, label, npages, skip_pages=()):
    """Trouve la 1re page (hors sommaire) où apparaît le label."""
    probe = re.sub(r"\s+", " ", label)[:40].strip()
    for p in range(1, npages + 1):
        if p in skip_pages:
            continue
        norm = re.sub(r"\s+", " ", _page_text(pdf_path, p))
        if probe and probe.lower() in norm.lower():
            return p
    return None


def build_toc_html(toc_items, pages):
    lis = []
    for (num, label) in toc_items:
        pg = pages.get(num, "")
        lis.append(
            '<li class="support-toc-item">'
            '<span class="support-toc-num">%s</span>'
            '<span class="support-toc-label">%s</span>'
            '<span class="support-toc-leader"></span>'
            '<span class="support-toc-page">%s</span>'
            "</li>" % (num, label, pg)
        )
    return (
        '<section class="support-toc" id="support-toc">'
        '<h1 class="support-toc-title">Sommaire</h1>'
        '<p class="support-toc-sub">Repères de lecture du polycopié</p>'
        '<ul class="support-toc-list">' + "".join(lis) + "</ul>"
        "</section>"
    )


def inject_toc(html, toc_html):
    # insérer juste après la page de couverture
    anchor = "</section>"
    idx = html.find('class="support-title-page"')
    if idx == -1:
        return html
    end = html.find(anchor, idx)
    if end == -1:
        return html
    end += len(anchor)
    return html[:end] + "\n" + toc_html + "\n" + html[end:]


# ---------------------------------------------------------------------- main
def with_toc_shell(html, toc_items, pages=None):
    """Injecte le sommaire (pages éventuellement vides »—») + le CSS TOC."""
    toc_html = build_toc_html(toc_items, pages or {})
    out = inject_toc(html, toc_html)
    return out.replace(
        "</head>",
        '<link rel="stylesheet" href="file://%s/css/support-toc.css" />\n</head>' % ROOT,
    )


def main():
    src, out_pdf, short_title = sys.argv[1], sys.argv[2], sys.argv[3]
    base_html = prepare_html(src)
    toc_items = extract_toc(base_html)

    chrome = Chrome()
    try:
        with tempfile.TemporaryDirectory() as td:
            # --- passe 1 : le doc AVEC la page sommaire (numéros « — »),
            #     pour que la pagination soit déjà la pagination finale.
            pass1_html = with_toc_shell(base_html, toc_items)
            pass1 = os.path.join(td, "pass1.html")
            open(pass1, "w", encoding="utf-8").write(pass1_html)
            pass1_pdf = os.path.join(td, "pass1.pdf")
            chrome.render(pass1, pass1_pdf, short_title)

            npages = 0
            info = subprocess.run(["pdfinfo", pass1_pdf], capture_output=True, text=True).stdout
            m = re.search(r"Pages:\s+(\d+)", info)
            if m:
                npages = int(m.group(1))

            toc_page = find_toc_page(pass1_pdf, npages)
            skip = {toc_page} if toc_page else set()

            pages = {}
            start = 1
            for num, label in toc_items:
                pg = page_of_block(
                    pass1_pdf, label, npages, skip_pages=skip | set(range(1, start))
                )
                if pg is None:
                    pg = start
                pages[num] = pg
                start = pg + 1

            # --- passe 2 : mêmes pages, sommaire complété avec les vrais numéros.
            final_html = with_toc_shell(base_html, toc_items, pages)
            final_path = os.path.join(td, "final.html")
            open(final_path, "w", encoding="utf-8").write(final_html)
            chrome.render(final_path, out_pdf, short_title)
    finally:
        chrome.close()

    print("OK %s" % out_pdf)
    print(
        subprocess.run(["pdfinfo", out_pdf], capture_output=True, text=True)
        .stdout.split("Page size")[0]
        .strip()
    )


if __name__ == "__main__":
    main()
