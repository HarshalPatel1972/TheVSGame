class Counter {
    constructor(initialValue = 0) {
        this.value = initialValue;
        this.incrementPerSecond = 0;
        this.personalScore = 0;
    }

    increment() {
        this.value++;
        this.personalScore++;
    }

    addPointsPerSecond(points) {
        this.incrementPerSecond += points;
    }

    update() {
        this.value += this.incrementPerSecond;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(Math.floor(num));
    }
}
