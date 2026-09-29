(function initStaticDynamicLiveQr() {
  const root = document.getElementById("qr-live-demo");
  if (!root || typeof QRCode === "undefined") return;

  const TTL_SEC = 8;
  const STATIC_PAYLOAD =
    "PAY|MID:TRAIN|AMT:|CUR:XOF|REF:STAT|POI:11";

  const staticHost = document.getElementById("qr-live-static");
  const dynHost = document.getElementById("qr-live-dynamic");
  const staticPayloadEl = document.getElementById("qr-live-static-payload");
  const dynPayloadEl = document.getElementById("qr-live-dynamic-payload");
  const ttlEl = document.getElementById("qr-live-ttl");

  if (!staticHost || !dynHost) return;

  staticPayloadEl.textContent = STATIC_PAYLOAD;
  new QRCode(staticHost, {
    text: STATIC_PAYLOAD,
    width: 160,
    height: 160,
    correctLevel: QRCode.CorrectLevel.M,
  });

  let remaining = TTL_SEC;

  function buildDynamicPayload() {
    const ref = "DYN-" + Date.now().toString(36).toUpperCase();
    return (
      "PAY|MID:TRAIN|AMT:1500|CUR:XOF|REF:" +
      ref +
      "|POI:12|TTL:" +
      TTL_SEC +
      "s"
    );
  }

  function refreshDynamic() {
    const payload = buildDynamicPayload();
    dynPayloadEl.textContent = payload;
    remaining = TTL_SEC;
    ttlEl.textContent = "Expire dans " + remaining + " s — scannez maintenant";
    dynHost.innerHTML = "";
    new QRCode(dynHost, {
      text: payload,
      width: 160,
      height: 160,
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  refreshDynamic();

  setInterval(function () {
    remaining -= 1;
    if (remaining <= 0) {
      refreshDynamic();
      return;
    }
    ttlEl.textContent = "Expire dans " + remaining + " s — scannez maintenant";
  }, 1000);
})();

(function initPushPullLiveQr() {
  const root = document.getElementById("qr-push-pull-demo");
  if (!root || typeof QRCode === "undefined") return;

  const PULL_PAYLOAD =
    "PAY|MID:TRAIN|AMT:|CUR:XOF|REF:PULL-SHOP|POI:11|ROLE:MERCHANT";
  const PUSH_PAYLOAD =
    "PAY|FROM:CLIENT42|AMT:1500|CUR:XOF|REF:PUSH-DEMO|POI:12|ROLE:PAYER";

  const pullHost = document.getElementById("qr-pp-pull");
  const pushHost = document.getElementById("qr-pp-push");
  const pullPayloadEl = document.getElementById("qr-pp-pull-payload");
  const pushPayloadEl = document.getElementById("qr-pp-push-payload");

  if (!pullHost || !pushHost) return;

  pullPayloadEl.textContent = PULL_PAYLOAD;
  new QRCode(pullHost, {
    text: PULL_PAYLOAD,
    width: 160,
    height: 160,
    correctLevel: QRCode.CorrectLevel.M,
  });

  pushPayloadEl.textContent = PUSH_PAYLOAD;
  new QRCode(pushHost, {
    text: PUSH_PAYLOAD,
    width: 160,
    height: 160,
    correctLevel: QRCode.CorrectLevel.M,
  });
})();
