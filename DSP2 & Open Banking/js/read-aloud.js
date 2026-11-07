/**
 * Lecture audio native (Web Speech API) — auto-injecte un bouton « Écouter ».
 * - Lit le contenu texte de la page (hors navigation, footer, notes formateur).
 * - Ignore les <details> fermés (encarts Cours repliés).
 * - Se masque si le navigateur ne supporte pas la synthèse vocale.
 */
(function initReadAloud() {
  if (!("speechSynthesis" in window) || window.__readAloudReady) return;
  window.__readAloudReady = true;

  const synth = window.speechSynthesis;

  function pickVoice() {
    const voices = synth.getVoices();
    if (!voices.length) return null;
    const fr = voices.filter((v) => /^fr/i.test(v.lang));
    if (fr.length) {
      return fr.find((v) => /google|natural|premium|amelie|thomas/i.test(v.name)) || fr[0];
    }
    return voices[0];
  }

  function collectText() {
    const main = document.querySelector("main") || document.body;
    const chunks = [];

    function skip(parent) {
      if (!parent) return true;
      if (
        parent.closest("[data-no-read]") ||
        parent.closest(".trainer-notes") ||
        parent.closest(".site-bar") ||
        parent.closest(".site-foot") ||
        parent.closest(".present-bar") ||
        parent.closest(".bloc-sidebar") ||
        parent.closest(".bloc-pager") ||
        parent.closest(".block-map")
      ) {
        return true;
      }
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "SVG" || tag === "NAV") return true;
      const details = parent.closest("details");
      if (details && !details.open) return true;
      return false;
    }

    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const txt = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (txt.length < 2) continue;
      if (skip(node.parentElement)) continue;
      chunks.push(txt);
    }
    return chunks;
  }

  function buildBar() {
    const bar = document.createElement("div");
    bar.className = "read-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Lecture audio");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "read-btn read-btn-main";
    btn.textContent = "🔊 Écouter";

    const stop = document.createElement("button");
    stop.type = "button";
    stop.className = "read-btn read-btn-stop";
    stop.textContent = "■ Stop";
    stop.hidden = true;

    const state = document.createElement("span");
    state.className = "read-state";
    state.setAttribute("aria-live", "polite");

    bar.appendChild(btn);
    bar.appendChild(stop);
    bar.appendChild(state);

    const header = document.querySelector(".site-bar");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(bar, header.nextSibling);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    return { bar, btn, stop, state };
  }

  const { bar, btn, stop, state } = buildBar();
  let speaking = false;
  let paused = false;

  function resetUI() {
    speaking = false;
    paused = false;
    btn.hidden = false;
    btn.textContent = "🔊 Écouter";
    stop.hidden = true;
    state.textContent = "";
    bar.classList.remove("is-speaking");
  }

  function speak() {
    const chunks = collectText();
    if (!chunks.length) {
      state.textContent = "Aucun contenu à lire.";
      return;
    }

    synth.cancel();
    const voice = pickVoice();
    let i = 0;
    speaking = true;
    paused = false;
    btn.hidden = true;
    stop.hidden = false;
    bar.classList.add("is-speaking");

    function next() {
      if (!speaking) return;
      if (i >= chunks.length) {
        resetUI();
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[i]);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : "fr-FR";
      u.rate = 0.98;
      u.pitch = 1;
      u.onend = () => {
        i += 1;
        state.textContent = i + "/" + chunks.length;
        next();
      };
      u.onerror = () => {
        i += 1;
        next();
      };
      synth.speak(u);
      state.textContent = i + 1 + "/" + chunks.length;
    }

    next();
  }

  btn.addEventListener("click", () => {
    if (paused) {
      synth.resume();
      paused = false;
      btn.textContent = "⏸ Pause";
      return;
    }
    if (speaking) {
      synth.pause();
      paused = true;
      btn.textContent = "▶ Reprendre";
      return;
    }
    btn.textContent = "⏸ Pause";
    speak();
  });

  stop.addEventListener("click", () => {
    speaking = false;
    synth.cancel();
    resetUI();
  });

  window.addEventListener("beforeunload", () => synth.cancel());
  document.querySelectorAll(".bloc-pager a").forEach((a) => {
    a.addEventListener("click", () => synth.cancel());
  });

  // Si le navigateur n'a aucune voix, on n'affiche pas une barre inutile.
  const checkVoices = () => {
    if (synth.getVoices().length === 0) {
      setTimeout(() => {
        if (synth.getVoices().length === 0) bar.hidden = true;
      }, 1500);
    }
  };
  if (typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", checkVoices);
  }
  checkVoices();
})();
