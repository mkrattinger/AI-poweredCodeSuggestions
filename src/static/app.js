document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear existing options except placeholder
      // Keep the first placeholder option if it exists
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

          // Build activity card skeleton
          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-section">
              <strong>Participants:</strong>
              <div class="participants-container"></div>
            </div>
          `;

          activitiesList.appendChild(activityCard);

          // Populate participants list programmatically so we can attach handlers
          const participantsContainer = activityCard.querySelector(
            ".participants-container"
          );

          if (details.participants && details.participants.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "participants-list";

            details.participants.forEach((p) => {
              const li = document.createElement("li");
              li.className = "participant-item";
              const span = document.createElement("span");
              span.textContent = p;

              const btn = document.createElement("button");
              btn.className = "delete-btn";
              btn.setAttribute("aria-label", `Unregister ${p}`);
              btn.title = "Unregister participant";
              btn.innerHTML = "&#x2716;"; // heavy multiplication X

              // Click handler to unregister
              btn.addEventListener("click", async () => {
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                    { method: "DELETE" }
                  );

                  if (resp.ok) {
                    // remove li from DOM
                    li.remove();

                    // If no more participants, show empty hint
                    if (ul.querySelectorAll("li").length === 0) {
                      participantsContainer.innerHTML =
                        '<div class="participants-empty">No participants yet.</div>';
                    }

                    // Update availability counter
                    const availEl = activityCard.querySelector(".availability");
                    if (availEl) {
                      const match = availEl.textContent.match(/(\d+) spots left/);
                      if (match) {
                        const current = parseInt(match[1], 10);
                        availEl.textContent = `Availability: ${current + 1} spots left`;
                      }
                    }
                  } else {
                    const result = await resp.json();
                    alert(result.detail || "Failed to unregister participant");
                  }
                } catch (err) {
                  console.error("Error unregistering participant:", err);
                  alert("Network error while unregistering participant");
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });

            participantsContainer.appendChild(ul);
          } else {
            participantsContainer.innerHTML =
              '<div class="participants-empty">No participants yet.</div>';
          }

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed up participant appears immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
