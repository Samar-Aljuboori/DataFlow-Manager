document.addEventListener("DOMContentLoaded", () => {
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const statusMessage = document.getElementById("statusMessage");

    // Function to generate and render the preview table dynamically from JSON response
    function renderPreviewTable(data) {
        const tableHeader = document.getElementById("tableHeader");
        const tableBody = document.getElementById("tableBody");

        // Clear existing table contents before rendering new file data
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        if (!data || data.length === 0) return;

        // 1. Extract table column headers dynamically from JSON keys
        const columns = Object.keys(data[0]);

        // 2. Build table header row (<th>)
        const headerRow = document.createElement("tr");
        columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            headerRow.appendChild(th);
        });
        tableHeader.appendChild(headerRow);

        // 3. Build table body data rows (<tr> and <td>)
        data.forEach(row => {
            const tr = document.createElement("tr");
            columns.forEach(col => {
                const td = document.createElement("td");
                td.textContent = row[col];
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    // Trigger hidden file input click when custom upload button is clicked
    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    // Handle file selection and dispatch upload request to backend
    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Display pending upload status message
        statusMessage.style.color = "#3498db";
        statusMessage.textContent = `Uploading ${file.name}...`;

        // Prepare multipart form data payload
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Dispatch POST request to FastAPI upload endpoint
            const response = await fetch("http://127.0.0.1:8000/upload", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            // Handle successful upload response
            if (response.ok && result.status === "success") {
                statusMessage.style.color = "#2ecc71";
                statusMessage.textContent = `✅ ${result.message} (${result.filename})`;

                // Render data preview table if dataset rows are returned from backend
                if (result.data) {
                    renderPreviewTable(result.data);
                }
            } else {
                statusMessage.style.color = "#e74c3c";
                statusMessage.textContent = `❌ ${result.message || "Failed to upload file."}`;
            }
        } catch (error) {
            statusMessage.style.color = "#e74c3c";
            statusMessage.textContent = `❌ Error connecting to server: ${error.message}`;
        }
    });
});