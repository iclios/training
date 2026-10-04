(function initPresentMode() {
  if (window.__presentModeReady) return;
  window.__presentModeReady = true;

  const KEY = "cours-present-mode";

  let bar = document.querySelector(".present-bar");
  let btnEnter;
  let btnExit;

  if (bar) {
    btnEnter = bar.querySelector(".present-btn-enter");
    btnExit = bar.querySelector(".present-btn-exit");
    bar.querySelector(".present-btn-fs")?.remove();
  }

  if (!bar || !btnEnter || !btnExit) {
    bar = document.createElement("div");
    bar.className = "present-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Mode présentation");

    btnEnter = document.createElement("button");
    btnEnter.type = "button";
    btnEnter.className = "present-btn present-btn-enter";
    btnEnter.textContent = "Présenter";

    btnExit = document.createElement("button");
    btnExit.type = "button";
    btnExit.className = "present-btn present-btn-exit";
    btnExit.textContent = "Quitter";
    btnExit.hidden = true;

    bar.append(btnEnter, btnExit);

    const siteInner = document.querySelector(".site-bar-inner");
    if (siteInner) {
      siteInner.appendChild(bar);
    } else {
      document.body.appendChild(bar);
      bar.classList.add("is-floating");
    }
  }

  btnEnter.title = "Mode présentation (masque la navigation)";
  btnExit.title = "Quitter le mode présentation";

  function wanted() {
    return sessionStorage.getItem(KEY) === "1";
  }

  function setWanted(on) {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  }

  function mountInSiteBar() {
    const inner = document.querySelector(".site-bar-inner");
    bar.classList.remove("is-floating");
    if (inner) {
      inner.appendChild(bar);
    } else {
      document.body.appendChild(bar);
      bar.classList.add("is-floating");
    }
  }

  function mountFloating() {
    bar.classList.add("is-floating");
    document.body.appendChild(bar);
  }

  function syncUi() {
    const on = document.body.classList.contains("is-presenting");
    btnEnter.hidden = on;
    btnExit.hidden = !on;
  }

  function enter() {
    setWanted(true);
    document.body.classList.add("is-presenting");
    mountFloating();
    syncUi();
  }

  function exit() {
    setWanted(false);
    document.body.classList.remove("is-presenting");
    mountInSiteBar();
    syncUi();
  }

  btnEnter.addEventListener("click", () => {
    enter();
  });
  btnExit.addEventListener("click", () => {
    exit();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("is-presenting")) {
      exit();
    }
  });

  if (wanted()) enter();
  else syncUi();
})();
