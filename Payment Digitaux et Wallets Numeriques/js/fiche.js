document.querySelectorAll(".seq-steps").forEach((group) => {
  group.querySelectorAll(".seq-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      group
        .querySelectorAll(".seq-step")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
});
