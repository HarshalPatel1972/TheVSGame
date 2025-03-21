class Counter {
  constructor(name) {
    this.name = name;
    this.value = 0;
    this.incrementPerSecond = 0;
    this.lastKnownResetTime = parseInt(
      localStorage.getItem("last_reset_time") || "0"
    );

    // Personal score from localStorage
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

  // Update from API data with reset detection
  updateFromApiData(data) {
    if (data) {
      // Check if a reset has occurred
      if (
        data.last_reset_time &&
        data.last_reset_time > this.lastKnownResetTime
      ) {
        console.log("Global reset detected, updating local state");
        this.personalScore = 0;
        localStorage.setItem(`${this.name}_personal`, "0");
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
