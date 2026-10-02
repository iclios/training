document.querySelectorAll(".seq-steps").forEach((group) => {
  const diagram = group.closest(".diagram");

  function activate(btn) {
    group
      .querySelectorAll(".seq-step")
      .forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    if (!diagram) return;
    const step = btn.getAttribute("data-step");
    diagram.querySelectorAll("svg [data-step]").forEach((el) => {
      const steps = el.getAttribute("data-step").split(/\s+/);
      const on = steps.includes(step);
      el.classList.toggle("is-active", on);
      el.classList.toggle("is-dim", !on);
    });
  }

  group.querySelectorAll(".seq-step").forEach((btn) => {
    btn.addEventListener("click", () => activate(btn));
  });

  const initial = group.querySelector(".seq-step.is-active") || group.querySelector(".seq-step");
  if (initial) activate(initial);
});
