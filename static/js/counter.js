class Counter {
    constructor(name) {
        this.name = name;
        this.value = parseInt(localStorage.getItem(`${name}_total`) || '0');
        this.incrementPerSecond = 0;
        this.personalScore = parseInt(localStorage.getItem(`${name}_personal`) || '0');
        this.clickTimes = [];
    }

    increment() {
        this.value++;
        this.personalScore++;
        this.clickTimes.push(Date.now());
        // Only keep clicks from the last second
        const now = Date.now();
        this.clickTimes = this.clickTimes.filter(time => now - time <= 1000);
        localStorage.setItem(`${this.name}_total`, this.value);
        localStorage.setItem(`${this.name}_personal`, this.personalScore);
    }

    calculateSpeed() {
        const now = Date.now();
        // Count clicks in the last second
        this.clickTimes = this.clickTimes.filter(time => now - time <= 1000);
        this.incrementPerSecond = this.clickTimes.length;
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(Math.floor(num));
    }
}