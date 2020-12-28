
var isActive = false;
var readingSpeed;

window.onload = function() {
    restoreOptions();
    setButtonText();
    document.getElementById("startButton").addEventListener("click", buttonClicked, false);
    document.getElementById("settingsButton").addEventListener("click", openSettingsPage, false);
    document.getElementById("speedSlider").oninput = function() { changePreferedSpeed(); };
}


function restoreOptions() {
    var stateItem = window.localStorage.getItem("active");
    isActive = (stateItem == "true");
    readingSpeed = localStorage.getItem("speed");
    if (readingSpeed != null) {
        document.getElementById("wpmLabel").innerText = readingSpeed;
        document.getElementById("speedSlider").defaultValue = readingSpeed;
    } else {
        var defaultSpeed = document.getElementById("speedSlider").value;
        document.getElementById("wpmLabel").innerText = defaultSpeed;
        window.localStorage.setItem("speed", defaultSpeed);
        readingSpeed = defaultSpeed;
    }
}


function setButtonText() {
    if (isActive) {
        document.getElementById("startButton").innerText = "STOP";
    } else {
        document.getElementById("startButton").innerText = "START";
    }
}


function changePreferedSpeed() {
    readingSpeed = document.getElementById("speedSlider").value;
    document.getElementById("wpmLabel").innerText = readingSpeed;
    window.localStorage.setItem("speed", readingSpeed);
}
  

function buttonClicked() {
  
    isActive = !isActive;
    window.localStorage.setItem("active", isActive);

    let activeTabs = browser.tabs.query({ currentWindow: true, active: true });
    activeTabs.then((tabs) => {
    for (let tab of tabs) {
        browser.tabs.sendMessage(tab.id, {
            speed: readingSpeed,
            isActive: isActive
        });
        }
    });
  
    setButtonText();
}


function openSettingsPage() {
    browser.runtime.openOptionsPage();
}
