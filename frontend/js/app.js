document.addEventListener("DOMContentLoaded", () => {
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const statusMessage = document.getElementById("statusMessage");

    // Trigger hidden file input click when upload button is clicked
    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    // Handle file selection and handle API upload request
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

            if (response.ok && result.status === "success") {
                statusMessage.style.color = "#2ecc71";
                statusMessage.textContent = `✅ ${result.message} (${result.filename})`;
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