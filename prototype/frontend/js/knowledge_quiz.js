(() => {
  const api = window.ecoQuestAPI;
  if (!api) return;

  const attemptsList = document.getElementById("quizAttempts");
  const statusEl = document.getElementById("quizStatus");

  function setStatus(text, kind = "info") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "";
    statusEl.classList.add("text-sm");
    if (kind === "error") statusEl.classList.add("text-error");
    else if (kind === "success") statusEl.classList.add("text-success");
    else statusEl.classList.add("text-text-secondary");
  }

  function renderAttempts(attempts) {
    if (!attemptsList) return;
    if (!attempts?.length) {
      attemptsList.innerHTML = `<div class="text-sm text-text-secondary">No attempts yet.</div>`;
      return;
    }
    attemptsList.innerHTML = attempts
      .map(
        (a) => `
          <div class="flex items-center justify-between p-3 rounded-lg bg-surface-50 border border-border-surface">
            <div>
              <div class="text-sm font-medium text-text-primary">${a.topic || "Quiz"}</div>
              <div class="text-xs text-text-secondary">${new Date(a.attemptedAt).toLocaleString()}</div>
            </div>
            <div class="text-sm font-semibold text-primary">${a.score}/${a.maxScore}</div>
          </div>
        `
      )
      .join("");
  }

  async function loadAttempts() {
    setStatus("Loading attempts...");
    try {
      const { attempts } = await api.listMyQuizAttempts();
      renderAttempts(attempts);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Failed to load attempts", "error");
    }
  }

  function wireSubmit() {
    const form = document.getElementById("quizSubmitForm");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const topic = formData.get("topic") || "Quiz";
      const score = Number(formData.get("score")) || 0;
      const maxScore = Number(formData.get("maxScore")) || 0;
      setStatus("Submitting...");
      try {
        await api.createQuizAttempt({ topic, score, maxScore });
        setStatus("Saved", "success");
        form.reset();
        loadAttempts();
      } catch (err) {
        console.error(err);
        setStatus(err?.message || "Submit failed", "error");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadAttempts();
    wireSubmit();
  });
})();
