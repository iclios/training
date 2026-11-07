(function () {
  "use strict";

  const META = window.EXAMEN_META;
  const QUESTIONS = window.EXAMEN_QUESTIONS;
  const STORAGE_KEY = "examen-pdwn-v1";

  const el = {
    screenStart: document.getElementById("screen-start"),
    screenExam: document.getElementById("screen-exam"),
    screenEnd: document.getElementById("screen-end"),
    formStart: document.getElementById("form-start"),
    qMount: document.getElementById("q-mount"),
    progressBar: document.getElementById("progress-bar"),
    progressLabel: document.getElementById("progress-label"),
    btnPrev: document.getElementById("btn-prev"),
    btnNext: document.getElementById("btn-next"),
    btnFinish: document.getElementById("btn-finish"),
    dotNav: document.getElementById("dot-nav"),
    studentChip: document.getElementById("student-chip"),
    endSummary: document.getElementById("end-summary"),
    btnExport: document.getElementById("btn-export"),
    btnCopy: document.getElementById("btn-copy"),
  };

  const state = {
    student: { nom: "", prenom: "" },
    index: 0,
    answers: {},
    startedAt: null,
    endedAt: null,
    locked: false,
    selectedPalette: null,
  };

  function showScreen(name) {
    el.screenStart.classList.toggle("is-active", name === "start");
    el.screenExam.classList.toggle("is-active", name === "exam");
    el.screenEnd.classList.toggle("is-active", name === "end");
  }

  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          student: state.student,
          index: state.index,
          answers: state.answers,
          startedAt: state.startedAt,
          endedAt: state.endedAt,
          locked: !!state.locked,
        })
      );
    } catch (_) {
      /* ignore quota */
    }
  }

  /** @returns {"locked"|"active"|null} */
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data) return null;
      state.student = data.student || state.student;
      state.index = Math.min(data.index || 0, QUESTIONS.length - 1);
      state.answers = data.answers || {};
      state.startedAt = data.startedAt || null;
      state.endedAt = data.endedAt || null;
      state.locked = !!(data.locked || data.endedAt);
      if (state.locked && state.endedAt) return "locked";
      if (data.startedAt) return "active";
      return null;
    } catch (_) {
      return null;
    }
  }

  function renderEndSummary() {
    const answered = QUESTIONS.filter(isAnswered).length;
    el.endSummary.innerHTML = `
      <p><strong>${escapeHtml(state.student.prenom)} ${escapeHtml(
        state.student.nom
      )}</strong></p>
      <p>${answered} / ${QUESTIONS.length} questions renseignées.</p>
      <p>Session verrouillée sur cet ordinateur — l’épreuve ne peut plus être reprise ici.</p>
      <p>Aucune note n’est calculée ici. Exportez le fichier JSON et remettez-le à l’enseignant.</p>
    `;
  }

  function updateChrome() {
    const n = QUESTIONS.length;
    const i = state.index + 1;
    el.progressLabel.textContent = `${i} / ${n}`;
    el.progressBar.style.width = `${(i / n) * 100}%`;
    const name = [state.student.prenom, state.student.nom].filter(Boolean).join(" ");
    el.studentChip.textContent = name || "Étudiant";
    renderDots();
  }

  function isAnswered(q) {
    const a = state.answers[q.id];
    if (!a) return false;
    if (q.type === "libre") return String(a.text || "").trim().length > 0;
    if (q.type === "unique") return !!a.choice;
    if (q.type === "qcm") return Array.isArray(a.choices) && a.choices.length > 0;
    if (q.type === "ordre") return Array.isArray(a.order) && a.order.length === q.items.length;
    if (q.type === "schema") {
      const slots = a.slots || {};
      return q.slots.every((s) => slots[s.id]);
    }
    if (q.type === "action") {
      const fields = a.fields || {};
      return (q.fields || []).every((f) => {
        if (f.kind === "unique") return !!fields[f.id];
        return String(fields[f.id] || "").trim().length > 0;
      });
    }
    return false;
  }

  function renderDots() {
    el.dotNav.innerHTML = "";
    QUESTIONS.forEach((q, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.textContent = String(idx + 1);
      b.title = `Question ${idx + 1}`;
      b.setAttribute("aria-label", `Question ${idx + 1}`);
      if (idx === state.index) b.classList.add("is-current");
      if (isAnswered(q)) b.classList.add("is-answered");
      b.addEventListener("click", () => {
        collectCurrent();
        state.index = idx;
        persist();
        renderQuestion();
      });
      el.dotNav.appendChild(b);
    });
  }

  /** Met à jour les pastilles sans reconstruire le DOM (évite de perdre le focus). */
  function refreshDotStates() {
    const buttons = el.dotNav.querySelectorAll(".dot");
    QUESTIONS.forEach((q, idx) => {
      const b = buttons[idx];
      if (!b) return;
      b.classList.toggle("is-current", idx === state.index);
      b.classList.toggle("is-answered", isAnswered(q));
    });
  }

  function collectCurrent() {
    const q = QUESTIONS[state.index];
    if (!q) return;
    const root = el.qMount;

    if (q.type === "unique") {
      const checked = root.querySelector('input[name="choice"]:checked');
      state.answers[q.id] = { choice: checked ? checked.value : null };
    } else if (q.type === "qcm") {
      const checked = [...root.querySelectorAll('input[name="choice"]:checked')].map(
        (x) => x.value
      );
      state.answers[q.id] = { choices: checked };
    } else if (q.type === "libre") {
      const ta = root.querySelector("textarea");
      state.answers[q.id] = { text: ta ? ta.value : "" };
    } else if (q.type === "action") {
      const fields = {};
      (q.fields || []).forEach((f) => {
        if (f.kind === "unique") {
          const checked = root.querySelector(
            `input[name="field-${f.id}"]:checked`
          );
          fields[f.id] = checked ? checked.value : null;
        } else {
          const inp = root.querySelector(
            `textarea[data-field="${f.id}"], [data-field="${f.id}"]`
          );
          fields[f.id] = inp ? inp.value : "";
        }
      });
      state.answers[q.id] = { fields };
    } else if (q.type === "ordre") {
      const items = [...root.querySelectorAll(".ordre-item")].map((li) => li.dataset.value);
      state.answers[q.id] = { order: items };
    } else if (q.type === "schema") {
      /* already updated live */
      if (!state.answers[q.id]) state.answers[q.id] = { slots: {} };
    }
    persist();
    refreshDotStates();
  }

  function typeLabel(t) {
    return (
      {
        unique: "Choix unique",
        qcm: "Choix multiples",
        ordre: "Ordre",
        libre: "Réponse libre",
        schema: "Schéma",
        action: "Action · téléphone",
      }[t] || t
    );
  }

  function formatPoints(p) {
    const n = Number(p);
    if (!Number.isFinite(n)) return "—";
    return Number.isInteger(n) ? String(n) : String(n).replace(".", ",");
  }

  function typeHint(q) {
    if (q.hint) return q.hint;
    if (q.type === "unique") return "Une seule bonne réponse.";
    if (q.type === "qcm") return "Plusieurs réponses possibles — cochez toutes celles qui conviennent.";
    if (q.type === "action") return "Utilisez votre téléphone si la consigne le demande.";
    return "";
  }

  function renderQuestion() {
    const q = QUESTIONS[state.index];
    state.selectedPalette = null;
    updateChrome();
    el.btnPrev.disabled = state.index === 0;
    el.btnNext.hidden = state.index >= QUESTIONS.length - 1;
    el.btnFinish.hidden = state.index < QUESTIONS.length - 1;

    const ans = state.answers[q.id] || {};
    let body = "";

    if (q.type === "unique" || q.type === "qcm") {
      const multi = q.type === "qcm";
      body = `<div class="choices">
        ${q.choices
          .map(
            (c) => `
          <label class="choice">
            <input type="${multi ? "checkbox" : "radio"}" name="choice" value="${c.id}"
              ${
                multi
                  ? (ans.choices || []).includes(c.id)
                    ? "checked"
                    : ""
                  : ans.choice === c.id
                    ? "checked"
                    : ""
              } />
            <span>${escapeHtml(c.label)}</span>
          </label>`
          )
          .join("")}
      </div>`;
    } else if (q.type === "libre") {
      body = `<textarea placeholder="${escapeHtml(
        q.placeholder || "Votre réponse…"
      )}">${escapeHtml(ans.text || "")}</textarea>`;
    } else if (q.type === "ordre") {
      const order = ans.order && ans.order.length ? ans.order : shuffle([...q.items]);
      if (!ans.order) state.answers[q.id] = { order };
      body = `<ul class="ordre-list" id="ordre-list">
        ${order
          .map(
            (item, i) => `
          <li class="ordre-item" draggable="true" data-value="${escapeAttr(item)}">
            <span class="ordre-n">${i + 1}</span>
            <span>${escapeHtml(item)}</span>
          </li>`
          )
          .join("")}
      </ul>`;
    } else if (q.type === "schema") {
      const slots = ans.slots || {};
      state.answers[q.id] = { slots: { ...slots } };
      body = renderSchema(q, slots);
    } else if (q.type === "action") {
      if (!state.answers[q.id]) state.answers[q.id] = { fields: {} };
      const fieldsAns = state.answers[q.id].fields || {};
      body = renderActionFields(q, fieldsAns);
    }

    const isScan = q.type === "action" && q.actionKind === "scan-qr";
    const isPhone = q.type === "action" && q.actionKind === "phone";
    const visual = q.image
      ? `<figure class="q-visual${isScan ? " q-visual--scan" : ""}">
          <img src="${escapeAttr(q.image)}" alt="${
            isScan
              ? "QR code à scanner avec votre téléphone"
              : escapeAttr(q.imageAlt || "")
          }" loading="lazy" />
          ${
            isScan
              ? `<figcaption>${escapeHtml(
                  q.imageCaption ||
                    "Scannez ce QR avec la caméra de votre téléphone"
                )}</figcaption>`
              : q.imageCaption
                ? `<figcaption>${escapeHtml(q.imageCaption)}</figcaption>`
                : ""
          }
        </figure>`
      : "";

    const actionBanner =
      q.type === "action"
        ? `<div class="action-banner" role="note">
            <strong>Action</strong>
            <span>${escapeHtml(
              q.actionLabel ||
                (isPhone
                  ? "Sortez votre téléphone et suivez la consigne (réglages, app, observation)."
                  : "Sortez votre téléphone et suivez la consigne ci-dessous.")
            )}</span>
          </div>`
        : "";

    el.qMount.innerHTML = `
      <div class="q-head">
        <span class="chip">${escapeHtml(q.jour)}</span>
        <span class="chip">${escapeHtml(q.theme)}</span>
        <span class="chip">${escapeHtml(typeLabel(q.type))}</span>
        <span class="chip chip-points">${formatPoints(q.points)}&nbsp;pt${
          Number(q.points) > 1 ? "s" : ""
        }</span>
      </div>
      ${actionBanner}
      ${visual}
      <p class="q-prompt">${escapeHtml(q.prompt)}</p>
      ${(() => {
        const h = typeHint(q);
        return h ? `<p class="q-hint">${escapeHtml(h)}</p>` : "";
      })()}
      ${body}
    `;

    if (q.type === "ordre") bindOrdre();
    if (q.type === "schema") bindSchema(q);
    if (q.type === "libre") {
      el.qMount.querySelector("textarea")?.addEventListener("input", () => collectCurrent());
    }
    if (q.type === "unique" || q.type === "qcm") {
      el.qMount.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("change", () => collectCurrent());
      });
    }
    if (q.type === "action") {
      el.qMount.querySelectorAll("textarea, input").forEach((inp) => {
        inp.addEventListener("input", () => collectCurrent());
        inp.addEventListener("change", () => collectCurrent());
      });
    }
  }

  function renderActionFields(q, fieldsAns) {
    return `<div class="action-fields">
      ${(q.fields || [])
        .map((f) => {
          if (f.kind === "unique") {
            return `<fieldset class="action-field">
              <legend>${escapeHtml(f.label)}</legend>
              <div class="choices">
                ${(f.choices || [])
                  .map(
                    (c) => `
                  <label class="choice">
                    <input type="radio" name="field-${escapeAttr(f.id)}" value="${escapeAttr(
                      c.id
                    )}" ${fieldsAns[f.id] === c.id ? "checked" : ""} />
                    <span>${escapeHtml(c.label)}</span>
                  </label>`
                  )
                  .join("")}
              </div>
            </fieldset>`;
          }
          return `<label class="action-field">
            <span class="action-field-label">${escapeHtml(f.label)}</span>
            <textarea data-field="${escapeAttr(f.id)}" placeholder="${escapeAttr(
              f.placeholder || "Votre observation…"
            )}">${escapeHtml(fieldsAns[f.id] || "")}</textarea>
          </label>`;
        })
        .join("")}
    </div>`;
  }

  function renderSchema(q, slots) {
    const used = new Set(Object.values(slots).filter(Boolean));
    const viewBox = q.viewBox || "0 0 1000 420";
    const decor = (q.decor || [])
      .map((d) => {
        if (d.type === "label") {
          return `<text x="${d.x}" y="${d.y}" text-anchor="${d.anchor || "middle"}" fill="${
            d.fill || "#5a6b7c"
          }" font-size="${d.size || 12}" font-weight="700" letter-spacing="0.04em">${escapeHtml(
            d.text
          )}</text>`;
        }
        if (d.type === "arrow") {
          return `<path d="M${d.x1} ${d.y1} L${d.x2} ${d.y2}" stroke="#0d9f8a" stroke-width="2" marker-end="url(#ah-schema)" fill="none"/>`;
        }
        if (d.type === "note") {
          return `<text x="${d.x}" y="${d.y}" text-anchor="${d.anchor || "middle"}" fill="${
            d.fill || "#8a9aaa"
          }" font-size="${d.size || 11}">${escapeHtml(d.text)}</text>`;
        }
        if (d.type === "image") {
          return `<image href="${escapeAttr(d.href)}" x="${d.x}" y="${d.y}" width="${
            d.w || 48
          }" height="${d.h || 48}" preserveAspectRatio="xMidYMid slice" />`;
        }
        return "";
      })
      .join("");

    const svgSlots = q.slots
      .map((s) => {
        const val = slots[s.id] || "";
        const filled = val ? " is-filled" : "";
        const caption = s.caption
          ? `<text class="schema-caption" x="${s.x + s.w / 2}" y="${
              s.y - 8
            }" text-anchor="middle" fill="#087a6a" font-size="11" font-weight="700">${escapeHtml(
              s.caption
            )}</text>`
          : "";
        const inner = val || s.placeholder || "…";
        return `
        <g class="schema-slot${filled}" data-slot="${s.id}">
          ${caption}
          <rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="10"/>
          <text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 5}" text-anchor="middle">${escapeHtml(
            inner
          )}</text>
        </g>`;
      })
      .join("");

    const palette = q.palette
      .map((p) => {
        const cls = [
          "schema-chip",
          used.has(p) ? "is-used" : "",
          state.selectedPalette === p ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="${cls}" data-palette="${escapeAttr(p)}">${escapeHtml(
          p
        )}</button>`;
      })
      .join("");

    const title = q.schemaTitle || "Schéma à compléter";
    const subtitle = q.schemaSubtitle
      ? `<p class="schema-subtitle">${escapeHtml(q.schemaSubtitle)}</p>`
      : "";

    return `
      <div class="schema-board">
        <p class="schema-title">${escapeHtml(title)}</p>
        ${subtitle}
        <div class="schema-svg-wrap">
          <svg viewBox="${escapeAttr(viewBox)}" role="img" aria-label="${escapeAttr(title)}">
            <defs>
              <marker id="ah-schema" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#0d9f8a" />
              </marker>
            </defs>
            ${decor}
            ${svgSlots}
          </svg>
        </div>
        <p class="schema-how">1) Cliquez une étiquette · 2) Cliquez la case correspondante</p>
        <div class="schema-palette">${palette}</div>
      </div>`;
  }

  function bindSchema(q) {
    el.qMount.querySelectorAll("[data-palette]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedPalette = btn.dataset.palette;
        const slots = state.answers[q.id].slots || {};
        el.qMount.querySelector(".schema-board").outerHTML = renderSchema(q, slots);
        bindSchema(q);
      });
    });
    el.qMount.querySelectorAll("[data-slot]").forEach((g) => {
      g.addEventListener("click", () => {
        if (!state.selectedPalette) return;
        const slots = { ...(state.answers[q.id].slots || {}) };
        // remove palette from other slots
        Object.keys(slots).forEach((k) => {
          if (slots[k] === state.selectedPalette) delete slots[k];
        });
        slots[g.dataset.slot] = state.selectedPalette;
        state.answers[q.id] = { slots };
        state.selectedPalette = null;
        persist();
        el.qMount.querySelector(".schema-board").outerHTML = renderSchema(q, slots);
        bindSchema(q);
        updateChrome();
      });
    });
  }

  function bindOrdre() {
    const list = document.getElementById("ordre-list");
    if (!list) return;
    let dragEl = null;
    list.querySelectorAll(".ordre-item").forEach((item) => {
      item.addEventListener("dragstart", () => {
        dragEl = item;
        item.classList.add("is-drag");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("is-drag");
        dragEl = null;
        renumberOrdre(list);
        collectCurrent();
      });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        const over = e.currentTarget;
        if (!dragEl || dragEl === over) return;
        const rect = over.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        list.insertBefore(dragEl, before ? over : over.nextSibling);
      });
    });
  }

  function renumberOrdre(list) {
    [...list.children].forEach((li, i) => {
      const n = li.querySelector(".ordre-n");
      if (n) n.textContent = String(i + 1);
    });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function choiceLabel(q, id) {
    const c = (q.choices || []).find((x) => x.id === id);
    return c ? c.label : id;
  }

  function fieldChoiceLabel(field, id) {
    const c = (field.choices || []).find((x) => x.id === id);
    return c ? c.label : id;
  }

  function sameIdSet(a, b) {
    const aa = [...(a || [])].map(String).sort();
    const bb = [...(b || [])].map(String).sort();
    return aa.length === bb.length && aa.every((v, i) => v === bb[i]);
  }

  /** Correction export formateur : auto pour QCU/QCM/ordre/schéma ; libre = appréciation. */
  function buildCorrectExport(q) {
    if (q.type === "libre") {
      return {
        mode: "appreciation_enseignant",
        note: null,
        ideeDirectrice: q.ideeDirectrice || null,
      };
    }
    if (q.type === "unique") {
      const ids = q.correct || [];
      return {
        mode: "auto",
        ids,
        labels: ids.map((id) => choiceLabel(q, id)),
      };
    }
    if (q.type === "qcm") {
      const ids = q.correct || [];
      return {
        mode: "auto",
        ids,
        labels: ids.map((id) => choiceLabel(q, id)),
      };
    }
    if (q.type === "ordre") {
      return {
        mode: "auto",
        order: q.order || [],
      };
    }
    if (q.type === "schema") {
      return {
        mode: "auto",
        slots: q.correctSlots || {},
      };
    }
    if (q.type === "action") {
      const ref = q.correct || {};
      const fields = {};
      (q.fields || []).forEach((f) => {
        if (f.kind === "unique") {
          const ids = ref[f.id] || [];
          fields[f.id] = {
            mode: "auto",
            label: f.label,
            ids,
            labels: ids.map((id) => fieldChoiceLabel(f, id)),
          };
        } else {
          const hintKey = `${f.id}Hint`;
          fields[f.id] = {
            mode: "appreciation_enseignant",
            label: f.label,
            note: null,
            /* indice formateur éventuel — pas une note */
            indice:
              ref[hintKey] ||
              (f.id === "payload" ? ref.payloadHint : null) ||
              null,
          };
        }
      });
      return {
        mode: "mixte",
        fields,
        ideeDirectrice: ref.idea || null,
      };
    }
    return { mode: "appreciation_enseignant", note: null };
  }

  function buildAutoEval(q, answer) {
    const pointsMax = Number(q.points) || 0;

    if (q.type === "libre") {
      return {
        status: "a_corriger",
        pointsObtenus: null,
        pointsMax,
        commentaire: "Réponse libre — notation à l’appréciation de l’enseignant.",
      };
    }

    if (q.type === "unique") {
      const ok =
        !!answer?.choice &&
        Array.isArray(q.correct) &&
        q.correct.map(String).includes(String(answer.choice));
      return {
        status: ok ? "ok" : "ko",
        pointsObtenus: ok ? pointsMax : 0,
        pointsMax,
      };
    }

    if (q.type === "qcm") {
      const given = answer?.choices || [];
      const ok = sameIdSet(given, q.correct || []);
      return {
        status: ok ? "ok" : "ko",
        pointsObtenus: ok ? pointsMax : 0,
        pointsMax,
      };
    }

    if (q.type === "ordre") {
      const given = answer?.order || [];
      const expected = q.order || [];
      const ok =
        given.length === expected.length &&
        given.every((v, i) => v === expected[i]);
      return {
        status: ok ? "ok" : "ko",
        pointsObtenus: ok ? pointsMax : 0,
        pointsMax,
      };
    }

    if (q.type === "schema") {
      const slots = answer?.slots || {};
      const expected = q.correctSlots || {};
      const keys = Object.keys(expected);
      const ok =
        keys.length > 0 && keys.every((k) => slots[k] === expected[k]);
      return {
        status: ok ? "ok" : "ko",
        pointsObtenus: ok ? pointsMax : 0,
        pointsMax,
      };
    }

    if (q.type === "action") {
      const ref = q.correct || {};
      const fieldsAns = answer?.fields || {};
      const fieldEvals = {};
      let autoOk = 0;
      let autoTotal = 0;
      let hasLibre = false;
      (q.fields || []).forEach((f) => {
        if (f.kind === "unique") {
          autoTotal += 1;
          const expected = (ref[f.id] || []).map(String);
          const given = fieldsAns[f.id] != null ? String(fieldsAns[f.id]) : "";
          const ok = expected.includes(given);
          if (ok) autoOk += 1;
          fieldEvals[f.id] = ok ? "ok" : "ko";
        } else {
          hasLibre = true;
          fieldEvals[f.id] = "a_corriger";
        }
      });
      const allAutoOk = autoTotal > 0 && autoOk === autoTotal;
      return {
        status: hasLibre
          ? allAutoOk
            ? "partiel_ok_auto"
            : "a_corriger"
          : allAutoOk
            ? "ok"
            : "ko",
        pointsObtenus: null,
        pointsMax,
        fields: fieldEvals,
        commentaire: hasLibre
          ? "Champs libres à l’appréciation ; champs à choix auto-évalués ci-dessus."
          : undefined,
      };
    }

    return {
      status: "a_corriger",
      pointsObtenus: null,
      pointsMax,
    };
  }

  /** Instantané de l’énoncé au moment de l’export (indépendant des futurs mélanges). */
  function buildEnonceSnapshot(q) {
    const base = {
      prompt: q.prompt,
      hint: q.hint || null,
      actionLabel: q.actionLabel || null,
      actionKind: q.actionKind || null,
    };
    if (q.type === "unique" || q.type === "qcm") {
      return {
        ...base,
        choices: (q.choices || []).map((c) => ({ id: c.id, label: c.label })),
      };
    }
    if (q.type === "ordre") {
      return { ...base, items: [...(q.items || [])] };
    }
    if (q.type === "libre") {
      return { ...base, placeholder: q.placeholder || null };
    }
    if (q.type === "schema") {
      return {
        ...base,
        schemaTitle: q.schemaTitle || null,
        schemaSubtitle: q.schemaSubtitle || null,
        slots: (q.slots || []).map((s) => ({
          id: s.id,
          caption: s.caption || null,
        })),
        palette: [...(q.palette || [])],
      };
    }
    if (q.type === "action") {
      return {
        ...base,
        fields: (q.fields || []).map((f) => ({
          id: f.id,
          label: f.label,
          kind: f.kind,
          choices:
            f.kind === "unique"
              ? (f.choices || []).map((c) => ({ id: c.id, label: c.label }))
              : undefined,
        })),
      };
    }
    return base;
  }

  function buildExport() {
    const answered = QUESTIONS.filter(isAnswered).length;
    const questions = QUESTIONS.map((q) => {
      const answer = state.answers[q.id] || null;
      const correct = buildCorrectExport(q);
      const autoEval = buildAutoEval(q, answer);
      return {
        id: q.id,
        jour: q.jour,
        theme: q.theme,
        diff: q.diff,
        type: q.type,
        pointsIndicatifs: q.points,
        prompt: q.prompt,
        enonce: buildEnonceSnapshot(q),
        answer,
        correct,
        autoEval,
      };
    });

    const autoGraded = questions.filter((q) => q.autoEval.pointsObtenus != null);
    const autoPoints = autoGraded.reduce(
      (s, q) => s + Number(q.autoEval.pointsObtenus || 0),
      0
    );
    const autoPointsMax = autoGraded.reduce(
      (s, q) => s + Number(q.autoEval.pointsMax || 0),
      0
    );

    return {
      meta: {
        title: META.title,
        version: META.version,
        noteMax: META.noteMax,
        durationMin: META.durationMin,
        exportedAt: new Date().toISOString(),
        startedAt: state.startedAt,
        endedAt: state.endedAt,
        questionCount: QUESTIONS.length,
        answeredCount: answered,
        /* Score auto partiel (QCU/QCM/ordre/schéma) — pas une note /20 finale */
        autoScore: {
          points: autoPoints,
          pointsMax: autoPointsMax,
        },
        /* Note finale /20 : à renseigner par l’enseignant (libres + appréciation) */
        teacherReview: {
          noteSur20: null,
          commentaire: "",
        },
      },
      student: state.student,
      questions,
    };
  }

  function downloadExport() {
    const payload = buildExport();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const slug = [state.student.nom, state.student.prenom]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "_")
      .toLowerCase() || "etudiant";
    a.href = URL.createObjectURL(blob);
    a.download = `examen-pdwn-${slug}-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function finishExam() {
    collectCurrent();
    state.endedAt = new Date().toISOString();
    state.locked = true;
    persist();
    renderEndSummary();
    showScreen("end");
    downloadExport();
  }

  el.formStart.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.locked) {
      renderEndSummary();
      showScreen("end");
      return;
    }
    const fd = new FormData(el.formStart);
    state.student = {
      nom: String(fd.get("nom") || "").trim(),
      prenom: String(fd.get("prenom") || "").trim(),
    };
    if (!state.student.nom || !state.student.prenom) return;
    state.startedAt = new Date().toISOString();
    state.endedAt = null;
    state.locked = false;
    state.index = 0;
    state.answers = {};
    persist();
    showScreen("exam");
    renderQuestion();
  });

  el.btnPrev.addEventListener("click", () => {
    collectCurrent();
    if (state.index > 0) state.index -= 1;
    persist();
    renderQuestion();
  });

  el.btnNext.addEventListener("click", () => {
    collectCurrent();
    if (state.index < QUESTIONS.length - 1) state.index += 1;
    persist();
    renderQuestion();
  });

  el.btnFinish.addEventListener("click", () => {
    collectCurrent();
    const answered = QUESTIONS.filter(isAnswered).length;
    const ok = confirm(
      `Terminer l’épreuve ?\n${answered}/${QUESTIONS.length} questions renseignées.\nUn fichier JSON sera téléchargé.\nEnsuite la session sera verrouillée sur cet ordinateur.`
    );
    if (ok) finishExam();
  });

  el.btnExport.addEventListener("click", downloadExport);
  el.btnCopy.addEventListener("click", async () => {
    const payload = JSON.stringify(buildExport(), null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      el.btnCopy.textContent = "Copié";
      setTimeout(() => {
        el.btnCopy.textContent = "Copier JSON";
      }, 1500);
    } catch (_) {
      alert("Copie impossible — utilisez Télécharger JSON.");
    }
  });

  document.getElementById("consignes-list").innerHTML = META.consignes
    .map((c) => `<li>${escapeHtml(c)}</li>`)
    .join("");
  document.getElementById("q-count").textContent = String(QUESTIONS.length);
  const charge = QUESTIONS.reduce((s, q) => s + (q.charge || 1), 0);
  document.getElementById("q-charge").textContent = String(Math.round(charge));

  const session = restore();
  if (session === "locked") {
    renderEndSummary();
    showScreen("end");
  } else if (session === "active") {
    const resume = confirm(
      "Une session en cours a été trouvée sur cet ordinateur. Reprendre ?"
    );
    if (resume) {
      showScreen("exam");
      renderQuestion();
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      state.answers = {};
      state.startedAt = null;
      state.endedAt = null;
      state.locked = false;
      state.index = 0;
      showScreen("start");
    }
  } else {
    showScreen("start");
  }
})();
