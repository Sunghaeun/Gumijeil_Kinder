/* 탭 전환 */
/* ===== 탭 전환 ===== */

function switchTab(tab) {
  document.getElementById("tabRoster").classList.toggle("active", tab === "roster");
  document.getElementById("tabTeachers").classList.toggle("active", tab === "teachers");
  document.getElementById("tabAttendance").classList.toggle("active", tab === "attendance");
  document.getElementById("rosterView").classList.toggle("active", tab === "roster");
  document.getElementById("teacherView").classList.toggle("active", tab === "teachers");
  document.getElementById("attendanceView").classList.toggle("active", tab === "attendance");
  document.getElementById("btnPrint").style.display = tab === "roster" ? "" : "none";
  document.getElementById("searchBox").style.display = tab === "roster" ? "" : "none";
  document.getElementById("btnAddPerson").style.display = tab === "roster" ? "" : "none";
  document.getElementById("btnAddClass").style.display = tab === "roster" ? "" : "none";

}
