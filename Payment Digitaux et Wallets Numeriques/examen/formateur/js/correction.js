(function () {
  "use strict";

  const el = {
    panelLoad: document.getElementById("panel-load"),
    panelReview: document.getElementById("panel-review"),
    file: document.getElementById("file-json"),
    error: document.getElementById("load-error"),
    studentName: document.getElementById("student-name"),
    exportMeta: document.getElementById("export-meta"),
    autoScore: document.getElementById("auto-score"),
    note: document.getElementById("note-sur-20"),
    comment: document.getElementById("teacher-comment"),
    list: document.getElementById("questions-list"),
    filters: document.getElementById("status-filters"),
    btnReload: document.getElementById("btn-reload"),
    btnTodo: document.getElementById("btn-filter-todo"),
    btnAll: document.getElementById("btn-filter-all"),
    btnExportKo: document.getElementById("btn-export-ko"),
  };

  let data = null;
  let filterMode = "all";

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("fr-FR");
    } catch (_) {
      return iso;
    }
  }

  function statusClass(status) {
    if (status === "ok" || status === "partiel_ok_auto") return "is-ok";
    if (status === "ko") return "is-ko";
    return "is-todo";
  }

  function statusLabel(status) {
    return (
      {
        ok: "OK",
        ko: "KO",
        a_corriger: "À corriger",
        partiel_ok_auto: "Partiel auto OK",
      }[status] ||
      status ||
      "—"
    );
  }

  function enonceOf(q) {
    return q.enonce || {};
  }

  function labelFromChoices(choices, id) {
    const c = (choices || []).find((x) => String(x.id) === String(id));
    return c ? c.label : id;
  }

  function correctIds(q) {
    const c = q.correct;
    if (!c) return [];
    if (Array.isArray(c.ids)) return c.ids.map(String);
    return [];
  }

  function formatEnonce(q) {
    const e = enonceOf(q);
    const prompt = e.prompt || q.prompt || q.id;
    let body = `<p class="corr-q-prompt">${esc(prompt)}</p>`;

    if (e.actionLabel) {
      body += `<p class="corr-action-label"><strong>Action</strong> — ${esc(
        e.actionLabel
      )}</p>`;
    }

    if (e.choices && e.choices.length) {
      const good = new Set(correctIds(q));
      body += `<ul class="corr-choices">${e.choices
        .map((c) => {
          const mark = good.has(String(c.id)) ? " is-key" : "";
          return `<li class="${mark}"><span class="corr-choice-id">${esc(
            c.id
          )}</span> ${esc(c.label)}</li>`;
        })
        .join("")}</ul>`;
    }

    if (e.items && e.items.length) {
      body += `<ul class="corr-choices">${e.items
        .map((it) => `<li>${esc(it)}</li>`)
        .join("")}</ul>`;
    }

    if (e.fields && e.fields.length) {
      body += e.fields
        .map((f) => {
          let block = `<div class="corr-field-enonce"><p class="corr-field-title">${esc(
            f.label || f.id
          )}</p>`;
          if (f.kind === "unique" && f.choices) {
            const good = new Set(
              (q.correct?.fields?.[f.id]?.ids || []).map(String)
            );
            block += `<ul class="corr-choices">${f.choices
              .map((c) => {
                const mark = good.has(String(c.id)) ? " is-key" : "";
                return `<li class="${mark}"><span class="corr-choice-id">${esc(
                  c.id
                )}</span> ${esc(c.label)}</li>`;
              })
              .join("")}</ul>`;
          } else {
            block += `<p class="corr-empty">Réponse libre</p>`;
          }
          block += `</div>`;
          return block;
        })
        .join("");
    }

    if (e.slots && e.slots.length) {
      if (e.schemaTitle) {
        body += `<p class="corr-schema-title">${esc(e.schemaTitle)}</p>`;
      }
      if (e.schemaSubtitle) {
        body += `<p class="corr-meta-line">${esc(e.schemaSubtitle)}</p>`;
      }
      body += `<ul class="corr-choices">${e.slots
        .map((s) => `<li><span class="corr-choice-id">${esc(s.id)}</span> ${esc(
          s.caption || s.id
        )}</li>`)
        .join("")}</ul>`;
      if (e.palette && e.palette.length) {
        body += `<p class="corr-meta-line">Palette : ${esc(
          e.palette.join(" · ")
        )}</p>`;
      }
    }

    if (!e.choices && !e.items && !e.fields && !e.slots) {
      body += `<p class="corr-legacy">Énoncé partiel (export ancien — sans instantané des choix). Relancer un export avec la version actuelle.</p>`;
    }

    return body;
  }

  function formatAnswer(q) {
    const a = q.answer;
    if (!a) return '<p class="corr-empty">Sans réponse</p>';
    const e = enonceOf(q);

    if (q.type === "unique") {
      const id = a.choice;
      const lab = labelFromChoices(e.choices, id);
      return id
        ? `<p><span class="corr-choice-id">${esc(id)}</span> ${esc(lab)}</p>`
        : `<p class="corr-empty">—</p>`;
    }
    if (q.type === "qcm") {
      const ids = a.choices || [];
      if (!ids.length) return `<p class="corr-empty">—</p>`;
      return `<ul class="corr-answer-list">${ids
        .map((id) => {
          const lab = labelFromChoices(e.choices, id);
          return `<li><span class="corr-choice-id">${esc(id)}</span> ${esc(
            lab
          )}</li>`;
        })
        .join("")}</ul>`;
    }
    if (q.type === "ordre") {
      return `<ol class="corr-answer-list">${(a.order || [])
        .map((x) => `<li>${esc(x)}</li>`)
        .join("")}</ol>`;
    }
    if (q.type === "libre") {
      const t = String(a.text || "").trim();
      return t ? `<pre>${esc(t)}</pre>` : `<p class="corr-empty">Vide</p>`;
    }
    if (q.type === "schema") {
      const slots = a.slots || {};
      const meta = (e.slots || []).reduce((m, s) => {
        m[s.id] = s.caption || s.id;
        return m;
      }, {});
      const lines = Object.keys(slots).map(
        (k) => `${meta[k] || k} → ${slots[k]}`
      );
      return `<pre>${esc(lines.join("\n") || "—")}</pre>`;
    }
    if (q.type === "action") {
      const fieldsAns = a.fields || {};
      const blocks = (e.fields || Object.keys(fieldsAns).map((id) => ({ id }))).map(
        (f) => {
          const val = fieldsAns[f.id];
          const title = f.label || f.id;
          if (f.kind === "unique" || (f.choices && f.choices.length)) {
            const lab = labelFromChoices(f.choices, val);
            return `<p><strong>${esc(title)}</strong><br/><span class="corr-choice-id">${esc(
              val ?? "—"
            )}</span> ${esc(lab)}</p>`;
          }
          return `<p><strong>${esc(title)}</strong></p><pre>${esc(
            val || ""
          )}</pre>`;
        }
      );
      return blocks.join("") || `<p class="corr-empty">—</p>`;
    }
    return `<pre>${esc(JSON.stringify(a, null, 2))}</pre>`;
  }

  function formatCorrect(q) {
    const c = q.correct;
    if (!c) return '<p class="corr-empty">—</p>';
    const e = enonceOf(q);

    if (c.mode === "appreciation_enseignant") {
      const idea = c.ideeDirectrice || c.idea;
      return idea
        ? `<p><em>Appréciation</em> — idée : ${esc(idea)}</p>`
        : `<p><em>Appréciation enseignant</em> (pas de note auto)</p>`;
    }
    if (c.mode === "auto") {
      if (c.labels && c.labels.length) {
        const ids = c.ids || [];
        return `<ul class="corr-answer-list">${c.labels
          .map((lab, i) => {
            const id = ids[i];
            return id
              ? `<li><span class="corr-choice-id">${esc(id)}</span> ${esc(
                  lab
                )}</li>`
              : `<li>${esc(lab)}</li>`;
          })
          .join("")}</ul>`;
      }
      if (c.ids && e.choices) {
        return `<ul class="corr-answer-list">${c.ids
          .map((id) => {
            const lab = labelFromChoices(e.choices, id);
            return `<li><span class="corr-choice-id">${esc(id)}</span> ${esc(
              lab
            )}</li>`;
          })
          .join("")}</ul>`;
      }
      if (c.order) {
        return `<ol class="corr-answer-list">${c.order
          .map((x) => `<li>${esc(x)}</li>`)
          .join("")}</ol>`;
      }
      if (c.slots) {
        const meta = (e.slots || []).reduce((m, s) => {
          m[s.id] = s.caption || s.id;
          return m;
        }, {});
        return `<pre>${esc(
          Object.entries(c.slots)
            .map(([k, v]) => `${meta[k] || k} → ${v}`)
            .join("\n")
        )}</pre>`;
      }
      if (c.ids) return `<p>${esc(c.ids.join(", "))}</p>`;
    }
    if (c.mode === "mixte" && c.fields) {
      const lines = Object.entries(c.fields).map(([id, f]) => {
        if (f.mode === "auto") {
          const labs = (f.labels || []).length
            ? f.labels.join(" · ")
            : (f.ids || []).join(", ");
          return `${f.label || id} → ${labs}`;
        }
        const tip = f.indice ? ` (indice : ${f.indice})` : "";
        return `${f.label || id} → appréciation${tip}`;
      });
      if (c.ideeDirectrice) lines.push(`Idée : ${c.ideeDirectrice}`);
      return `<pre>${esc(lines.join("\n"))}</pre>`;
    }
    return `<pre>${esc(JSON.stringify(c, null, 2))}</pre>`;
  }

  function plainPrompt(q) {
    const e = enonceOf(q);
    return String(e.prompt || q.prompt || q.id || "").trim();
  }

  function plainAnswer(q) {
    const a = q.answer;
    if (!a) return "(sans réponse)";
    const e = enonceOf(q);

    if (q.type === "unique") {
      const id = a.choice;
      if (!id) return "—";
      return `${id} — ${labelFromChoices(e.choices, id)}`;
    }
    if (q.type === "qcm") {
      const ids = a.choices || [];
      if (!ids.length) return "—";
      return ids
        .map((id) => `${id} — ${labelFromChoices(e.choices, id)}`)
        .join("\n");
    }
    if (q.type === "ordre") {
      return (a.order || []).map((x, i) => `${i + 1}. ${x}`).join("\n") || "—";
    }
    if (q.type === "libre") {
      const t = String(a.text || "").trim();
      return t || "(vide)";
    }
    if (q.type === "schema") {
      const slots = a.slots || {};
      const meta = (e.slots || []).reduce((m, s) => {
        m[s.id] = s.caption || s.id;
        return m;
      }, {});
      const lines = Object.keys(slots).map(
        (k) => `${meta[k] || k} → ${slots[k]}`
      );
      return lines.join("\n") || "—";
    }
    if (q.type === "action") {
      const fieldsAns = a.fields || {};
      const fields = e.fields || Object.keys(fieldsAns).map((id) => ({ id }));
      return (
        fields
          .map((f) => {
            const val = fieldsAns[f.id];
            const title = f.label || f.id;
            if (f.kind === "unique" || (f.choices && f.choices.length)) {
              return `${title}: ${val ?? "—"} — ${labelFromChoices(
                f.choices,
                val
              )}`;
            }
            return `${title}:\n${String(val || "").trim() || "(vide)"}`;
          })
          .join("\n") || "—"
      );
    }
    return JSON.stringify(a, null, 2);
  }

  function plainCorrect(q) {
    const c = q.correct;
    if (!c) return "—";
    const e = enonceOf(q);

    if (c.mode === "appreciation_enseignant") {
      const idea = c.ideeDirectrice || c.idea;
      return idea
        ? `Appréciation — idée : ${idea}`
        : "Appréciation enseignant (pas de note auto)";
    }
    if (c.mode === "auto") {
      if (c.labels && c.labels.length) {
        const ids = c.ids || [];
        return c.labels
          .map((lab, i) => {
            const id = ids[i];
            return id ? `${id} — ${lab}` : lab;
          })
          .join("\n");
      }
      if (c.ids && e.choices) {
        return c.ids
          .map((id) => `${id} — ${labelFromChoices(e.choices, id)}`)
          .join("\n");
      }
      if (c.order) {
        return c.order.map((x, i) => `${i + 1}. ${x}`).join("\n");
      }
      if (c.slots) {
        const meta = (e.slots || []).reduce((m, s) => {
          m[s.id] = s.caption || s.id;
          return m;
        }, {});
        return Object.entries(c.slots)
          .map(([k, v]) => `${meta[k] || k} → ${v}`)
          .join("\n");
      }
      if (c.ids) return c.ids.join(", ");
    }
    if (c.mode === "mixte" && c.fields) {
      const lines = Object.entries(c.fields).map(([id, f]) => {
        if (f.mode === "auto") {
          const labs = (f.labels || []).length
            ? f.labels.join(" · ")
            : (f.ids || []).join(", ");
          return `${f.label || id} → ${labs}`;
        }
        const tip = f.indice ? ` (indice : ${f.indice})` : "";
        return `${f.label || id} → appréciation${tip}`;
      });
      if (c.ideeDirectrice) lines.push(`Idée : ${c.ideeDirectrice}`);
      return lines.join("\n");
    }
    return JSON.stringify(c, null, 2);
  }

  function buildKoExtract() {
    const questions = data?.questions || [];
    const kos = questions.filter((q) => q.autoEval?.status === "ko");
    const st = data?.student || {};
    const name =
      [st.prenom, st.nom].filter(Boolean).join(" ") || "etudiant";
    const header = [
      `Extraction KO — ${name}`,
      `Export ${fmtDate(data?.meta?.exportedAt)}`,
      `${kos.length} question(s) KO`,
      "",
    ].join("\n");

    if (!kos.length) {
      return { text: header + "(aucune question KO)\n", name, count: 0 };
    }

    const body = kos
      .map((q, i) => {
        const idx = questions.indexOf(q) + 1;
        return [
          `======== KO ${i + 1} / ${kos.length} · Q${idx} · ${q.id || ""} · ${
            q.type || ""
          } ========`,
          "Q:",
          plainPrompt(q),
          "",
          "RE:",
          plainAnswer(q),
          "",
          "RA:",
          plainCorrect(q),
          "",
        ].join("\n");
      })
      .join("\n");

    return { text: header + body, name, count: kos.length };
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function slugName(name) {
    return String(name || "etudiant")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "etudiant";
  }

  function renderFilters(questions) {
    const counts = { ok: 0, ko: 0, a_corriger: 0, partiel_ok_auto: 0 };
    questions.forEach((q) => {
      const s = q.autoEval?.status;
      if (counts[s] != null) counts[s] += 1;
      else if (s) counts.a_corriger += 1;
    });
    el.filters.innerHTML = `
      <span class="corr-chip is-ok">OK ${counts.ok}</span>
      <span class="corr-chip is-ko">KO ${counts.ko}</span>
      <span class="corr-chip is-todo">À corriger ${
        counts.a_corriger + counts.partiel_ok_auto
      }</span>
    `;
  }

  function renderQuestions() {
    const questions = data.questions || [];
    el.list.innerHTML = questions
      .map((q, idx) => {
        const st = q.autoEval?.status || "a_corriger";
        const hide =
          filterMode === "todo" &&
          st !== "a_corriger" &&
          st !== "partiel_ok_auto" &&
          st !== "ko";
        const pts =
          q.autoEval?.pointsObtenus != null
            ? `${q.autoEval.pointsObtenus} / ${
                q.autoEval.pointsMax ?? q.pointsIndicatifs
              }`
            : `— / ${q.pointsIndicatifs ?? "—"}`;
        return `
        <article class="corr-q ${hide ? "is-hidden" : ""}" data-status="${esc(
          st
        )}">
          <div class="corr-q-head">
            <span class="chip">Q${idx + 1}</span>
            <span class="chip">${esc(q.jour || "")}</span>
            <span class="chip">${esc(q.type || "")}</span>
            <span class="chip">${esc(q.theme || "")}</span>
            <span class="corr-chip ${statusClass(st)}">${esc(
              statusLabel(st)
            )}</span>
            <span class="chip">${esc(pts)} pt</span>
          </div>
          <div class="corr-enonce">
            <h3 class="corr-enonce-title">Énoncé (tel qu’à l’export)</h3>
            ${formatEnonce(q)}
          </div>
          <div class="corr-cols">
            <div class="corr-box">
              <h3>Réponse étudiant</h3>
              ${formatAnswer(q)}
            </div>
            <div class="corr-box is-correct">
              <h3>Correction attendue</h3>
              ${formatCorrect(q)}
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function showReview(payload) {
    data = payload;
    filterMode = "all";
    const st = payload.student || {};
    const meta = payload.meta || {};
    const auto = meta.autoScore || {};

    el.studentName.textContent =
      [st.prenom, st.nom].filter(Boolean).join(" ") || "Étudiant";
    el.exportMeta.textContent = [
      `Export ${fmtDate(meta.exportedAt)}`,
      meta.version ? `v${meta.version}` : null,
      `${meta.answeredCount ?? "—"} / ${meta.questionCount ?? "—"} renseignées`,
    ]
      .filter(Boolean)
      .join(" · ");

    const ap = auto.points;
    const am = auto.pointsMax;
    el.autoScore.textContent =
      ap != null && am != null ? `${ap} / ${am}` : "—";

    const tr = meta.teacherReview || {};
    el.note.value = tr.noteSur20 ?? "";
    el.comment.value = tr.commentaire || "";

    renderFilters(payload.questions || []);
    renderQuestions();

    el.panelLoad.hidden = true;
    el.panelReview.hidden = false;
  }

  function showLoad(msg) {
    data = null;
    el.panelReview.hidden = true;
    el.panelLoad.hidden = false;
    if (msg) {
      el.error.hidden = false;
      el.error.textContent = msg;
    } else {
      el.error.hidden = true;
      el.error.textContent = "";
    }
    el.file.value = "";
  }

  el.file.addEventListener("change", async () => {
    const file = el.file.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.questions || !Array.isArray(json.questions)) {
        throw new Error("JSON invalide : clé « questions » manquante.");
      }
      showReview(json);
    } catch (err) {
      showLoad(err.message || "Impossible de lire ce fichier.");
    }
  });

  el.btnReload.addEventListener("click", () => showLoad());
  el.btnTodo.addEventListener("click", () => {
    filterMode = "todo";
    renderQuestions();
  });
  el.btnAll.addEventListener("click", () => {
    filterMode = "all";
    renderQuestions();
  });

  el.btnExportKo.addEventListener("click", () => {
    if (!data) return;
    const { text, name, count } = buildKoExtract();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`ko-${slugName(name)}-${stamp}.txt`, text);
    el.btnExportKo.textContent =
      count === 0 ? "Extraire KO (0)" : `Extraire KO (${count})`;
    setTimeout(() => {
      el.btnExportKo.textContent = "Extraire KO";
    }, 2000);
  });
})();
