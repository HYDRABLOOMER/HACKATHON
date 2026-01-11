(() => {
  const api = window.ecoQuestAPI;
  if (!api) return;

  let currentUserId = null;
  let currentUserEmail = null;

  const statTotalPoints = document.getElementById("statTotalPoints");
  const statTasksCompleted = document.getElementById("statTasksCompleted");
  const statStreak = document.getElementById("statStreak");
  const statPending = document.getElementById("statPending");
  const statDeltaPoints = document.getElementById("statDeltaPoints");
  const recentActivity = document.getElementById("recentActivity");
  const leaderboardList = document.getElementById("dashboardLeaderboard");
  const nearbyList = document.getElementById("nearbyCompetitors");

  function setTextAttr(attr, text) {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      el.textContent = text;
    });
  }

  function applyUser(user) {
    const name = user?.name || "User";
    const email = user?.email || "";
    currentUserId = user?.id || user?._id || null;
    currentUserEmail = email;
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

  function applyDashboard(data) {
    if (statTotalPoints && Number.isFinite(data?.totalPoints)) {
      statTotalPoints.textContent = data.totalPoints.toLocaleString();
    }
    if (statTasksCompleted && Number.isFinite(data?.tasksCompleted)) {
      statTasksCompleted.textContent = data.tasksCompleted.toLocaleString();
    }
    if (statStreak && Number.isFinite(data?.streakDays)) {
      statStreak.textContent = `${data.streakDays} Days`;
    }
    if (statPending && Number.isFinite(data?.pendingReview)) {
      statPending.textContent = `${data.pendingReview}`;
    }
    if (statDeltaPoints) {
      const pending = Number.isFinite(data?.pendingReview) ? data.pendingReview : null;
      statDeltaPoints.textContent =
        pending === null ? "No change yet" : `${pending} waiting for review`;
    }

    if (recentActivity) {
      recentActivity.innerHTML =
        '<div class="text-text-tertiary">Recent activity will appear here after you submit tasks or quizzes.</div>';
    }
  }

  function renderLeaderboard(entries, currentUserId) {
    if (!leaderboardList) return;
    if (!Array.isArray(entries) || entries.length === 0) {
      leaderboardList.innerHTML = '<div class="text-text-tertiary">No leaderboard data yet.</div>';
      return;
    }

    leaderboardList.innerHTML = entries
      .slice(0, 5)
      .map((e) => {
        const isMe = String(e.userId) === String(currentUserId);
        return `
          <div class="flex items-center space-x-3 p-3 rounded-lg border ${isMe ? 'bg-success-50 border-success/60' : 'bg-surface-50 border-border-surface'}">
            <div class="w-8 h-8 ${isMe ? 'bg-success' : 'bg-primary'} rounded-full flex items-center justify-center text-white font-bold text-sm">${e.rank}</div>
            <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-base font-semibold text-primary">${(e.name || '?').slice(0,1)}</div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-text-primary truncate">${e.name || 'Anonymous'}</h4>
              <p class="text-xs text-text-secondary">${(e.totalPoints || 0).toLocaleString()} pts</p>
            </div>
            <span class="text-xs font-semibold ${isMe ? 'text-success' : 'text-text-tertiary'}">${isMe ? 'You' : ''}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderNearby(entries, currentUserId) {
    if (!nearbyList) return;
    if (!Array.isArray(entries) || entries.length === 0) {
      nearbyList.innerHTML = '<div class="text-text-tertiary">No nearby competitors yet.</div>';
      return;
    }

    const meIndex = entries.findIndex((e) => String(e.userId) === String(currentUserId));
    const above = meIndex > 0 ? entries[meIndex - 1] : null;
    const me = meIndex >= 0 ? entries[meIndex] : null;
    const below = meIndex >= 0 && meIndex + 1 < entries.length ? entries[meIndex + 1] : null;
    const slices = [above, me, below].filter(Boolean);

    nearbyList.innerHTML = slices
      .map((e) => {
        const isMe = String(e.userId) === String(currentUserId);
        const delta = me && e !== me ? e.totalPoints - me.totalPoints : 0;
        const deltaText = isMe
          ? 'Your Rank'
          : delta > 0
            ? `${delta.toLocaleString()} pts to beat`
            : `${Math.abs(delta).toLocaleString()} pts behind`;
        const deltaClass = isMe ? 'bg-success-100 text-success px-3 py-1 rounded-full text-xs font-semibold' : 'text-xs font-semibold text-text-tertiary';

        return `
          <div class="flex items-center space-x-3 p-3 rounded-lg border ${isMe ? 'bg-success-50 border-success/60' : 'bg-surface-50 border-border-surface'}">
            <div class="w-10 h-10 ${isMe ? 'bg-success' : 'bg-secondary'} rounded-full flex items-center justify-center text-white font-bold text-sm">${e.rank}</div>
            <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-base font-semibold text-primary">${(e.name || '?').slice(0,1)}</div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-text-primary truncate">${e.name || 'Anonymous'}</h4>
              <p class="text-xs text-text-secondary">${(e.totalPoints || 0).toLocaleString()} pts</p>
            </div>
            <span class="${deltaClass}">${deltaText}</span>
          </div>
        `;
      })
      .join("");
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

  async function loadDashboard() {
    if (!statTotalPoints && !statTasksCompleted && !statStreak && !statPending && !leaderboardList) return;
    try {
      const data = await api.getDashboard();
      applyDashboard(data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    }
  }

  async function loadDashboardLeaderboard() {
    if (!leaderboardList && !nearbyList) return;
    try {
      const limit = 30;
      const data = await api.getLeaderboard(limit);
      const entries = data?.leaderboard || [];
      const meId =
        data?.currentUserId ||
        currentUserId ||
        (currentUserEmail ? entries.find((e) => e.email === currentUserEmail)?.userId : null);
      renderLeaderboard(entries, meId);
      renderNearby(entries, meId);
    } catch (err) {
      console.error("Failed to load dashboard leaderboard", err);
      if (leaderboardList) leaderboardList.innerHTML = '<div class="text-text-tertiary">Failed to load leaderboard.</div>';
      if (nearbyList) nearbyList.innerHTML = '<div class="text-text-tertiary">Failed to load nearby competitors.</div>';
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
    loadDashboard();
    loadDashboardLeaderboard();
    wireSaveBio();
    wireSignOut();
  });
})();
