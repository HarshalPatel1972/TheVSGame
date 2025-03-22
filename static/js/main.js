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

    // Exact tie scenario
    if (bbTotal === gotTotal) {
      winnerStatus.textContent =
        "EPIC STANDOFF! The battle is perfectly balanced, like Walter White's chemistry!";
      winnerStatus.className = "winner-status tie";
      return;
    }

    // Determine which show is leading
    const leader = bbTotal > gotTotal ? "Breaking Bad" : "Game of Thrones";
    let messageClass = bbTotal > gotTotal ? "bb-winning" : "got-winning";

    // Get a fixed message based on the difference level
    let message = getStatusMessageByLevel(leader, diff);

    // Update the status
    winnerStatus.textContent = message;
    winnerStatus.className = `winner-status ${messageClass}`;
  }

  // Function to get status message based on discrete levels of difference
  function getStatusMessageByLevel(leader, diff) {
    // Define the difference thresholds for each level
    const levels = [
      { threshold: 10, intensity: "barely" },
      { threshold: 50, intensity: "slightly" },
      { threshold: 100, intensity: "notably" },
      { threshold: 250, intensity: "clearly" },
      { threshold: 500, intensity: "strongly" },
      { threshold: 1000, intensity: "dominantly" },
      { threshold: 2500, intensity: "overwhelmingly" },
      { threshold: 5000, intensity: "crushingly" },
    ];

    // Find the appropriate level based on the difference
    let level = levels.find(
      (level, index) => diff <= level.threshold || index === levels.length - 1
    );

    // If difference exceeds all thresholds, use the highest level
    if (!level) {
      level = levels[levels.length - 1];
    }

    // Get themed message based on leader and intensity level
    if (leader === "Breaking Bad") {
      return getBBMessage(diff, level.intensity);
    } else {
      return getGOTMessage(diff, level.intensity);
    }
  }

  // Breaking Bad themed messages by intensity level
  function getBBMessage(diff, intensity) {
    const formattedDiff = new Intl.NumberFormat().format(Math.floor(diff));

    switch (intensity) {
      case "barely":
        return `Breaking Bad edges ahead with a ${formattedDiff} point lead. The chemistry is just beginning.`;

      case "slightly":
        return `Breaking Bad is ${formattedDiff} points ahead. Jesse would say "This is the way, yo!"`;

      case "notably":
        return `Breaking Bad leads by ${formattedDiff} points. "I am the one who knocks!"`;

      case "clearly":
        return `Breaking Bad is ahead by ${formattedDiff} points. Walter White's empire is growing!`;

      case "strongly":
        return `Breaking Bad commands a ${formattedDiff} point lead! "Say my name!"`;

      case "dominantly":
        return `Breaking Bad is DOMINATING with a ${formattedDiff} point advantage! The blue stuff is selling fast!`;

      case "overwhelmingly":
        return `BREAKING BAD CRUSHES with a MASSIVE ${formattedDiff} POINT LEAD! "I AM THE DANGER!"`;

      case "crushingly":
        return `BREAKING BAD REIGNS SUPREME! A STAGGERING ${formattedDiff} POINT EMPIRE! HEISENBERG'S VICTORY IS ABSOLUTE!`;

      default:
        return `Breaking Bad leads by ${formattedDiff} points.`;
    }
  }

  // Game of Thrones themed messages by intensity level
  function getGOTMessage(diff, intensity) {
    const formattedDiff = new Intl.NumberFormat().format(Math.floor(diff));

    switch (intensity) {
      case "barely":
        return `Game of Thrones edges ahead with a ${formattedDiff} point lead. The game has just begun.`;

      case "slightly":
        return `Game of Thrones is ${formattedDiff} points ahead. "The North Remembers!"`;

      case "notably":
        return `Game of Thrones leads by ${formattedDiff} points. Winter is definitely coming!`;

      case "clearly":
        return `Game of Thrones is ahead by ${formattedDiff} points. "Chaos is a ladder."`;

      case "strongly":
        return `Game of Thrones commands a ${formattedDiff} point lead! "A Lannister always pays his debts."`;

      case "dominantly":
        return `Game of Thrones is DOMINATING with a ${formattedDiff} point advantage! "Bend the knee!"`;

      case "overwhelmingly":
        return `GAME OF THRONES CRUSHES with a MASSIVE ${formattedDiff} POINT LEAD! "DRACARYS!"`;

      case "crushingly":
        return `GAME OF THRONES REIGNS SUPREME! A STAGGERING ${formattedDiff} POINT CONQUEST! THE IRON THRONE STANDS UNCHALLENGED!`;

      default:
        return `Game of Thrones leads by ${formattedDiff} points.`;
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
          // The personal scores will be reset on the server
          // We need to refetch our personal scores
          await bbCounter.fetchPersonalScores();
          await gotCounter.fetchPersonalScores();

          // Refresh counters from server
          await fetchCounters();
          updateDisplay();

          // Show reset success message
          alert("All counters have been reset successfully!");

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
  async function initialize() {
    // First, fetch personal scores for each counter
    await bbCounter.fetchPersonalScores();
    await gotCounter.fetchPersonalScores();

    // Then fetch global counters
    await fetchCounters();

    // Update display with all data
    updateDisplay();

    // Initialize mobile image optimization
    if (window.innerWidth <= 768) {
      optimizeMobileImages();
    }
  }

  // Function to optimize images for mobile
  function optimizeMobileImages() {
    // Mobile image optimization
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isMobile) {
      // Set appropriate background-position based on device orientation
      if (isLandscape) {
        bbBackground.style.backgroundPosition = "center center";
        gotBackground.style.backgroundPosition = "center center";
      } else {
        // Portrait mode
        if (window.innerWidth < 361) {
          // Very small screens
          bbBackground.style.backgroundPosition = "center 20%";
          gotBackground.style.backgroundPosition = "center 20%";
        } else {
          // Regular mobile
          bbBackground.style.backgroundPosition = "center 25%";
          gotBackground.style.backgroundPosition = "center 25%";
        }
      }
    }
  }

  // Listen for orientation changes
  window.addEventListener("orientationchange", function () {
    setTimeout(optimizeMobileImages, 300); // Small delay to allow orientation to complete
  });

  // Enhanced window resize listener
  window.addEventListener("resize", function () {
    updateDisplay();
    optimizeMobileImages();
  });

  // Image rotation variables
  let imageRotationInterval = 2 * 60 * 1000; // 2 minutes in milliseconds
  let lastRotation = Date.now();
  let rotationTimer = null;
  let scheduledRotation = null;

  // Function to fetch and update images
  async function rotateImages() {
    try {
      console.log("Rotating images at", new Date().toLocaleTimeString());

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

      // Schedule next rotation at exact interval
      scheduleNextRotation();
    } catch (error) {
      console.error("Error rotating images:", error);
      // Even if there's an error, try to schedule the next rotation
      scheduleNextRotation();
    }
  }

  // Schedule next rotation at exact interval
  function scheduleNextRotation() {
    // Clear any existing scheduled rotation
    if (scheduledRotation) {
      clearTimeout(scheduledRotation);
    }

    // Schedule next rotation
    scheduledRotation = setTimeout(rotateImages, imageRotationInterval);
    console.log(
      `Next image rotation scheduled in ${
        imageRotationInterval / 1000
      } seconds at`,
      new Date(Date.now() + imageRotationInterval).toLocaleTimeString()
    );
  }

  // Function to start image rotation timer
  function startRotationTimer() {
    // Clear any existing timers
    if (rotationTimer) clearInterval(rotationTimer);
    if (scheduledRotation) clearTimeout(scheduledRotation);

    console.log(
      `Setting up image rotation every ${imageRotationInterval / 1000} seconds`
    );

    // Only schedule next rotation, don't immediately rotate images when changing timer
    scheduleNextRotation();
  }

  // Initialize image rotation - we want to do initial rotation only on first load
  async function initializeImageRotation() {
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

        // Do initial rotation only on first page load
        rotateImages();

        console.log(
          `Initial rotation interval: ${imageRotationInterval / 1000}s`
        );
      }
    } catch (error) {
      console.error("Error fetching rotation interval:", error);
    }
  }

  // Fetch current rotation interval from server when timer settings change
  async function updateRotationInterval() {
    try {
      const response = await fetch("/api/rotation-interval");
      if (response.ok) {
        const data = await response.json();

        // Only restart timer if interval has changed
        if (imageRotationInterval !== data.interval) {
          console.log(
            `Updating rotation interval from ${
              imageRotationInterval / 1000
            }s to ${data.interval / 1000}s`
          );
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

          // Restart timer with new interval (but don't rotate images immediately)
          startRotationTimer();
        } else {
          console.log(
            `Rotation interval unchanged: ${imageRotationInterval / 1000}s`
          );

          // If no timer is running, start one
          if (!scheduledRotation) {
            startRotationTimer();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching rotation interval:", error);
    }
  }

  // Initialize the image rotation
  initializeImageRotation();

  // Feedback Form Functionality
  const feedbackButton = document.getElementById("feedbackButton");
  const feedbackModal = document.getElementById("feedbackModal");
  const closeFeedback = document.getElementById("closeFeedback");
  const feedbackForm = document.getElementById("feedbackForm");
  const feedbackText = document.getElementById("feedbackText");
  const feedbackName = document.getElementById("feedbackName");
  const feedbackEmail = document.getElementById("feedbackEmail");
  const sendWhatsapp = document.getElementById("sendWhatsapp");
  const sendEmail = document.getElementById("sendEmail");
  const emailError = document.getElementById("emailError");
  const emailRequiredMark = document.getElementById("emailRequiredMark");
  const sendingIndicator = document.getElementById("sendingIndicator");
  const sendSuccess = document.getElementById("sendSuccess");

  // Initialize EmailJS credentials from server
  async function initEmailJS() {
    try {
      // Directly initialize with hardcoded credentials to ensure it works
      emailjs.init("qYOJV5V7vI8_9IQDh");
      console.log("EmailJS initialized with hardcoded credentials");

      // Store credentials for later use
      window.emailjsConfig = {
        serviceId: "service_nmu9der",
        templateId: "template_9526hmt",
      };

      return true;
    } catch (error) {
      console.error("EmailJS initialization error:", error);
      return false;
    }
  }

  // Call this function immediately to ensure EmailJS is initialized
  initEmailJS();

  // Show feedback modal when button is clicked
  feedbackButton.addEventListener("click", () => {
    feedbackModal.style.display = "flex";
    emailRequiredMark.textContent = "(required)"; // Changed to required
    emailError.textContent = "";
    sendSuccess.style.display = "none";
  });

  // Close feedback modal
  closeFeedback.addEventListener("click", () => {
    feedbackModal.style.display = "none";
  });

  // Close modal if clicked outside content
  feedbackModal.addEventListener("click", (event) => {
    if (event.target === feedbackModal) {
      feedbackModal.style.display = "none";
    }
  });

  // Send via WhatsApp
  sendWhatsapp.addEventListener("click", () => {
    if (!feedbackText.value.trim()) {
      alert("Please enter your feedback");
      return;
    }

    // Make email required for WhatsApp option
    if (!feedbackEmail.value.trim()) {
      emailRequiredMark.textContent = "(required)";
      emailError.textContent = "Email is required when sending via WhatsApp";
      feedbackEmail.focus();
      return;
    }

    // Clear any previous errors
    emailError.textContent = "";

    const name = feedbackName.value.trim()
      ? `Name: ${feedbackName.value}\n`
      : "";
    const email = feedbackEmail.value.trim()
      ? `Email: ${feedbackEmail.value}\n`
      : "";
    const feedback = `Feedback: ${feedbackText.value}`;

    const message = encodeURIComponent(`${name}${email}${feedback}`);
    window.open(`https://wa.me/917017297823?text=${message}`, "_blank");

    // Also save feedback to the server
    fetch("/api/save-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: feedbackName.value.trim(),
        email: feedbackEmail.value.trim(),
        feedback: feedbackText.value.trim(),
      }),
    }).catch((error) => console.error("Error saving feedback:", error));

    // Reset form and close modal
    feedbackForm.reset();
    feedbackModal.style.display = "none";
  });

  // Update the form submission logic
  sendEmail.addEventListener("click", async () => {
    // Check for required fields
    if (!feedbackText.value.trim()) {
      alert("Please enter your feedback");
      return;
    }

    // Make email required - new validation
    if (!feedbackEmail.value.trim()) {
      emailError.textContent = "Email is required";
      feedbackEmail.focus();
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedbackEmail.value.trim())) {
      emailError.textContent = "Please enter a valid email address";
      feedbackEmail.focus();
      return;
    }

    // Show sending indicator
    sendingIndicator.style.display = "block";
    sendSuccess.style.display = "none";

    try {
      // Prepare template parameters - make sure these variable names match your EmailJS template
      const templateParams = {
        to_name: "Admin",
        from_name: feedbackName.value.trim() || "Anonymous",
        message: feedbackText.value.trim(), // Use message not feedback_text
        reply_to: feedbackEmail.value.trim(),
      };

      console.log("Sending email with:", templateParams);

      // Use direct hardcoded values for troubleshooting
      const response = await emailjs.send(
        "service_nmu9der", // Your service ID
        "template_9526hmt", // Your template ID
        templateParams
      );

      console.log("Email sent successfully:", response);

      // Also save feedback to the server
      await fetch("/api/save-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: feedbackName.value.trim(),
          email: feedbackEmail.value.trim() || "Not provided",
          feedback: feedbackText.value.trim(),
        }),
      });

      // Show success message
      sendingIndicator.style.display = "none";
      sendSuccess.style.display = "block";
      sendSuccess.style.color = "#4caf50";
      sendSuccess.textContent =
        "Thank you! Your feedback has been sent successfully.";

      // Reset form after 3 seconds and close
      setTimeout(() => {
        feedbackForm.reset();
        feedbackModal.style.display = "none";
      }, 3000);
    } catch (error) {
      console.error("EmailJS detailed error:", error);
      // Display a more helpful error message
      sendingIndicator.style.display = "none";
      sendSuccess.style.display = "block";
      sendSuccess.textContent =
        "Your feedback has been saved but email delivery failed. We'll review it anyway!";
      sendSuccess.style.color = "#ff9800";

      // Still save the feedback to server
      try {
        await fetch("/api/save-feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: feedbackName.value.trim(),
            email: feedbackEmail.value.trim() || "Not provided",
            feedback: feedbackText.value.trim(),
          }),
        });

        // Reset form after 3 seconds and close
        setTimeout(() => {
          feedbackForm.reset();
          feedbackModal.style.display = "none";
        }, 3000);
      } catch (saveError) {
        console.error("Error saving feedback:", saveError);
        alert(
          "An error occurred while saving your feedback. Please try again."
        );
        sendingIndicator.style.display = "none";
      }
    }
  });

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

        // Calculate new interval in milliseconds
        const newInterval = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
        console.log(`Sending new interval request: ${newInterval / 1000}s`);

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
          // Update local interval
          imageRotationInterval = newInterval;
          console.log(
            `Server confirmed new interval: ${imageRotationInterval / 1000}s`
          );

          // Update timer WITHOUT immediate image rotation
          startRotationTimer();

          // Close modal
          authModal.style.display = "none";

          alert(
            `Image rotation timer updated to ${hours}h ${minutes}m ${seconds}s. Next rotation will occur in ${hours}h ${minutes}m ${seconds}s.`
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

  // Replace the initial fetchCounters call with our initialize function
  initialize();

  // Update display every second with fresh data from server
  setInterval(fetchCounters, 1000);

  // Add window resize listener to update layout when orientation changes
  window.addEventListener("resize", updateDisplay);
});
