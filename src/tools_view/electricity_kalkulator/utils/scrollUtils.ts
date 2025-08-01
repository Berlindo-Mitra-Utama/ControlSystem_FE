/**
 * Utility functions for handling scroll behavior to GIRAF Tech Solution section
 */

export const scrollToGirafTeam = () => {
  // Navigate to landing page first
  window.location.href = "/#giraf-team";

  // Smooth scroll to element after navigation
  setTimeout(() => {
    const element = document.getElementById("giraf-team");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 200);
};

export const handleGirafTeamClick = (navigate: any) => {
  // Navigate to landing page with hash
  navigate("/#giraf-team");

  // Smooth scroll to element after navigation
  setTimeout(() => {
    const element = document.getElementById("giraf-team");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 200);
};
