// DataFlow Manager - Frontend Master Controller Application Script

// Global state tracking
window.currentDataset = [];
let isHistoryExpanded = false;
let globalHistoryData = [];
// Global reference for Chart instance to prevent rendering overlaps
let myChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS SETUP
  // =========================================================================
  loadUploadHistory();
  setupHistoryToggle();
  setupFileUpload();
  setupDataCleaningControls();
  setupFilterAndResetControls();
  setupColumnStatsEventListener();
  setupDeleteModalEvents();
});

// =========================================================================
// SECTION 1: Helper Functions for UI Rendering
// =========================================================================

// Helper Function 1: Render Data Preview Table Dynamically & Update UI Elements
function renderPreviewTable(data) {
  const tableHeader = document.getElementById("tableHeader");
  const tableBody = document.getElementById("tableBody");

  if (!tableHeader || !tableBody) return;

  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  if (!data || data.length === 0) return;

  // Extract table column headers dynamically from JSON keys
  const columns = Object.keys(data[0]);

  // Build table header row (<th>)
  const headerRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);

  // Build table body data rows (<tr> and <td>)
  data.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((col) => {
      const td = document.createElement("td");
      td.textContent =
        row[col] !== null && row[col] !== undefined ? row[col] : "";
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  const previewContainer = document.getElementById("previewContainer");
  if (previewContainer) {
    previewContainer.style.display = "block";
  }

  // Populate Filter Dropdown automatically upon rendering table
  populateFilterDropdown(data);

  // Trigger Bar Chart Rendering automatically
  if (typeof renderBarChart === "function") {
    renderBarChart(data);
  }
}

// Helper Function 2: Populate Filter Columns Dropdown
function populateFilterDropdown(data) {
  const filterColumnSelect = document.getElementById("filterColumnSelect");
  if (!filterColumnSelect || !data || data.length === 0) return;

  filterColumnSelect.innerHTML =
    '<option value="">-- Select Column --</option>';
  const columns = Object.keys(data[0]);

  columns.forEach((col) => {
    const option = document.createElement("option");
    option.value = col;
    option.textContent = col;
    filterColumnSelect.appendChild(option);
  });
}

// Helper Function 3: Calculate Descriptive Statistics for Selected Column
function calculateColumnStats(data, selectedColumn) {
  if (!data || data.length === 0 || !selectedColumn) return;

  const values = data
    .map((row) => parseFloat(row[selectedColumn]))
    .filter((val) => !isNaN(val));

  const meanElem = document.getElementById("stat-mean");
  const medianElem = document.getElementById("stat-median");
  const minElem = document.getElementById("stat-min");
  const maxElem = document.getElementById("stat-max");

  if (values.length === 0) {
    if (meanElem) meanElem.textContent = "N/A";
    if (medianElem) medianElem.textContent = "N/A";
    if (minElem) minElem.textContent = "N/A";
    if (maxElem) maxElem.textContent = "N/A";
    return;
  }

  // Calculate Mean
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  const mean = (sum / values.length).toFixed(2);

  // Calculate Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid].toFixed(2)
      : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2);

  // Calculate Minimum and Maximum
  const min = Math.min(...values).toFixed(2);
  const max = Math.max(...values).toFixed(2);

  // Update UI Elements
  if (meanElem) meanElem.textContent = mean;
  if (medianElem) medianElem.textContent = median;
  if (minElem) minElem.textContent = min;
  if (maxElem) maxElem.textContent = max;
}

// =========================================================================
// SECTION 2: Upload History, Toggle Controls & Delete Actions
// =========================================================================

let pendingDeleteTarget = null;

// Fetch upload history list from Backend API and sync with localStorage
async function loadUploadHistory() {
  try {
    const response = await fetch("http://127.0.0.1:8000/history");
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    let serverHistory = data.history || [];

    // Apply local renames so they don't revert on refresh or fetch
    const renamedMap = JSON.parse(localStorage.getItem("renamedFilesMap")) || {};
    serverHistory = serverHistory.map((item) => {
      if (renamedMap[item.filename]) {
        return { ...item, filename: renamedMap[item.filename] };
      }
      return item;
    });

    globalHistoryData = serverHistory;

    // Save history to localStorage so details.html can access it properly
    localStorage.setItem(
      "globalHistoryData",
      JSON.stringify(globalHistoryData),
    );

    renderHistoryTable();
  } catch (error) {
    console.error("Error fetching upload history:", error);
  }
}

// Render history table rows dynamically with action controls
function renderHistoryTable() {
  const tbody = document.getElementById("historyTableBody");
  const toggleBtn = document.getElementById("toggleHistoryBtn");

  if (!tbody) return;
  tbody.innerHTML = "";

  if (globalHistoryData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: #777;">No upload history found.</td>
      </tr>
    `;
    if (toggleBtn) toggleBtn.style.display = "none";
    return;
  }

  const itemsToDisplay = isHistoryExpanded
    ? globalHistoryData
    : globalHistoryData.slice(0, 3);

  itemsToDisplay.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.filename}</td>
      <td>${item.upload_date}</td>
      <td style="text-align: center;">
        <button type="button" class="btn-action" onclick="viewFileDetails('${item.filename}')" title="View Details">
          <i class="fas fa-info-circle"></i>
        </button>
        <button type="button" class="btn-action" onclick="openRenameModal('${item.filename}')" title="Rename File">
          <i class="fas fa-pen"></i>
        </button>
        <button type="button" class="btn-delete-single" data-filename="${item.filename}" title="Delete File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (toggleBtn) {
    if (globalHistoryData.length > 3) {
      toggleBtn.style.display = "inline-block";
      toggleBtn.textContent = isHistoryExpanded ? "Show Less" : "Show More";
    } else {
      toggleBtn.style.display = "none";
    }
  }

  // Re-attach event listeners for newly rendered single delete buttons
  attachSingleDeleteListeners();
}

function attachSingleDeleteListeners() {
  document.querySelectorAll(".btn-delete-single").forEach((btn) => {
    btn.onclick = (e) => {
      const filename = e.currentTarget.getAttribute("data-filename");
      openDeleteModal("single", filename);
    };
  });
}

// Function to handle viewing file details and navigating to details page safely
function viewFileDetails(filename) {
  if (!filename) {
    alert("No file specified.");
    return;
  }
  
  // Save to all possible localStorage keys to guarantee compatibility
  localStorage.setItem("selectedFileDetail", filename);
  localStorage.setItem("selectedFile", filename);
  localStorage.setItem("filename", filename);

  // Redirect to details page with URL parameter as well
  window.location.href = `details.html?file=${encodeURIComponent(filename)}`;
}

// Function to open rename modal and persist changes locally
function openRenameModal(oldFilename) {
  const modal = document.getElementById("renameFileModal");
  const inputField = document.getElementById("new-filename-input");
  const currentDisplay = document.getElementById("current-file-display");

  if (!modal || !inputField) return;

  const lastDotIndex = oldFilename.lastIndexOf(".");
  const extension = lastDotIndex !== -1 ? oldFilename.substring(lastDotIndex) : "";
  const baseName = lastDotIndex !== -1 ? oldFilename.substring(0, lastDotIndex) : oldFilename;

  currentDisplay.textContent = oldFilename;
  inputField.value = baseName;
  modal.style.display = "flex";

  const saveBtn = document.getElementById("save-rename-btn");
  const cancelBtn = document.getElementById("cancel-rename-btn");

  saveBtn.onclick = function () {
    const newBaseName = inputField.value.trim();
    if (!newBaseName) {
      alert("File name cannot be empty.");
      return;
    }
    const updatedFilename = newBaseName + extension;
    modal.style.display = "none";

    // Update in global array and localStorage immediately so refresh keeps it
    const fileItem = globalHistoryData.find(
      (item) => item.filename === oldFilename
    );

    if (fileItem) {
      fileItem.filename = updatedFilename;
      localStorage.setItem("globalHistoryData", JSON.stringify(globalHistoryData));
      
      // Also save a rename map to persist across reloads if backend doesn't support it
      let renamedMap = JSON.parse(localStorage.getItem("renamedFilesMap")) || {};
      renamedMap[oldFilename] = updatedFilename;
      localStorage.setItem("renamedFilesMap", JSON.stringify(renamedMap));

      renderHistoryTable();
    }
  };

  if (cancelBtn) {
    cancelBtn.onclick = function () {
      modal.style.display = "none";
    };
  }
}

// History table expand/collapse toggle handler
function setupHistoryToggle() {
  const toggleBtn = document.getElementById("toggleHistoryBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isHistoryExpanded = !isHistoryExpanded;
      renderHistoryTable();
    });
  }
}

function openDeleteModal(type, filename = null) {
  const modal = document.getElementById("deleteModal");
  const modalMessage = document.getElementById("modalMessage");

  if (!modal || !modalMessage) return;

  if (type === "all") {
    pendingDeleteTarget = { type: "all" };
    modalMessage.textContent =
      "Are you sure you want to delete all upload history? This action cannot be undone.";
  } else if (type === "single") {
    pendingDeleteTarget = { type: "single", filename: filename };
    modalMessage.textContent = `Are you sure you want to delete "${filename}"?`;
  }

  modal.style.display = "flex";
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.style.display = "none";
  }
  pendingDeleteTarget = null;
}

function setupDeleteModalEvents() {
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (globalHistoryData.length === 0) {
        alert("Upload history is already empty.");
        return;
      }
      openDeleteModal("all");
    });
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!pendingDeleteTarget) return;

      try {
        if (pendingDeleteTarget.type === "all") {
          const response = await fetch("http://127.0.0.1:8000/history", {
            method: "DELETE",
          });
          if (response.ok) {
            globalHistoryData = [];
            localStorage.setItem(
              "globalHistoryData",
              JSON.stringify(globalHistoryData),
            );
            renderHistoryTable();
          }
        } else if (pendingDeleteTarget.type === "single") {
          const response = await fetch(
            `http://127.0.0.1:8000/history/${encodeURIComponent(pendingDeleteTarget.filename)}`,
            {
              method: "DELETE",
            },
          );
          if (response.ok) {
            globalHistoryData = globalHistoryData.filter(
              (item) => item.filename !== pendingDeleteTarget.filename,
            );
            localStorage.setItem(
              "globalHistoryData",
              JSON.stringify(globalHistoryData),
            );
            renderHistoryTable();
          }
        }

        await loadUploadHistory();
      } catch (error) {
        console.error("Error executing delete operation:", error);
      } finally {
        closeDeleteModal();
      }
    });
  }
}
// =========================================================================
// SECTION 3: File Upload Controls Setup
// =========================================================================

function setupFileUpload() {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const statusMessage = document.getElementById("statusMessage");

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.value = "";
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      e.preventDefault();

      const file = e.target.files[0];
      if (!file) return;

      if (statusMessage) {
        statusMessage.style.color = "#3498db";
        statusMessage.textContent = `Uploading ${file.name}...`;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
          if (statusMessage) {
            statusMessage.style.color = "#2ecc71";
            statusMessage.textContent = ` ${result.message} (${result.filename})`;
          }

          await loadUploadHistory();

          window.currentDataset = result.data || [];

          if (result.stats) {
            const rowElem = document.getElementById("stat-rows");
            const colElem = document.getElementById("stat-cols");
            const missElem = document.getElementById("stat-missing");
            const dupElem = document.getElementById("stat-duplicates");

            if (rowElem) rowElem.textContent = result.stats.total_rows;
            if (colElem) colElem.textContent = result.stats.total_columns;
            if (missElem) missElem.textContent = result.stats.missing_values;
            if (dupElem) dupElem.textContent = result.stats.duplicate_rows;

            const statsDashboard = document.getElementById("stats-dashboard");
            if (statsDashboard) statsDashboard.style.display = "grid";
          }

          const cleaningControls = document.getElementById("cleaning-controls");
          if (cleaningControls) cleaningControls.style.display = "block";

          const columnSelect = document.getElementById("columnSelect");
          const statsAnalysisContainer = document.getElementById(
            "stats-analysis-container",
          );

          if (columnSelect && result.columns) {
            columnSelect.innerHTML =
              '<option value="">-- Choose a Column --</option>';
            result.columns.forEach((col) => {
              if (col && col.trim() !== "" && col.toLowerCase() !== "nan") {
                const option = document.createElement("option");
                option.value = col;
                option.textContent = col;
                columnSelect.appendChild(option);
              }
            });
          }

          if (statsAnalysisContainer)
            statsAnalysisContainer.style.display = "block";

          if (result.data) {
            renderPreviewTable(result.data);
          }
        } else {
          if (statusMessage) {
            statusMessage.style.color = "#e74c3c";
            statusMessage.textContent = `${result.message || "Failed to upload file."}`;
          }
        }
      } catch (error) {
        if (statusMessage) {
          statusMessage.style.color = "#e74c3c";
          statusMessage.textContent = ` Error connecting to server: ${error.message}`;
        }
      }
    });
  }
}

// =========================================================================
// SECTION 4: Data Cleaning Controls Logic
// =========================================================================

function setupDataCleaningControls() {
  const removeDuplicatesBtn = document.getElementById("removeDuplicatesBtn");
  const removeMissingBtn = document.getElementById("removeMissingBtn");
  const fillMissingBtn = document.getElementById("fillMissingBtn");

  function updateStatsCards(dataset) {
    if (!dataset) return;

    const totalRows = dataset.length;
    const totalCols = dataset.length > 0 ? Object.keys(dataset[0]).length : 0;

    let missingCount = 0;
    dataset.forEach((row) => {
      Object.values(row).forEach((val) => {
        if (
          val === null ||
          val === "" ||
          val === undefined ||
          String(val).toLowerCase() === "nan"
        ) {
          missingCount++;
        }
      });
    });

    const uniqueStrings = new Set(dataset.map((item) => JSON.stringify(item)));
    const duplicateCount = dataset.length - uniqueStrings.size;

    const statRows = document.getElementById("stat-rows");
    const statCols = document.getElementById("stat-cols");
    const statMissing = document.getElementById("stat-missing");
    const statDuplicates = document.getElementById("stat-duplicates");

    if (statRows) statRows.textContent = totalRows;
    if (statCols) statCols.textContent = totalCols;
    if (statMissing) statMissing.textContent = missingCount;
    if (statDuplicates) statDuplicates.textContent = duplicateCount;
  }

  if (removeDuplicatesBtn) {
    removeDuplicatesBtn.addEventListener("click", () => {
      if (!window.currentDataset || window.currentDataset.length === 0) {
        alert("No dataset available to clean.");
        return;
      }

      const uniqueData = Array.from(
        new Set(window.currentDataset.map((item) => JSON.stringify(item))),
      ).map((item) => JSON.parse(item));

      const removedCount = window.currentDataset.length - uniqueData.length;
      window.currentDataset = uniqueData;

      renderPreviewTable(window.currentDataset);
      updateStatsCards(window.currentDataset);

      alert(`Successfully removed ${removedCount} duplicate row(s)!`);
    });
  }

  if (removeMissingBtn) {
    removeMissingBtn.addEventListener("click", () => {
      if (!window.currentDataset || window.currentDataset.length === 0) {
        alert("No dataset available to clean.");
        return;
      }

      const cleanedData = window.currentDataset.filter((row) =>
        Object.values(row).every(
          (val) =>
            val !== null &&
            val !== "" &&
            val !== undefined &&
            String(val).toLowerCase() !== "nan",
        ),
      );

      const removedCount = window.currentDataset.length - cleanedData.length;
      window.currentDataset = cleanedData;

      renderPreviewTable(window.currentDataset);
      updateStatsCards(window.currentDataset);

      alert(`Successfully removed ${removedCount} row(s) with missing values!`);
    });
  }

  if (fillMissingBtn) {
    fillMissingBtn.addEventListener("click", () => {
      const fillValueInput = document.getElementById("fillValueInput");
      const fillVal = fillValueInput ? fillValueInput.value.trim() : "";

      if (!fillVal) {
        alert("Please enter a fill value first.");
        return;
      }

      if (!window.currentDataset || window.currentDataset.length === 0) {
        alert("No dataset available to clean.");
        return;
      }

      let filledCount = 0;
      window.currentDataset = window.currentDataset.map((row) => {
        let newRow = { ...row };
        Object.keys(newRow).forEach((key) => {
          if (
            newRow[key] === null ||
            newRow[key] === "" ||
            newRow[key] === undefined ||
            String(newRow[key]).toLowerCase() === "nan"
          ) {
            newRow[key] = fillVal;
            filledCount++;
          }
        });
        return newRow;
      });

      renderPreviewTable(window.currentDataset);
      updateStatsCards(window.currentDataset);

      alert(
        `Successfully filled ${filledCount} missing value(s) with '${fillVal}'!`,
      );
    });
  }
}

// =========================================================================
// SECTION 5: Table Search, Filter & Reset Logic
// =========================================================================

function setupFilterAndResetControls() {
  const filterColumnSelect = document.getElementById("filterColumnSelect");
  const filterValueInput = document.getElementById("filterValueInput");
  const applyFilterBtn = document.getElementById("applyFilterBtn");
  const resetFilterBtn = document.getElementById("resetFilterBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const tableRows = document.querySelectorAll("#tableBody tr");

      tableRows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? "" : "none";
      });
    });
  }

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", () => {
      const selectedCol = filterColumnSelect ? filterColumnSelect.value : "";
      const filterVal = filterValueInput
        ? filterValueInput.value.trim().toLowerCase()
        : "";

      if (!selectedCol || !filterVal) {
        alert("Please select a column and enter a search value.");
        return;
      }

      if (!window.currentDataset || window.currentDataset.length === 0) return;

      const filteredData = window.currentDataset.filter((row) => {
        const cellValue = String(row[selectedCol] || "").toLowerCase();
        return cellValue.includes(filterVal);
      });

      renderPreviewTable(filteredData);
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
      if (filterColumnSelect) filterColumnSelect.value = "";
      if (filterValueInput) filterValueInput.value = "";
      if (searchInput) searchInput.value = "";

      if (window.currentDataset && window.currentDataset.length > 0) {
        renderPreviewTable(window.currentDataset);
      }
    });
  }
}

function setupColumnStatsEventListener() {
  const columnSelect = document.getElementById("columnSelect");
  if (columnSelect) {
    columnSelect.addEventListener("change", (e) => {
      const selectedColumn = e.target.value;
      const columnStatsCards = document.getElementById("column-stats-cards");

      if (selectedColumn) {
        if (columnStatsCards) columnStatsCards.style.display = "grid";
        calculateColumnStats(window.currentDataset, selectedColumn);
      } else {
        if (columnStatsCards) columnStatsCards.style.display = "none";
      }
    });
  }
}

// =========================================================================
// SECTION 6: Export Functionality (CSV & Excel)
// =========================================================================

const downloadCsvBtn = document.getElementById("downloadCsvBtn");
const downloadExcelBtn = document.getElementById("downloadExcelBtn");

function downloadDatasetAsCSV(data, filename = "exported_data.csv") {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  csvRows.push(headers.join(","));

  data.forEach((row) => {
    const values = headers.map((header) => {
      const escaped = ("" + (row[header] ?? "")).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  });

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener("click", () => {
    if (window.currentDataset && window.currentDataset.length > 0) {
      downloadDatasetAsCSV(window.currentDataset, "DataFlow_Export.csv");
    } else {
      alert("No data available to download.");
    }
  });
}

if (downloadExcelBtn) {
  downloadExcelBtn.addEventListener("click", () => {
    if (window.currentDataset && window.currentDataset.length > 0) {
      downloadDatasetAsCSV(window.currentDataset, "DataFlow_Export.xls");
    } else {
      alert("No data available to download.");
    }
  });
}

// =========================================================================
// SECTION 7: Chart.js Bar Chart Visualization
// =========================================================================

function renderBarChart(data) {
  if (!data || data.length === 0) return;

  const chartContainer = document.getElementById("chartContainer");
  const chartCanvas = document.getElementById("dataBarChart");
  if (!chartCanvas) return;

  const ctx = chartCanvas.getContext("2d");
  const keys = Object.keys(data[0]);

  const labelKey = keys.find((k) => typeof data[0][k] === "string") || keys[0];
  const valueKey =
    keys.find(
      (k) => typeof data[0][k] === "number" || !isNaN(parseFloat(data[0][k])),
    ) || keys[1];

  if (!labelKey || !valueKey) return;

  const labels = data.map((row) => row[labelKey]);
  const values = data.map((row) => parseFloat(row[valueKey]) || 0);

  if (myChartInstance) {
    myChartInstance.destroy();
  }

  myChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `${valueKey} by ${labelKey}`,
          data: values,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });

  if (chartContainer) {
    chartContainer.style.display = "block";
  }
}
