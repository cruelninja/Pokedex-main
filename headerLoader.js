document.addEventListener("DOMContentLoaded", async () => {
    try {
      const response = await fetch("header.html");
      if (!response.ok) {
        throw new Error(`Failed to load header: ${response.statusText}`);
      }
      const headerHTML = await response.text();
      document.getElementById("header-container").innerHTML = headerHTML;
    } catch (error) {
      console.error("Error loading header:", error);
    }
  });
  