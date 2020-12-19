
let selectedSpeed;
let readingSpeed;
let intervalId;
let readerModeOn = false;
let articleFound = false;
let wordsArray = [];
let paragraphs = [];
let paraIndex = 0;
let wordIndex = 0;
let mouseDown = false;


browser.runtime.onMessage.addListener(message => {
      selectedSpeed = message.speed;
      readerModeOn = message.isActive;
    if (window.top === window) {
      toggleReaderMode();
    }
});


function toggleReaderMode() {
    if (readerModeOn) {
        setSpeed(selectedSpeed);
        turnReaderModeOn();
    } else {
        turnReaderModeOff();
    }
}


function turnReaderModeOff() {
    clearInterval(intervalId);
    document.getElementById("background").remove();
    readerModeOn = false;
    articleFound = false;
    wordsArray = [];
    paragraphs = [];
}


function setSpeed(wpm) {
    const minute = 60_000;
    const speed = Number(wpm);
    const perWord = minute / speed;
    readingSpeed = Math.round(perWord / 5);
}


function turnReaderModeOn() {
    getArticleText(document.body);
    setBackground();
    intervalId = setInterval(beginScroll, readingSpeed * 5);
    readerModeOn = true;
}


const name = Object.freeze({
    id: "id",
    className: "className"
})


function getArticleText(section) {

    let conditionsToCheck = [];
    let idMethod = "";

    switch (document.location.host) {
        case "news.yahoo.com":
            conditionsToCheck = ["caas-body"];
            idMethod = name.className;
            break;
        case "www.npr.org":
            conditionsToCheck = ["storytext"];
            idMethod = name.id;
            break;
        case "www.nbcnews.com":
            conditionsToCheck = ["article-body__content"];
            idMethod = name.className;
            break;
        case "quillette.com":
            conditionsToCheck = ["entry-content"];
            idMethod = name.className;
        default:
            break;
    }
    getArticle(section, conditionsToCheck, idMethod);
}


function getArticle(section, conditions, idMethod) {
console.log("GET ARTICLE");
    for (let i = 0; i < section.childNodes.length; i++) {

        let label = "";

        switch (idMethod) {
            case name.id:
                label = section.childNodes[i].id;
            case name.className:
                label = section.childNodes[i].className;
        }

        for (let j = 0; j < conditions.length; j++) {

            if (conditions[j] === label) {
                articleFound = true;
                filterNonSense(section.childNodes[i]);
            }
        }

        if (section.childNodes[i].childNodes.length > 0) {
            getArticle(section.childNodes[i], conditions, idMethod);
            if (articleFound) { break; }
        }
    }
}


function filterNonSense(section) {
    console.log("FILTER NONSENSE");
    for (let i = 0; i < section.childNodes.length; i++) {

        if (section.childNodes[i].nodeName == "P") {

            let text = section.childNodes[i].innerText;

            let word = ""
            for (let j = 0; j < text.length; j++) {
                if ((text[j] == " ") || (text[j] == "\n") || (text[j] == ".")) {
                    if (word.length > 0) {
                        wordsArray.push(word);
                        word = "";
                    }
                } else {
                    word += text[j];
                }
            }
            console.log("PARA - ", wordsArray);
            paragraphs.push(wordsArray);
            wordsArray = [];
        }
    }
}


function setBackground() {
    const backgroundDiv = document.createElement('h1');
    backgroundDiv.id = "background";
    backgroundDiv.onmousedown = function() {
        mouseDown = true;
        console.log("MOUSE DOWN")
    };
    backgroundDiv.onmouseup = function() {
        mouseDown = false;
        console.log("MOUSE UP")
    };
    document.body.appendChild(backgroundDiv);
}


function beginScroll() {

     if (!mouseDown) { return; }
     
     if (wordIndex >= paragraphs[paraIndex].length) { 
         paraIndex += 1;
         wordIndex = 0;
     }

     if (paraIndex >= paragraphs.length) { return; }
     
     if (paragraphs[paraIndex][wordIndex].length < 5) {
         document.getElementById("background").innerText =  paragraphs[paraIndex][wordIndex] + " " + paragraphs[paraIndex][wordIndex + 1];
         wordIndex += 1;
     } else {
         document.getElementById("background").innerText =  paragraphs[paraIndex][wordIndex];
     }
     wordIndex += 1;
}
