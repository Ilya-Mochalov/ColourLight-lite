document.addEventListener('DOMContentLoaded', () => {
    const lightBackground = document.getElementById('light-background');
    const uiContainer = document.getElementById('ui-container');
    const revealLayer = document.getElementById('reveal-layer');
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    
    // Wake Lock
    let wakeLock = null;

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock was released');
                });
                console.log('Screen Wake Lock is active');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    };

    // Attempt wake lock automatically and on visibility changes
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });

    // Touch any empty space in UI container masks hide
    uiContainer.addEventListener('click', (e) => {
        if (e.target === uiContainer) {
            hideUI();
        }
    });

    // Tap overlay to reveal UI
    revealLayer.addEventListener('click', () => {
        showUI();
    });

    function hideUI() {
        uiContainer.classList.add('hidden');
        revealLayer.classList.add('active');
        // Good time to request wake lock since user interact starts usage
        requestWakeLock();
    }

    function showUI() {
        uiContainer.classList.remove('hidden');
        revealLayer.classList.remove('active');
    }

    // Tabs functionality
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // Add active to selected
            btn.classList.add('active');
            const targetPanel = document.getElementById(`${btn.dataset.tab}-panel`);
            targetPanel.classList.add('active');
        });
    });

    // Initialize iro.js Color Picker
    // Width responds to small screens
    const pickerWidth = Math.min(window.innerWidth - 80, 280);
    const colorPicker = new iro.ColorPicker("#color-picker-container", {
        width: pickerWidth,
        color: "#ffffff",
        borderWidth: 2,
        borderColor: "#ffffff",
        layout: [
            { 
               component: iro.ui.Wheel,
            },
            { 
               component: iro.ui.Slider,
               options: {
                   sliderType: 'value' // brightness slider
               }
            }
        ]
    });

    colorPicker.on('color:change', function(color) {
        lightBackground.style.backgroundColor = color.hexString;
    });

    // Temperature functionality
    const tempSlider = document.getElementById('temp-slider');
    const tempValueDisplay = document.getElementById('temp-value');
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Simple algorithm to convert Kelvin to RGB
    function kelvinToRgb(kelvin) {
        let temp = kelvin / 100;
        let r, g, b;

        if (temp <= 66) {
            r = 255;
        } else {
            r = temp - 60;
            r = 329.698727446 * Math.pow(r, -0.1332047592);
            r = Math.max(0, Math.min(255, r));
        }

        if (temp <= 66) {
            g = temp;
            g = 99.4708025861 * Math.log(g) - 161.1195681661;
            g = Math.max(0, Math.min(255, g));
        } else {
            g = temp - 60;
            g = 288.1221695283 * Math.pow(g, -0.0755148492);
            g = Math.max(0, Math.min(255, g));
        }

        if (temp >= 66) {
            b = 255;
        } else if (temp <= 19) {
            b = 0;
        } else {
            b = temp - 10;
            b = 138.5177312231 * Math.log(b) - 305.0447927307;
            b = Math.max(0, Math.min(255, b));
        }

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }

    function updateTemperature(val) {
        tempValueDisplay.textContent = val;
        tempSlider.value = val;
        
        const rgb = kelvinToRgb(val);
        lightBackground.style.backgroundColor = rgb;
        // Also update iro picker color so it matches when switching tabs
        colorPicker.color.rgbString = rgb;
    }

    tempSlider.addEventListener('input', (e) => {
        updateTemperature(e.target.value);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.temp;
            updateTemperature(val);
        });
    });

    // Request wake lock initially if possible
    requestWakeLock();
});
