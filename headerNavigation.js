// headerNavigation.js
document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("header-container");
    if (header) {
      header.addEventListener("click", () => {
        window.location.href = "SidePanel.html"; // Change to your actual Pokémon list page
      });
    }
  });