document.addEventListener('DOMContentLoaded', () => {
    // Initialize counters with 0
    const bbCounter = new Counter(0);
    const gotCounter = new Counter(0);

    // Get DOM elements
    const bbPoints = document.getElementById('bbPoints');
    const gotPoints = document.getElementById('gotPoints');
    const bbPPS = document.getElementById('bbPPS');
    const gotPPS = document.getElementById('gotPPS');
    const bbPersonal = document.getElementById('bbPersonal');
    const gotPersonal = document.getElementById('gotPersonal');
    const bbBackground = document.querySelector('.bb-background');
    const gotBackground = document.querySelector('.got-background');

    // Tracking clicks per second
    let bbClicks = 0;
    let gotClicks = 0;
    let lastUpdate = Date.now();

    function createFloatingPoint(x, y) {
        const point = document.createElement('div');
        point.className = 'floating-point';
        point.textContent = '+1';
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        document.body.appendChild(point);
        setTimeout(() => point.remove(), 1000);
    }

    // Add click handlers
    document.getElementById('bbBtn').addEventListener('click', (e) => {
        bbCounter.increment();
        bbClicks++;
        createFloatingPoint(e.clientX, e.clientY);
        updateDisplay();
        saveScores();
    });

    document.getElementById('gotBtn').addEventListener('click', (e) => {
        gotCounter.increment();
        gotClicks++;
        createFloatingPoint(e.clientX, e.clientY);
        updateDisplay();
        saveScores();
    });

    function updateBackgroundWidths() {
        const totalSpeed = bbCounter.incrementPerSecond + gotCounter.incrementPerSecond;
        if (totalSpeed === 0) {
            bbBackground.style.clipPath = 'inset(0 50% 0 0)';
            gotBackground.style.clipPath = 'inset(0 0 0 50%)';
            return;
        }

        const bbPercentage = (bbCounter.incrementPerSecond / totalSpeed) * 100;
        const gotPercentage = 100 - bbPercentage;

        // Ensure minimum width of 25%
        const bbWidth = Math.max(25, bbPercentage);
        const gotWidth = Math.max(25, gotPercentage);

        bbBackground.style.clipPath = `inset(0 ${100 - bbWidth}% 0 0)`;
        gotBackground.style.clipPath = `inset(0 0 0 ${bbWidth}%)`;
    }

    function calculateSpeed() {
        const now = Date.now();
        const timeDiff = (now - lastUpdate) / 1000; // Convert to seconds

        // Calculate clicks per second
        bbCounter.incrementPerSecond = Math.round(bbClicks / timeDiff);
        gotCounter.incrementPerSecond = Math.round(gotClicks / timeDiff);

        // Reset click counters
        bbClicks = 0;
        gotClicks = 0;
        lastUpdate = now;
    }

    function updateDisplay() {
        bbPoints.textContent = bbCounter.formatNumber(bbCounter.value);
        gotPoints.textContent = gotCounter.formatNumber(gotCounter.value);
        bbPPS.textContent = `${bbCounter.formatNumber(bbCounter.incrementPerSecond)} points per second`;
        gotPPS.textContent = `${gotCounter.formatNumber(gotCounter.incrementPerSecond)} points per second`;
        bbPersonal.textContent = bbCounter.formatNumber(bbCounter.personalScore);
        gotPersonal.textContent = gotCounter.formatNumber(gotCounter.personalScore);
        updateBackgroundWidths();
    }

    function saveScores() {
        localStorage.setItem('bbPersonal', bbCounter.personalScore);
        localStorage.setItem('gotPersonal', gotCounter.personalScore);
    }

    // Update speed and display every 100ms
    setInterval(() => {
        calculateSpeed();
        updateDisplay();
    }, 100);

    // Initial display update
    updateDisplay();
});