document.querySelectorAll("#auth-steps .seq-step").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("#auth-steps .seq-step")
      .forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
});
