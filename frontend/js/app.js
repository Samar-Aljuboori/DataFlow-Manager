document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const statusMessage = document.getElementById("statusMessage");

  // Function to generate and render the preview table dynamically from JSON response
  function renderPreviewTable(data) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

    // Clear and reset previous table headers and body rows to avoid duplicating data on new uploads
    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    // Guard clause: Exit early if backend data is missing or array is empty
    if (!data || data.length === 0) return;

    // 1. Extract table column headers dynamically from JSON keys
    const columns = Object.keys(data[0]);

    // 2. Build table header row (<th>)
    const headerRow = document.createElement("tr");
    columns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col;
      headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);

    // 3. Build table body data rows (<tr> and <td>)
    data.forEach((row) => {
      const tr = document.createElement("tr");
      columns.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = row[col];
        tr.appendChild(td);
      });
      tableBody.appendChild(tr);
    });

    // Show the preview table container
    const previewContainer = document.getElementById("previewContainer");
    if (previewContainer) {
      previewContainer.style.display = "block";
    }
  }

  // Trigger hidden file input click when custom upload button is clicked
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.value = ""; // Clear input value so selecting the same file triggers 'change' event
      fileInput.click();
    });
  }

  // Handle file selection and dispatch upload request to backend
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      e.preventDefault();

      const file = e.target.files[0];
      if (!file) return;

      // Display pending upload status message
      if (statusMessage) {
        statusMessage.style.color = "#3498db";
        statusMessage.textContent = `Uploading ${file.name}...`;
      }

      // Prepare multipart form data payload
      const formData = new FormData();
      formData.append("file", file);

      try {
        // Dispatch POST request to FastAPI upload endpoint
        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        // Handle successful upload response
        if (response.ok && result.status === "success") {
          if (statusMessage) {
            statusMessage.style.color = "#2ecc71";
            statusMessage.textContent = `✅ ${result.message} (${result.filename})`;
          }

          // Update Analysis Dashboard summary cards if stats exist
          if (result.stats) {
            const rowElem = document.getElementById("stat-rows");
            const colElem = document.getElementById("stat-cols");
            const missElem = document.getElementById("stat-missing");
            const dupElem = document.getElementById("stat-duplicates");

            if (rowElem) rowElem.textContent = result.stats.total_rows;
            if (colElem) colElem.textContent = result.stats.total_columns;
            if (missElem) missElem.textContent = result.stats.missing_values;
            if (dupElem) dupElem.textContent = result.stats.duplicate_rows;

            // Display the hidden summary dashboard section
            const statsDashboard = document.getElementById("stats-dashboard");
            if (statsDashboard) {
              statsDashboard.style.display = "grid";
            }
          }

          // Render data preview table if dataset rows are returned from backend
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
        console.error("Upload error:", error);
      }
    });
  }
});
