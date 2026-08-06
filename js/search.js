/* 이름 검색 */
/* ===== 검색 ===== */

function applySearch() {
  const q = document.getElementById("searchBox").value.trim().toLowerCase();
  document.querySelectorAll(".member-row").forEach(row => {
    const name = (row.querySelector(".member-name")?.textContent || "").toLowerCase();
    const match = !q || name.includes(q);
    row.style.display = match ? "" : "none";
    const detail = document.getElementById("detail-" + row.getAttribute("data-mid"));
    if (detail && !match) detail.classList.remove("open");
  });
  document.querySelectorAll(".class-card").forEach(card => {
    if (!q) { card.style.opacity = "1"; return; }
    const vis = [...card.querySelectorAll(".member-row")].some(r => r.style.display !== "none");
    card.style.opacity = vis ? "1" : "0.35";
  });
}
