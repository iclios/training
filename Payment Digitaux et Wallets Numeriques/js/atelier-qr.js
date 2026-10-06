(function initAtelierQrGen() {
  const input = document.getElementById("atelier-qr-input");
  const host = document.getElementById("atelier-qr-frame");
  const meta = document.getElementById("atelier-qr-meta");
  if (!input || !host || typeof QRCode === "undefined") return;

  let timer = null;

  function render() {
    const text = input.value;
    host.innerHTML = "";
    if (!text.trim()) {
      if (meta) meta.textContent = "Saisissez un texte pour générer le QR.";
      return;
    }
    try {
      new QRCode(host, {
        text: text,
        width: 200,
        height: 200,
        correctLevel: QRCode.CorrectLevel.M,
      });
      if (meta) {
        meta.textContent =
          text.length +
          " caractère" +
          (text.length > 1 ? "s" : "") +
          " · scannable avec le téléphone « client »";
      }
    } catch (err) {
      if (meta) {
        meta.textContent =
          "Texte trop long ou invalide pour un QR (réduisez la saisie).";
      }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 120);
  }

  input.addEventListener("input", schedule);

  document.querySelectorAll("[data-atelier-qr]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const sample = btn.getAttribute("data-atelier-qr");
      if (sample == null) return;
      input.value = sample;
      render();
      input.focus();
    });
  });

  render();
})();
