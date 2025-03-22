document.addEventListener("DOMContentLoaded", async () => {
  try {
    const headerContainer = document.getElementById("header-container");
    if (!headerContainer) {
      console.error("❌ Error: Header container not found.");
      return;
    }

    const response = await fetch("header.html");
    
    if (!response.ok) {
      throw new Error(`Failed to load header: ${response.statusText} (${response.status})`);
    }
    
    const headerHTML = await response.text();
    headerContainer.innerHTML = headerHTML;

    // Optional: Add any post-processing here (e.g., initializing components in the header)

  } catch (error) {
    console.error("❌ Error loading header:", error);
    
    // Fallback content
    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="error-container">
          <p>Failed to load header content.</p>
          <p>Please refresh the page or try again later.</p>
        </div>
      `;
    }
  }
});