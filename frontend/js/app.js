// DataFlow Manager - Frontend Master Controller Application Script (Part 1)

// Global state tracking
window.currentDataset = [];
let isHistoryExpanded = false;
let globalHistoryData = [];

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

// Global variable to hold pending deletion metadata
let pendingDeleteTarget = null; // Stores null for 'all' or filename string for 'single'

// Fetch upload history list from Backend API
async function loadUploadHistory() {
  try {
    const response = await fetch("http://127.0.0.1:8000/history");
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    globalHistoryData = data.history || [];

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

  // Handle empty history state (Updated colspan to 3 for the new action column)
  if (globalHistoryData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: #777;">No upload history found.</td>
      </tr>
    `;
    if (toggleBtn) toggleBtn.style.display = "none";
    return;
  }

  // Determine items slice based on toggle state
  const itemsToDisplay = isHistoryExpanded
    ? globalHistoryData
    : globalHistoryData.slice(0, 3);

  // Render rows with filename, date, and single delete action button
  itemsToDisplay.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.filename}</td>
      <td>${item.upload_date}</td>
      <td style="text-align: center;">
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

  // Attach dynamic event listeners to single delete buttons
  document.querySelectorAll(".btn-delete-single").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filename = e.currentTarget.getAttribute("data-filename");
      openDeleteModal("single", filename);
    });
  });

  // Toggle Show More / Show Less Button display state
  if (toggleBtn) {
    if (globalHistoryData.length > 3) {
      toggleBtn.style.display = "inline-block";
      toggleBtn.textContent = isHistoryExpanded ? "Show Less" : "Show More";
    } else {
      toggleBtn.style.display = "none";
    }
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

// Open Delete Confirmation Modal dialog
function openDeleteModal(type, filename = null) {
  const modal = document.getElementById("deleteModal");
  const modalMessage = document.getElementById("modalMessage");

  if (!modal || !modalMessage) return;

  if (type === "all") {
    pendingDeleteTarget = { type: "all" };
    modalMessage.textContent = "Are you sure you want to delete all upload history? This action cannot be undone.";
  } else if (type === "single") {
    pendingDeleteTarget = { type: "single", filename: filename };
    modalMessage.textContent = `Are you sure you want to delete "${filename}"?`;
  }

  modal.style.display = "flex";
}

// Close Delete Confirmation Modal dialog
function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  if (modal) {
    modal.style.display = "none";
  }
  pendingDeleteTarget = null;
}

// Event handlers for Delete Modal actions and API calls
function setupDeleteModalEvents() {
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Clear All History Button trigger
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (globalHistoryData.length === 0) {
        alert("Upload history is already empty.");
        return;
      }
      openDeleteModal("all");
    });
  }

  // Modal Cancel Button trigger
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  }

// Confirm Delete Handler (Connects to FastAPI API)
if (confirmDeleteBtn) {
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!pendingDeleteTarget) return;

    try {
      if (pendingDeleteTarget.type === "all") {
        // Send DELETE request to backend
        const response = await fetch("http://127.0.0.1:8000/history", { method: "DELETE" });
        if (response.ok) {
          globalHistoryData = []; // Clear local array
          renderHistoryTable();   // Re-render table immediately
        }
      } else if (pendingDeleteTarget.type === "single") {
        // Send DELETE request for a single file
        const response = await fetch(`http://127.0.0.1:8000/history/${encodeURIComponent(pendingDeleteTarget.filename)}`, {
          method: "DELETE",
        });
        if (response.ok) {
          globalHistoryData = globalHistoryData.filter(
            (item) => item.filename !== pendingDeleteTarget.filename
          );
          renderHistoryTable();
        }
      }
      
      // Reload history from server to guarantee sync
      await loadUploadHistory();
    } catch (error) {
      console.error("Error executing delete operation:", error);
    } finally {
      closeDeleteModal();
    }
  });
}
};
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

  // Helper function to update the summary statistic cards dynamically
  function updateStatsCards(dataset) {
    if (!dataset) return;
    
    const totalRows = dataset.length;
    const totalCols = dataset.length > 0 ? Object.keys(dataset[0]).length : 0;
    
    // Calculate missing values count
    let missingCount = 0;
    dataset.forEach(row => {
      Object.values(row).forEach(val => {
        if (val === null || val === "" || val === undefined || String(val).toLowerCase() === "nan") {
          missingCount++;
        }
      });
    });

    // Calculate duplicate rows count
    const uniqueStrings = new Set(dataset.map(item => JSON.stringify(item)));
    const duplicateCount = dataset.length - uniqueStrings.size;

    // Update DOM elements matching your HTML IDs
    const statRows = document.getElementById("stat-rows");
    const statCols = document.getElementById("stat-cols");
    const statMissing = document.getElementById("stat-missing");
    const statDuplicates = document.getElementById("stat-duplicates");

    if (statRows) statRows.textContent = totalRows;
    if (statCols) statCols.textContent = totalCols;
    if (statMissing) statMissing.textContent = missingCount;
    if (statDuplicates) statDuplicates.textContent = duplicateCount;
  }

  // Remove Duplicates Logic
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
      updateStatsCards(window.currentDataset); // Update stats cards and reset counters!

      alert(`Successfully removed ${removedCount} duplicate row(s)!`);
    });
  }

  // Remove Missing Values Logic
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
      updateStatsCards(window.currentDataset); // Update stats cards and reset counters to 0!

      alert(`Successfully removed ${removedCount} row(s) with missing values!`);
    });
  }

  // Fill Missing Values Logic
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
      updateStatsCards(window.currentDataset); // Update stats cards (missing values will become 0!)

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

  // Real-time Data Table Search
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

  // Column Specific Filter
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

  // Reset Filter Logic
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

// Event: Column Selection for Statistical Calculation
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

// Helper Function: Convert JSON Array to CSV String & Download
function downloadDatasetAsCSV(data, filename = "exported_data.csv") {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add Header Row
  csvRows.push(headers.join(","));

  // Add Data Rows
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

// Event Listener: Download CSV
if (downloadCsvBtn) {
  downloadCsvBtn.addEventListener("click", () => {
    if (window.currentDataset && window.currentDataset.length > 0) {
      downloadDatasetAsCSV(window.currentDataset, "DataFlow_Export.csv");
    } else {
      alert("No data available to download.");
    }
  });
}

// Event Listener: Download Excel
if (downloadExcelBtn) {
  downloadExcelBtn.addEventListener("click", () => {
    if (window.currentDataset && window.currentDataset.length > 0) {
      // Direct fallback to CSV format with .xls extension for standard compatibility
      downloadDatasetAsCSV(window.currentDataset, "DataFlow_Export.xls");
    } else {
      alert("No data available to download.");
    }
  });
}

// =========================================================================
// SECTION 7: Chart.js Bar Chart Visualization
// =========================================================================

// Global reference for Chart instance to prevent rendering overlaps
let myChartInstance = null;

/**
 * Render dynamic Bar Chart based on the current dataset.
 * Automatically selects the first string column as label and first numeric column as value.
 * @param {Array<Object>} data - The dataset array of objects.
 */
function renderBarChart(data) {
  if (!data || data.length === 0) return;

  const chartContainer = document.getElementById("chartContainer");
  const chartCanvas = document.getElementById("dataBarChart");
  if (!chartCanvas) return;

  const ctx = chartCanvas.getContext("2d");
  const keys = Object.keys(data[0]);

  // Identify first text column for categories/labels and first numeric column for dataset values
  const labelKey = keys.find((k) => typeof data[0][k] === "string") || keys[0];
  const valueKey =
    keys.find(
      (k) => typeof data[0][k] === "number" || !isNaN(parseFloat(data[0][k]))
    ) || keys[1];

  if (!labelKey || !valueKey) return;

  // Extract labels and numerical values
  const labels = data.map((row) => row[labelKey]);
  const values = data.map((row) => parseFloat(row[valueKey]) || 0);

  // Destroy previous Chart instance if it exists to avoid visual overlap bug
  if (myChartInstance) {
    myChartInstance.destroy();
  }

  // Instantiate new Bar Chart
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

  // Display chart container UI
  if (chartContainer) {
    chartContainer.style.display = "block";
  }
}