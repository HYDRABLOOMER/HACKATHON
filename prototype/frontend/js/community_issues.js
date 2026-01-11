(() => {
  const api = window.ecoQuestAPI;
  if (!api) return;

  const feedEl = document.getElementById("issuesFeed");
  const form = document.querySelector("#reportModal form");
  const statusEl = document.getElementById("issuesStatus");

  function setStatus(text, kind = "info") {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "";
    statusEl.classList.add("text-sm");
    if (kind === "error") statusEl.classList.add("text-error");
    else if (kind === "success") statusEl.classList.add("text-success");
    else statusEl.classList.add("text-text-secondary");
  }

  function renderIssues(issues) {
    if (!feedEl) return;
    if (!issues?.length) {
      feedEl.innerHTML = `<div class="card text-center text-text-secondary">No issues found.</div>`;
      return;
    }

    feedEl.innerHTML = issues
      .map((i) => {
        const priorityClass =
          i.priority === "high"
            ? "badge badge-error"
            : i.priority === "medium"
              ? "badge badge-warning"
              : "badge";
        const priorityLabel =
          i.priority === "high" ? "High Priority" : i.priority === "medium" ? "Medium Priority" : "Low Priority";
        return `
          <article class="card card-hover">
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="flex items-center space-x-2 mb-1">
                  <span class="badge badge-primary">${i.category || "Issue"}</span>
                  <span class="${priorityClass}">${priorityLabel}</span>
                </div>
                <h3 class="font-heading font-semibold text-text-primary text-lg">${i.title || "Untitled"}</h3>
                <div class="flex items-center space-x-2 text-sm text-text-secondary">
                  <img src="https://img.rocket.new/generatedImages/rocket_gen_img_1263f966d-1766595347304.png" alt="Location marker" class="w-4 h-4">
                  <span>${i.locationText || "Location not provided"}</span>
                  <span>•</span>
                  <span>${new Date(i.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <span class="text-xs text-text-tertiary">${i.status || "open"}</span>
            </div>
            <p class="text-text-secondary mb-4">${i.description || ""}</p>
            ${
              i.imageUrl
                ? `<div class="relative rounded-xl overflow-hidden mb-4 h-64">
                    <img src="${i.imageUrl}" alt="Issue image" class="w-full h-full object-cover">
                   </div>`
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  async function loadIssues() {
    setStatus("Loading issues...");
    try {
      const { issues } = await api.listIssues();
      renderIssues(issues);
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(err?.message || "Failed to load issues", "error");
    }
  }

  function wireForm() {
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {
        title: formData.get("title") || "",
        category: formData.get("category") || "",
        priority: formData.get("priority") || "medium",
        description: formData.get("description") || "",
        locationText: formData.get("locationText") || "",
        imageUrl: formData.get("imageUrl") || ""
      };
      setStatus("Submitting report...");
      try {
        await api.createIssue(payload);
        setStatus("Report submitted", "success");
        document.getElementById("reportModal")?.classList.add("hidden");
        form.reset();
        await loadIssues();
      } catch (err) {
        console.error(err);
        setStatus(err?.message || "Failed to submit report", "error");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadIssues();
    wireForm();
  });
})();
