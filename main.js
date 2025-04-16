// Global variables
let is24HourFormat = true;
let isDarkMode = true;
let currentTimezone = 'local';
let activeTab = 'clock';
let alarms = [];
let stopwatchInterval = null;
let stopwatchTime = 0;
let stopwatchRunning = false;
let timerInterval = null;
let timerTime = 0;
let timerRunning = false;
let alarmsound = document.getElementById('alarmSound');
let tickSound = document.getElementById('tickSound');

// Initialize the app
function init() {
    updateClock();
    setInterval(updateClock, 1000);
    setupEventListeners();
    showTab('clock');
}

// Set up all event listeners
function setupEventListeners() {
    // Format toggle
    document.getElementById("toggleFormat").addEventListener('click', toggleFormat);
    
    // Theme toggle
    document.getElementById("toggleTheme").addEventListener('click', toggleTheme);
    
    // Timezone select
    document.getElementById("timezoneSelect").addEventListener('change', (e) => {
        currentTimezone = e.target.value;
        updateClock();
    });
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab);
        });
    });
    
    // Stopwatch controls
    document.getElementById("startStopwatch").addEventListener('click', startStopwatch);
    document.getElementById("pauseStopwatch").addEventListener('click', pauseStopwatch);
    document.getElementById("resetStopwatch").addEventListener('click', resetStopwatch);
    document.getElementById("lapStopwatch").addEventListener('click', lapStopwatch);
    
    // Timer controls
    document.getElementById("startTimer").addEventListener('click', startTimer);
    document.getElementById("pauseTimer").addEventListener('click', pauseTimer);
    document.getElementById("resetTimer").addEventListener('click', resetTimer);
    
    // Alarm controls
    document.getElementById("setAlarm").addEventListener('click', setAlarm);
}

// Clock functions
function updateClock() {
    const now = getCurrentTime();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    const day = now.getDate();
    const month = now.getMonth() + 1; // Months are zero-indexed
    const year = now.getFullYear();
    let amPm = '';

    if (!is24HourFormat) {
        amPm = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // The hour '0' should be '12'
    }

    hours = formatNumber(hours);
    minutes = formatNumber(minutes);
    seconds = formatNumber(seconds);
    const formattedDay = formatNumber(day);
    const formattedMonth = formatNumber(month);

    document.getElementById("clockDisplay").textContent = `${hours}:${minutes}:${seconds}${amPm}`;
    document.getElementById("dateDisplay").textContent = `${getDayOfWeek(now)}, ${formattedMonth}/${formattedDay}/${year}`;
    document.getElementById("timezoneDisplay").textContent = getTimezoneDisplay();
    
    // Check alarms
    checkAlarms(now);
}

function getCurrentTime() {
    const now = new Date();
    
    if (currentTimezone === 'local') {
        return now;
    }
    
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Apply timezone offset
    switch (currentTimezone) {
        case 'UTC':
            return new Date(utc);
        case 'EST':
            return new Date(utc + (3600000 * -5));
        case 'CST':
            return new Date(utc + (3600000 * -6));
        case 'PST':
            return new Date(utc + (3600000 * -8));
        case 'JST':
            return new Date(utc + (3600000 * 9));
        case 'GMT':
            return new Date(utc);
        default:
            return now;
    }
}

function getTimezoneDisplay() {
    if (currentTimezone === 'local') {
        return `Local Time (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
    }
    return currentTimezone;
}

function toggleFormat() {
    is24HourFormat = !is24HourFormat;
    document.getElementById("toggleFormat").innerHTML = is24HourFormat ? 
        '<i class="fas fa-clock"></i> <span>Switch to 12-hour format</span>' : 
        '<i class="fas fa-clock"></i> <span>Switch to 24-hour format</span>';
    updateClock();
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.body.classList.remove('light-theme');
        document.getElementById("toggleTheme").innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
    } else {
        document.body.classList.add('light-theme');
        document.getElementById("toggleTheme").innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
    }
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activate the button
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    
    activeTab = tabName;
}

// Stopwatch functions
function updateStopwatchDisplay() {
    const milliseconds = stopwatchTime % 1000;
    const seconds = Math.floor((stopwatchTime / 1000) % 60);
    const minutes = Math.floor((stopwatchTime / (1000 * 60)) % 60);
    const hours = Math.floor((stopwatchTime / (1000 * 60 * 60)) % 24);
    
    document.getElementById("stopwatch").textContent = 
        `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}.${formatMilliseconds(milliseconds)}`;
}

function startStopwatch() {
    if (!stopwatchRunning) {
        const startTime = Date.now() - stopwatchTime;
        stopwatchInterval = setInterval(() => {
            stopwatchTime = Date.now() - startTime;
            updateStopwatchDisplay();
        }, 10);
        
        stopwatchRunning = true;
        document.getElementById("startStopwatch").disabled = true;
        document.getElementById("pauseStopwatch").disabled = false;
    }
}

function pauseStopwatch() {
    if (stopwatchRunning) {
        clearInterval(stopwatchInterval);
        stopwatchRunning = false;
        document.getElementById("startStopwatch").disabled = false;
        document.getElementById("pauseStopwatch").disabled = true;
    }
}

function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    stopwatchRunning = false;
    updateStopwatchDisplay();
    document.getElementById("startStopwatch").disabled = false;
    document.getElementById("pauseStopwatch").disabled = true;
    document.getElementById("laps").innerHTML = '';
}

function lapStopwatch() {
    if (stopwatchRunning || stopwatchTime > 0) {
        const laps = document.getElementById("laps");
        const lapItem = document.createElement("div");
        lapItem.className = "lap-item";
        
        const lapNumber = laps.children.length + 1;
        const lapTime = document.getElementById("stopwatch").textContent;
        
        lapItem.innerHTML = `<span>Lap ${lapNumber}</span><span>${lapTime}</span>`;
        laps.prepend(lapItem);
    }
}

// Timer functions
function updateTimerDisplay() {
    const seconds = Math.floor((timerTime / 1000) % 60);
    const minutes = Math.floor((timerTime / (1000 * 60)) % 60);
    const hours = Math.floor((timerTime / (1000 * 60 * 60)) % 24);
    
    document.getElementById("timerDisplay").textContent = 
        `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
}

function startTimer() {
    if (!timerRunning) {
        if (timerTime === 0) {
            // Get time from inputs
            const hours = parseInt(document.getElementById("hours").value) || 0;
            const minutes = parseInt(document.getElementById("minutes").value) || 0;
            const seconds = parseInt(document.getElementById("seconds").value) || 0;
            
            if (hours === 0 && minutes === 0 && seconds === 0) {
                alert("Please set a time first!");
                return;
            }
            
            timerTime = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000);
            updateTimerDisplay();
        }
        
        const startTime = Date.now();
        const initialTime = timerTime;
        
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            timerTime = initialTime - elapsed;
            
            if (timerTime <= 0) {
                timerTime = 0;
                clearInterval(timerInterval);
                timerRunning = false;
                timerComplete();
                document.getElementById("startTimer").disabled = false;
                document.getElementById("pauseTimer").disabled = true;
            }
            
            updateTimerDisplay();
        }, 10);
        
        timerRunning = true;
        document.getElementById("startTimer").disabled = true;
        document.getElementById("pauseTimer").disabled = false;
    }
}

function pauseTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById("startTimer").disabled = false;
        document.getElementById("pauseTimer").disabled = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerTime = 0;
    timerRunning = false;
    updateTimerDisplay();
    document.getElementById("startTimer").disabled = false;
    document.getElementById("pauseTimer").disabled = true;
    
    // Reset inputs
    document.getElementById("hours").value = 0;
    document.getElementById("minutes").value = 0;
    document.getElementById("seconds").value = 0;
}

function timerComplete() {
    playAlarmSound();
    alert("Timer complete!");
}

// Alarm functions
function setAlarm() {
    const alarmTime = document.getElementById("alarmTime").value;
    
    if (!alarmTime) {
        alert("Please set a time for the alarm!");
        return;
    }
    
    const [hours, minutes] = alarmTime.split(':');
    const now = new Date();
    
    const alarm = {
        id: Date.now(),
        hours: parseInt(hours),
        minutes: parseInt(minutes),
        active: true,
        label: `Alarm for ${formatNumber(parseInt(hours))}:${formatNumber(parseInt(minutes))}`
    };
    
    alarms.push(alarm);
    renderAlarms();
}

function renderAlarms() {
    const activeAlarms = document.getElementById("activeAlarms");
    activeAlarms.innerHTML = '';
    
    alarms.forEach(alarm => {
        const alarmItem = document.createElement("div");
        alarmItem.className = "alarm-item";
        alarmItem.innerHTML = `
            <div>${alarm.label}</div>
            <button class="delete-alarm" data-id="${alarm.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        activeAlarms.appendChild(alarmItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-alarm').forEach(button => {
        button.addEventListener('click', (e) => {
            const alarmId = parseInt(e.currentTarget.dataset.id);
            alarms = alarms.filter(alarm => alarm.id !== alarmId);
            renderAlarms();
        });
    });
}

function checkAlarms(now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    alarms.forEach(alarm => {
        if (alarm.hours === hours && alarm.minutes === minutes && seconds === 0 && alarm.active) {
            alarm.active = false; // Prevent multiple triggers
            triggerAlarm(alarm);
        }
    });
}

function triggerAlarm(alarm) {
    playAlarmSound();
    alert(`Alarm: ${alarm.label}`);
    
    // Remove the alarm after triggering
    alarms = alarms.filter(a => a.id !== alarm.id);
    renderAlarms();
}

function playAlarmSound() {
    alarmsound.currentTime = 0;
    alarmsound.play();
}

function playTickSound() {
    tickSound.currentTime = 0;
    tickSound.play();
}

// Helper functions
function getDayOfWeek(date) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysOfWeek[date.getDay()];
}

function formatNumber(number) {
    return number < 10 ? '0' + number : number;
}

function formatMilliseconds(milliseconds) {
    return Math.floor(milliseconds / 10).toString().padStart(2, '0');
}

// Initialize the app
window.addEventListener('DOMContentLoaded', init);
