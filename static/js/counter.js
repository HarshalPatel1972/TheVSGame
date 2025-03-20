class Counter {
  constructor(name) {
    this.name = name;
    this.value = 0;
    this.incrementPerSecond = 0;

    // Get server start time from localStorage or default to 0
    this.lastServerStartTime = parseInt(
      localStorage.getItem("server_start_time") || "0"
    );

    // Only personal score remains in localStorage
    this.personalScore = parseInt(
      localStorage.getItem(`${name}_personal`) || "0"
    );
  }

  async increment() {
    try {
      const response = await fetch(`/api/increment/${this.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.value = data.total;

        // Update personal score in localStorage
        this.personalScore++;
        localStorage.setItem(`${this.name}_personal`, this.personalScore);

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

  // This method checks if server has been reset and updates from API data
  updateFromApiData(data) {
    if (data) {
      // Check if server has been reset (new server_start_time)
      if (
        data.server_start_time &&
        data.server_start_time > this.lastServerStartTime
      ) {
        console.log("Server has been reset. Clearing personal scores.");
        this.resetPersonalScore();

        // Update stored server time
        this.lastServerStartTime = data.server_start_time;
        localStorage.setItem("server_start_time", data.server_start_time);
      }

      if (data[this.name]) {
        this.value = data[this.name].total;
        this.incrementPerSecond = data[this.name].per_second;
      }
    }
  }

  // Reset personal score when server has been reset
  resetPersonalScore() {
    this.personalScore = 0;
    localStorage.setItem(`${this.name}_personal`, "0");
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(Math.floor(num));
  }
}
