document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // SECTION 1: DOM Elements Declaration
  // =========================================================================
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const statusMessage = document.getElementById("statusMessage");

  // Global state variable to store current dataset for client-side analysis
  window.currentDataset = [];
  // =========================================================================
  // SECTION 2: Helper Functions
  // =========================================================================

  // Helper Function 1: Render Data Preview Table Dynamically & Update Dropdowns
  function renderPreviewTable(data) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

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
        td.textContent = row[col];
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
  }

  // Helper Function 2: Calculate Descriptive Statistics for Selected Column
  function calculateColumnStats(data, selectedColumn) {
    if (!data || data.length === 0 || !selectedColumn) return;

    // Extract numerical values for the selected column
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

  // Helper Function 3: Populate Filter Columns Dropdown
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
  // =========================================================================
  // SECTION 3: Custom Upload Button Event Trigger
  // =========================================================================
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.value = "";
      fileInput.click();
    });
  }

  // =========================================================================
  // SECTION 4: File Selection and Backend Upload Request Handler
  // =========================================================================
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
            statusMessage.textContent = `✅ ${result.message} (${result.filename})`;
          }

          // Save response dataset globally
          window.currentDataset = result.data || [];

          // Update summary dashboard statistics cards
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

          // Display cleaning UI controls section
          const cleaningControls = document.getElementById("cleaning-controls");
          if (cleaningControls) cleaningControls.style.display = "block";

          // Populate Column Dropdown Selector dynamically
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

          // Render data preview table
          if (result.data) {
            renderPreviewTable(result.data);
          }
        } else {
          if (statusMessage) {
            statusMessage.style.color = "#e74c3c";
            statusMessage.textContent = `❌ ${result.message || "Failed to upload file."}`;
          }
        }
      } catch (error) {
        if (statusMessage) {
          statusMessage.style.color = "#e74c3c";
          statusMessage.textContent = `❌ Error connecting to server: ${error.message}`;
        }
      }
    });
  }

  // =========================================================================
  // SECTION 5: Event Listeners for Data Cleaning Controls
  // =========================================================================
  const removeDuplicatesBtn = document.getElementById("removeDuplicatesBtn");
  const removeMissingBtn = document.getElementById("removeMissingBtn");
  const fillMissingBtn = document.getElementById("fillMissingBtn");

  if (removeDuplicatesBtn) {
    removeDuplicatesBtn.addEventListener("click", () => {
      console.log("Remove Duplicates triggered");
    });
  }

  if (removeMissingBtn) {
    removeMissingBtn.addEventListener("click", () => {
      console.log("Remove Missing Values triggered");
    });
  }

  if (fillMissingBtn) {
    fillMissingBtn.addEventListener("click", () => {
      const fillValue = document.getElementById("fillValueInput").value;
      console.log("Fill Missing Values triggered with value:", fillValue);
    });
  }

  // =========================================================================
  // SECTION 6: Event Listeners for Statistics, Search & Column Filtering
  // =========================================================================

  // Event 1: Column Selection for Statistical Calculation
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

  // Event 2: Real-time Data Table Filtering Search Bar
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const tableRows = document.querySelectorAll("#tableBody tr");

      tableRows.forEach((row) => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  }

  // Event 3: Column-based Specific Filtering 
  const filterColumnSelect = document.getElementById("filterColumnSelect");
  const filterValueInput = document.getElementById("filterValueInput");
  const applyFilterBtn = document.getElementById("applyFilterBtn");
  const resetFilterBtn = document.getElementById("resetFilterBtn");

  // Apply Filter Logic
  if (applyFilterBtn) {
    applyFilterBtn.addEventListener("click", () => {
      const selectedCol = filterColumnSelect ? filterColumnSelect.value : "";
      const filterVal = filterValueInput
        ? filterValueInput.value.trim().toLowerCase()
        : "";

      if (!selectedCol || !filterVal || !window.currentDataset) return;

      const filteredData = window.currentDataset.filter((row) => {
        const cellValue = String(row[selectedCol] || "").toLowerCase();
        return cellValue === filterVal || cellValue.includes(filterVal);
      });

      renderPreviewTable(filteredData);
    });
  }

  // Reset Filter Logic
  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
      if (filterColumnSelect) filterColumnSelect.value = "";
      if (filterValueInput) filterValueInput.value = "";
      if (window.currentDataset) {
        renderPreviewTable(window.currentDataset);
      }
    });
  }
});
// =========================================================================
  // SECTION 7: Export Functionality (Stage 42)
  // =========================================================================
  const downloadCsvBtn = document.getElementById("downloadCsvBtn");
  const downloadExcelBtn = document.getElementById("downloadExcelBtn");

  // Helper Function: Convert JSON Array to CSV String & Download
  function downloadDatasetAsCSV(data, filename = "exported_data.csv") {
    if (!data || data.length === 0) return;

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
      }
    });
  }

  // Event Listener: Download Excel (Triggering backend or XLSX handler)
  if (downloadExcelBtn) {
    downloadExcelBtn.addEventListener("click", () => {
      console.log("Download Excel triggered");
      // Optional: Send request to FastAPI backend endpoint for Excel generation
    });
  }