(function initAtelierPayLink() {
  const statusEl = document.getElementById("pay-sim-status");
  const linkLocal = document.getElementById("pay-sim-link-local");
  const linkLan = document.getElementById("pay-sim-link-lan");
  const refreshBtn = document.getElementById("pay-sim-refresh");
  if (!statusEl || !linkLocal || !linkLan) return;

  const PORT = 8790;

  function candidates() {
    const list = [
      "http://127.0.0.1:" + PORT,
      "http://localhost:" + PORT,
    ];
    if (location.hostname && location.hostname !== "localhost") {
      list.unshift(location.protocol + "//" + location.hostname + ":" + PORT);
    }
    return list;
  }

  function disableLinks() {
    linkLocal.href = "#";
    linkLan.href = "#";
    linkLocal.classList.add("is-disabled");
    linkLan.classList.add("is-disabled");
  }

  async function probe(base) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () {
      ctrl.abort();
    }, 900);
    try {
      const res = await fetch(base + "/api/meta", {
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function refresh() {
    statusEl.className = "atelier-pay-status";
    statusEl.textContent = "Détection du serveur simu…";
    disableLinks();

    let meta = null;
    const tried = candidates();
    for (let i = 0; i < tried.length; i++) {
      meta = await probe(tried[i]);
      if (meta && meta.baseUrl) break;
    }

    if (!meta) {
      statusEl.classList.add("is-ko");
      statusEl.textContent =
        "Serveur off — lancez : python3 atelier/j2-pay-sim/server.py puis rafraîchissez le lien.";
      return;
    }

    const localUrl = "http://127.0.0.1:" + PORT + "/marchand.html";
    const lanUrl = meta.baseUrl.replace(/\/$/, "") + "/marchand.html";

    linkLocal.href = localUrl;
    linkLocal.classList.remove("is-disabled");
    linkLocal.textContent = "Marchand (ce PC)";

    linkLan.href = lanUrl;
    linkLan.classList.remove("is-disabled");
    linkLan.textContent = "Marchand · " + (meta.lanIp || "Wi‑Fi");

    statusEl.classList.add("is-ok");
    statusEl.textContent =
      "Serveur OK · IP actuelle " +
      (meta.lanIp || "?") +
      " — utilisez le lien Wi‑Fi sur les téléphones (pas localhost).";
  }

  if (refreshBtn) refreshBtn.addEventListener("click", refresh);
  refresh();
})();
