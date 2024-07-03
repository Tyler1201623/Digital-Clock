let is24HourFormat = true;

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    const day = now.getDate();
    const month = now.getMonth() + 1; // Months are zero-indexed
    const year = now.getFullYear();
    const amPm = hours >= 12 ? ' PM' : ' AM';

    if (!is24HourFormat) {
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
    updateBackgroundColor(now.getHours());
}

function toggleFormat() {
    is24HourFormat = !is24HourFormat;
    document.getElementById("toggleFormat").textContent = is24HourFormat ? 'Switch to 12-hour format' : 'Switch to 24-hour format';
}

function getDayOfWeek(date) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysOfWeek[date.getDay()];
}

function updateBackgroundColor(hours) {
    let color;
    if (hours < 6) {
        color = "#292c33"; // Night
    } else if (hours < 12) {
        color = "#292c33"; // Morning
    } else if (hours < 18) {
        color = "#292c33"; // Afternoon
    } else {
        color = "#292c33"; // Evening
    }
    document.body.style.transition = "background-color 1s";
    document.body.style.backgroundColor = color;
}

function formatNumber(number) {
    return number < 10 ? '0' + number : number;
}

document.getElementById("toggleFormat").addEventListener('click', toggleFormat);

setInterval(updateClock, 1000);
updateClock();
