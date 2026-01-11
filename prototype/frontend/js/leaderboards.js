(() => {
  const api = window.ecoQuestAPI;
  if (!api) return;

  const podiumEl = document.getElementById("leaderboard-podium");
  const tableBodyEl = document.getElementById("leaderboard-table-body");
  const mobileEl = document.getElementById("leaderboard-mobile");
  const updatedTextEl = document.getElementById("leaderboard-updated-text");
  const loadMoreBtn = document.getElementById("leaderboard-load-more");

  let currentLimit = 20;
  let loading = false;

  function setUpdated(text) {
    if (updatedTextEl) updatedTextEl.textContent = text;
  }

  function renderPodium(entries) {
    if (!podiumEl) return;
    podiumEl.innerHTML = "";
    const topThree = entries.slice(0, 3);

    if (topThree.length === 0) {
      podiumEl.innerHTML = `<div class="text-center text-text-secondary col-span-3">No data yet.</div>`;
      return;
    }

    const classes = [
      "order-2 sm:order-2 -mt-2 border-accent",
      "order-1 sm:order-1 border-primary-300",
      "order-3 sm:order-3 border-secondary-300"
    ];

    topThree.forEach((entry, idx) => {
      const border =
        idx === 0 ? "border-accent" : idx === 1 ? "border-primary-300" : "border-secondary-300";
      const rankBadge =
        idx === 0
          ? `<div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-surface">👑</div>`
          : `<div class="absolute -bottom-2 left/2 transform -translate-x-1/2 w-10 h-10 ${border.replace(
              "border-",
              "bg-"
            )} rounded-full flex items-center justify-center text-white font-bold text-lg border-4 border-surface">${entry.rank}</div>`;

      const size = idx === 0 ? "w-24 h-24" : "w-20 h-20";
      const order = classes[idx] || "";

      podiumEl.insertAdjacentHTML(
        "beforeend",
        `<div class="flex flex-col items-center ${order}">
          <div class="relative mb-3">
            <div class="${size} rounded-full object-cover bg-primary-50 border-4 ${border} flex items-center justify-center text-xl font-bold text-text-primary">
              ${entry.name?.[0] || "?"}
            </div>
            ${rankBadge}
          </div>
          <h3 class="font-heading font-semibold text-text-primary text-center mb-1">${entry.name || "Anonymous"}</h3>
          <p class="text-sm text-text-secondary mb-2">${entry.totalPoints.toLocaleString()} pts</p>
        </div>`
      );
    });
  }

  function renderTable(entries) {
    if (!tableBodyEl) return;
    if (!entries.length) {
      tableBodyEl.innerHTML = `<tr><td colspan="6" class="text-center text-text-secondary py-6">No leaderboard data yet.</td></tr>`;
      return;
    }

    tableBodyEl.innerHTML = entries
      .map(
        (e) => `<tr>
        <td class="font-bold text-text-primary">${e.rank}</td>
        <td>
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-sm font-semibold text-primary">${e.name?.[0] || "?"}</div>
            <div>
              <h4 class="font-medium text-text-primary">${e.name || "Anonymous"}</h4>
              <p class="text-xs text-text-secondary">${e.email || ""}</p>
            </div>
          </div>
        </td>
        <td class="text-right font-semibold text-text-primary">${e.totalPoints.toLocaleString()}</td>
        <td class="text-center text-text-tertiary">–</td>
        <td class="text-center text-text-tertiary">–</td>
        <td class="text-right">
          <span class="badge badge-surface text-text-secondary">View</span>
        </td>
      </tr>`
      )
      .join("");
  }

  function renderMobile(entries) {
    if (!mobileEl) return;
    if (!entries.length) {
      mobileEl.innerHTML = `<div class="text-center text-text-secondary py-4">No leaderboard data yet.</div>`;
      return;
    }

    mobileEl.innerHTML = entries
      .map(
        (e) => `<div class="p-4 bg-surface-50 rounded-xl">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">${e.rank}</div>
              <div class="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-base font-semibold text-primary">${e.name?.[0] || "?"}</div>
              <div>
                <h4 class="font-medium text-text-primary">${e.name || "Anonymous"}</h4>
                <p class="text-xs text-text-secondary">${e.email || ""}</p>
              </div>
            </div>
            <span class="px-3 py-1.5 text-xs font-medium text-primary bg-primary-50 rounded-lg">View</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-4">
              <div>
                <span class="text-text-secondary">Points:</span>
                <span class="font-semibold text-text-primary ml-1">${e.totalPoints.toLocaleString()}</span>
              </div>
            </div>
            <div class="flex items-center space-x-1 text-text-tertiary">
              <span class="font-medium">–</span>
            </div>
          </div>
        </div>`
      )
      .join("");
  }

  async function loadLeaderboard(limit = currentLimit) {
    if (loading) return;
    loading = true;
    setUpdated("Updating…");
    try {
      const data = await api.getLeaderboard(limit);
      const entries = data?.leaderboard || [];
      renderPodium(entries);
      renderTable(entries);
      renderMobile(entries);
      setUpdated(`Updated just now • Showing top ${entries.length}`);
    } catch (err) {
      console.error(err);
      setUpdated("Failed to load");
      if (tableBodyEl) {
        tableBodyEl.innerHTML = `<tr><td colspan="6" class="text-center text-error-700 py-6">Failed to load leaderboard.</td></tr>`;
      }
      if (mobileEl) {
        mobileEl.innerHTML = `<div class="text-center text-error-700 py-4">Failed to load leaderboard.</div>`;
      }
      if (podiumEl) {
        podiumEl.innerHTML = `<div class="text-center text-error-700 py-4">Failed to load leaderboard.</div>`;
      }
    } finally {
      loading = false;
    }
  }

  function wireLoadMore() {
    if (!loadMoreBtn) return;
    loadMoreBtn.addEventListener("click", () => {
      currentLimit = Math.min(100, currentLimit + 20);
      loadLeaderboard(currentLimit);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadLeaderboard(currentLimit);
    wireLoadMore();
  });
})();
