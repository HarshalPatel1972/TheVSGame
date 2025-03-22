class Counter {
  constructor(name) {
    this.name = name;
    this.value = 0;
    this.incrementPerSecond = 0;
    this.personalScore = 0;
    this.deviceId = this.getOrCreateDeviceId();
    this.lastKnownResetTime = parseInt(
      localStorage.getItem("last_reset_time") || "0"
    );
  }

  // Generate or retrieve a unique device ID
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      // Generate a new device ID using a UUID
      deviceId =
        "device_" +
        ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
          ).toString(16)
        );
      localStorage.setItem("device_id", deviceId);
      console.log("Created new device ID:", deviceId);
    }
    return deviceId;
  }

  // Fetch personal scores from server
  async fetchPersonalScores() {
    try {
      const response = await fetch(`/api/personal-scores/${this.deviceId}`);
      if (response.ok) {
        const data = await response.json();

        // Check if a reset has occurred
        if (data.last_reset_time > this.lastKnownResetTime) {
          console.log("Server reset detected, updating local state");
          this.lastKnownResetTime = data.last_reset_time;
          localStorage.setItem("last_reset_time", data.last_reset_time);
        }

        // Update personal score
        if (data.scores && data.scores[this.name] !== undefined) {
          this.personalScore = data.scores[this.name];
        }

        return true;
      } else {
        console.error("Failed to fetch personal scores");
        return false;
      }
    } catch (error) {
      console.error("Error fetching personal scores:", error);
      return false;
    }
  }

  async increment() {
    try {
      const response = await fetch(`/api/increment/${this.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: this.deviceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update global counter
        this.value = data.total;

        // Update personal score if provided
        if (data.personal_score !== null) {
          this.personalScore = data.personal_score;
        }

        return true;
      } else {
        console.error("Failed to increment counter");
        return false;
      }
    } catch (error) {
      console.error("Error incrementing counter:", error);
      return false;
    }
  }

  // Update from API data with reset detection
  updateFromApiData(data) {
    if (data) {
      // Check if a reset has occurred
      if (
        data.last_reset_time &&
        data.last_reset_time > this.lastKnownResetTime
      ) {
        console.log("Global reset detected, updating local state");
        this.lastKnownResetTime = data.last_reset_time;
        localStorage.setItem("last_reset_time", data.last_reset_time);
      }

      if (data[this.name]) {
        this.value = data[this.name].total;
        this.incrementPerSecond = data[this.name].per_second;
      }
    }
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(Math.floor(num));
  }
}
