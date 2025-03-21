document.addEventListener("DOMContentLoaded", () => {
  const bbCounter = new Counter("breaking_bad");
  const gotCounter = new Counter("game_of_thrones");

  // Get DOM elements
  const bbPoints = document.getElementById("bbPoints");
  const gotPoints = document.getElementById("gotPoints");
  const bbPPS = document.getElementById("bbPPS");
  const gotPPS = document.getElementById("gotPPS");
  const bbPersonal = document.getElementById("bbPersonal");
  const gotPersonal = document.getElementById("gotPersonal");
  const bbBackground = document.querySelector(".bb-background");
  const gotBackground = document.querySelector(".got-background");
  const winnerStatus = document.getElementById("winnerStatus");

  function createFloatingPoint(x, y) {
    const point = document.createElement("div");
    point.className = "floating-point";
    point.textContent = "+1";
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
    document.body.appendChild(point);
    setTimeout(() => point.remove(), 1000);
  }

  function updateBackgroundWidths() {
    const totalSpeed =
      bbCounter.incrementPerSecond + gotCounter.incrementPerSecond;
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // For mobile: top-bottom split instead of left-right
      if (totalSpeed === 0) {
        bbBackground.style.clipPath = "inset(0 0 50% 0)";
        gotBackground.style.clipPath = "inset(50% 0 0 0)";
        return;
      }

      const bbPercentage = (bbCounter.incrementPerSecond / totalSpeed) * 100;
      const gotPercentage = 100 - bbPercentage;

      // Ensure minimum height of 15% for each side
      const bbHeight = bbPercentage === 0 ? 0 : Math.max(15, bbPercentage);
      const gotHeight = gotPercentage === 0 ? 0 : Math.max(15, gotPercentage);

      bbBackground.style.clipPath = `inset(0 0 ${100 - bbHeight}% 0)`;
      gotBackground.style.clipPath = `inset(${bbHeight}% 0 0 0)`;
    } else {
      // Desktop: left-right split (existing code)
      if (totalSpeed === 0) {
        bbBackground.style.clipPath = "inset(0 50% 0 0)";
        gotBackground.style.clipPath = "inset(0 0 0 50%)";
        return;
      }

      const bbPercentage = (bbCounter.incrementPerSecond / totalSpeed) * 100;
      const gotPercentage = 100 - bbPercentage;

      // Ensure minimum width of 15% only when both have some votes
      const bbWidth = bbPercentage === 0 ? 0 : Math.max(15, bbPercentage);
      const gotWidth = gotPercentage === 0 ? 0 : Math.max(15, gotPercentage);

      bbBackground.style.clipPath = `inset(0 ${100 - bbWidth}% 0 0)`;
      gotBackground.style.clipPath = `inset(0 0 0 ${100 - gotWidth}%)`;
    }
  }

  function updateWinnerStatus() {
    const bbTotal = bbCounter.value;
    const gotTotal = gotCounter.value;
    const diff = Math.abs(bbTotal - gotTotal);

    // Check if both counters are at 0 - initial state
    if (bbTotal === 0 && gotTotal === 0) {
      winnerStatus.textContent =
        "🔥 THE EPIC BATTLE AWAITS! CHOOSE YOUR CHAMPION! 🔥";
      winnerStatus.className = "winner-status battle-begin";
      return;
    }

    if (bbTotal === gotTotal) {
      winnerStatus.textContent = "EPIC STANDOFF! It's a tie!";
      winnerStatus.className = "winner-status tie";
    } else {
      const leader = bbTotal > gotTotal ? "Breaking Bad" : "Game of Thrones";
      const verb = [
        "dominating",
        "crushing",
        "ruling",
        "leading",
        "conquering",
      ][Math.floor(Math.random() * 5)];

      // Different messages based on lead size
      let message;
      if (diff > 1000) {
        message = `${leader} is absolutely DOMINATING with a massive ${bbCounter.formatNumber(
          diff
        )} point lead!`;
      } else if (diff > 500) {
        message = `${leader} is ${verb.toUpperCase()} the battle with ${bbCounter.formatNumber(
          diff
        )} points ahead!`;
      } else if (diff > 100) {
        message = `${leader} takes the lead by ${bbCounter.formatNumber(
          diff
        )} points! Can they be stopped?`;
      } else {
        message = `${leader} is narrowly winning by ${bbCounter.formatNumber(
          diff
        )} points! The battle rages on!`;
      }

      winnerStatus.textContent = message;
      winnerStatus.className = `winner-status ${
        bbTotal > gotTotal ? "bb-winning" : "got-winning"
      }`;
    }
  }

  function updateDisplay() {
    bbPoints.textContent = bbCounter.formatNumber(bbCounter.value);
    gotPoints.textContent = gotCounter.formatNumber(gotCounter.value);
    bbPPS.textContent = `${bbCounter.formatNumber(
      bbCounter.incrementPerSecond
    )} points per second`;
    gotPPS.textContent = `${gotCounter.formatNumber(
      gotCounter.incrementPerSecond
    )} points per second`;

    // Only update the number, not the entire text
    bbPersonal.textContent = bbCounter.formatNumber(bbCounter.personalScore);
    gotPersonal.textContent = gotCounter.formatNumber(gotCounter.personalScore);

    updateBackgroundWidths();
    updateWinnerStatus();
  }

  // Fetch updated counters from server
  async function fetchCounters() {
    try {
      const response = await fetch("/api/counters");
      if (response.ok) {
        const data = await response.json();
        bbCounter.updateFromApiData(data);
        gotCounter.updateFromApiData(data);
        updateDisplay();
      }
    } catch (error) {
      console.error("Error fetching counters:", error);
    }
  }

  // Add click handlers
  document.getElementById("bbBtn").addEventListener("click", async (e) => {
    const success = await bbCounter.increment();
    if (success) {
      createFloatingPoint(e.clientX, e.clientY);
      updateDisplay();
    }
  });

  document.getElementById("gotBtn").addEventListener("click", async (e) => {
    const success = await gotCounter.increment();
    if (success) {
      createFloatingPoint(e.clientX, e.clientY);
      updateDisplay();
    }
  });

  // Reset functionality
  const resetButton = document.getElementById("resetButton");
  const authModal = document.getElementById("authModal");
  const authCode = document.getElementById("authCode");
  const confirmReset = document.getElementById("confirmReset");
  const cancelReset = document.getElementById("cancelReset");

  // Show auth modal when reset button is clicked
  resetButton.addEventListener("click", () => {
    authModal.style.display = "flex";
    authCode.value = ""; // Clear previous input
    authCode.focus();
  });

  // Close modal when cancel is clicked
  cancelReset.addEventListener("click", () => {
    authModal.style.display = "none";
  });

  // Handle reset confirmation
  confirmReset.addEventListener("click", async () => {
    const code = authCode.value.trim();

    if (code === "RETRIBUTION") {
      try {
        const response = await fetch("/api/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: code }),
        });

        if (response.ok) {
          // Clear local storage for personal scores
          localStorage.clear();

          // Reset personal scores in memory
          bbCounter.personalScore = 0;
          gotCounter.personalScore = 0;

          // Show reset success message
          alert("All counters have been reset successfully!");

          // Refresh counters from server
          await fetchCounters();
          updateDisplay();

          // Close modal
          authModal.style.display = "none";
        } else {
          alert("Reset failed. Please try again.");
        }
      } catch (error) {
        console.error("Error during reset:", error);
        alert("An error occurred during reset.");
      }
    } else {
      alert("Incorrect admin code. Reset canceled.");
    }
  });

  // Allow Enter key in the auth input field
  authCode.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      confirmReset.click();
    }
    // Allow Escape key to cancel
    if (event.key === "Escape") {
      cancelReset.click();
    }
  });

  // Close modal if clicked outside
  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      authModal.style.display = "none";
    }
  });

  // Initial fetch and display
  fetchCounters();

  // Update display every second with fresh data from server
  setInterval(fetchCounters, 1000);

  // Add window resize listener to update layout when orientation changes
  window.addEventListener("resize", updateDisplay);

  // Image rotation variables
  let imageRotationInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
  let lastRotation = Date.now();
  let rotationTimer;

  // Function to fetch and update images
  async function rotateImages() {
    try {
      console.log("Rotating images...");

      // Fetch Breaking Bad image
      const bbResponse = await fetch("/api/images/breaking_bad");
      if (bbResponse.ok) {
        const bbData = await bbResponse.json();
        console.log("New BB image:", bbData.image_url);
        bbBackground.style.backgroundImage = `url("${bbData.image_url}")`;
      }

      // Fetch Game of Thrones image
      const gotResponse = await fetch("/api/images/game_of_thrones");
      if (gotResponse.ok) {
        const gotData = await gotResponse.json();
        console.log("New GOT image:", gotData.image_url);
        gotBackground.style.backgroundImage = `url("${gotData.image_url}")`;
      }

      lastRotation = Date.now();
    } catch (error) {
      console.error("Error rotating images:", error);
    }
  }

  // Function to start image rotation timer
  function startRotationTimer() {
    if (rotationTimer) clearInterval(rotationTimer);

    // Initial rotation
    rotateImages();

    // Set up interval for future rotations
    rotationTimer = setInterval(rotateImages, imageRotationInterval);

    console.log(
      `Image rotation set to ${imageRotationInterval / 1000} seconds`
    );
  }

  // Fetch current rotation interval from server
  async function fetchRotationInterval() {
    try {
      const response = await fetch("/api/rotation-interval");
      if (response.ok) {
        const data = await response.json();
        imageRotationInterval = data.interval;

        // Update input fields
        document.getElementById("hoursInput").value = Math.floor(
          data.interval_hours
        );
        document.getElementById("minutesInput").value = Math.floor(
          data.interval_minutes % 60
        );
        document.getElementById("secondsInput").value = Math.floor(
          data.interval_seconds % 60
        );

        // Restart timer with new interval
        startRotationTimer();
      }
    } catch (error) {
      console.error("Error fetching rotation interval:", error);
    }
  }

  // Initialize the image rotation
  fetchRotationInterval();

  // Authentication modal tabs
  const resetTabBtn = document.getElementById("resetTabBtn");
  const timerTabBtn = document.getElementById("timerTabBtn");
  const resetTab = document.getElementById("resetTab");
  const timerTab = document.getElementById("timerTab");

  resetTabBtn.addEventListener("click", () => {
    resetTabBtn.classList.add("active");
    timerTabBtn.classList.remove("active");
    resetTab.style.display = "block";
    timerTab.style.display = "none";
  });

  timerTabBtn.addEventListener("click", () => {
    timerTabBtn.classList.add("active");
    resetTabBtn.classList.remove("active");
    timerTab.style.display = "block";
    resetTab.style.display = "none";
  });

  // Timer update functionality
  const saveTimer = document.getElementById("saveTimer");
  const cancelTimer = document.getElementById("cancelTimer");
  const timerAuthCode = document.getElementById("timerAuthCode");
  const hoursInput = document.getElementById("hoursInput");
  const minutesInput = document.getElementById("minutesInput");
  const secondsInput = document.getElementById("secondsInput");

  saveTimer.addEventListener("click", async () => {
    const code = timerAuthCode.value.trim();

    if (code === "RETRIBUTION") {
      try {
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;

        // At least one unit must be > 0
        if (hours === 0 && minutes === 0 && seconds === 0) {
          alert("Please set a valid time interval (at least 1 second)");
          return;
        }

        // Send update to server
        const response = await fetch("/api/rotation-interval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code,
            hours: hours,
            minutes: minutes,
            seconds: seconds,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          imageRotationInterval = data.interval;

          // Restart timer with new interval
          startRotationTimer();

          // Close modal
          authModal.style.display = "none";

          alert(
            `Image rotation timer updated to ${hours}h ${minutes}m ${seconds}s`
          );
        } else {
          alert("Failed to update timer. Please try again.");
        }
      } catch (error) {
        console.error("Error updating timer:", error);
        alert("An error occurred while updating the timer.");
      }
    } else {
      alert("Incorrect admin code. Timer update canceled.");
    }
  });

  cancelTimer.addEventListener("click", () => {
    authModal.style.display = "none";
  });
});
