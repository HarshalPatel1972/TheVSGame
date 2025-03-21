class Counter {
  constructor(name) {
    this.name = name;
    this.value = 0;
    this.incrementPerSecond = 0;

    // Only personal score from localStorage
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

  // Update from API data without resetting scores
  updateFromApiData(data) {
    if (data && data[this.name]) {
      this.value = data[this.name].total;
      this.incrementPerSecond = data[this.name].per_second;
    }
  }

  formatNumber(num) {
    return new Intl.NumberFormat().format(Math.floor(num));
  }
}
