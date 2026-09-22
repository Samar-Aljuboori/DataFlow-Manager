document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const filename = urlParams.get("file");

  if (!filename) {
    alert("No file specified.");
    window.location.href = "index.html";
    return;
  }

  const historyData =
    JSON.parse(localStorage.getItem("globalHistoryData")) || [];
  const fileData = historyData.find((item) => item.filename === filename);

  if (!fileData) {
    alert("File not found in history.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("detail-filename").textContent =
    fileData.filename || "-";
  document.getElementById("detail-date").textContent =
    fileData.upload_date || "-";

  const fileExtension = fileData.filename.split(".").pop().toUpperCase();
  document.getElementById("detail-type").textContent = fileExtension || "-";

  document.getElementById("detail-size").textContent = fileData.size || "N/A";
  document.getElementById("detail-rows").textContent =
    fileData.rowsCount || (fileData.data ? fileData.data.length : 0);
  document.getElementById("detail-cols").textContent =
    fileData.colsCount ||
    (fileData.data && fileData.data[0]
      ? Object.keys(fileData.data[0]).length
      : 0);

  if (fileData.data && fileData.data.length > 0) {
    renderPreviewTable(fileData.data);
  }
});

// Function to redirect user to details page with file name
function viewFileDetails(filename) {
  window.location.href = `details.html?file=${encodeURIComponent(filename)}`;
}

function renderPreviewTable(data) {
  const thead = document.getElementById("tableHeader");
  const tbody = document.getElementById("tableBody");
  if (!thead || !tbody) return;

  thead.innerHTML = "";
  tbody.innerHTML = "";

  const keys = Object.keys(data[0]);
  const headerRow = document.createElement("tr");
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  data.forEach((row) => {
    const tr = document.createElement("tr");
    keys.forEach((key) => {
      const td = document.createElement("td");
      td.textContent = row[key] !== undefined ? row[key] : "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}
