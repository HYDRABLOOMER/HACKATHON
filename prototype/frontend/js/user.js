(() => {
  const api = window.ecoQuestAPI;
  if (!api) return;

  function setTextAttr(attr, text) {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      el.textContent = text;
    });
  }

  function applyUser(user) {
    const name = user?.name || "User";
    const email = user?.email || "";
    const bio = typeof user?.bio === "string" ? user.bio : "";
    const totalPoints = Number.isFinite(user?.totalPoints) ? user.totalPoints : null;
    const tasksCompleted = Number.isFinite(user?.tasksCompleted) ? user.tasksCompleted : null;

    document.querySelectorAll("#navUserName, [data-user-name]").forEach((el) => {
      el.textContent = name;
    });

    setTextAttr("data-user-name", name);

    const welcome = document.getElementById("welcomeUserName");
    if (welcome) welcome.textContent = `Welcome back, ${name}! 🌱`;

    const profileName = document.getElementById("profileName");
    if (profileName) profileName.textContent = name;

    const profileEmail = document.getElementById("profileEmail");
    if (profileEmail) profileEmail.textContent = email;

    const profileBio = document.getElementById("profileBio");
    if (profileBio) profileBio.value = bio;

    const statPoints = document.getElementById("statPoints");
    if (statPoints) statPoints.textContent = totalPoints !== null ? totalPoints : "—";

    const statTasks = document.getElementById("statTasks");
    if (statTasks) statTasks.textContent = tasksCompleted !== null ? tasksCompleted : "—";
  }

  async function loadUser() {
    try {
      const user = await api.getCurrentUser();
      applyUser(user);
    } catch (err) {
      console.error("Failed to load user", err);
      api.removeToken();
      window.location.href = "/";
    }
  }

  function setSaveStatus(text, kind = "info") {
    const el = document.getElementById("profileSaveStatus");
    if (!el) return;
    el.textContent = text;
    el.classList.remove("text-error", "text-text-secondary", "text-success");
    if (kind === "error") el.classList.add("text-error");
    else if (kind === "success") el.classList.add("text-success");
    else el.classList.add("text-text-secondary");
  }

  function wireSaveBio() {
    const btn = document.getElementById("saveBioBtn");
    const bioInput = document.getElementById("profileBio");
    if (!btn || !bioInput) return;

    btn.addEventListener("click", async () => {
      const bio = bioInput.value || "";
      btn.disabled = true;
      setSaveStatus("Saving...");
      try {
        const updated = await api.updateProfile({ bio });
        applyUser(updated);
        setSaveStatus("Saved", "success");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err) {
        console.error("Failed to save bio", err);
        setSaveStatus(err?.message || "Save failed", "error");
      } finally {
        btn.disabled = false;
      }
    });
  }

  function wireSignOut() {
    const btn = document.querySelector("[data-signout]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      api.removeToken();
      window.location.href = "/";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadUser();
    wireSaveBio();
    wireSignOut();
  });
})();
