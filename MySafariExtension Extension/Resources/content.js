

let selectedSpeed;
let scrollSpeed;
let scrollInterval;

let paragraphs = [];
let wordsArray = [];

let paraIndex = 0;
let wordIndex = 0;

let isReaderModeOn = false;
let isArticleFound = false;
let isMouseDown = false;


document.addEventListener('visibilitychange', function() {
    if (isReaderModeOn) { turnReaderModeOff(); }
});


browser.runtime.onMessage.addListener(message => {
    selectedSpeed = message.speed;
    isReaderModeOn = message.isActive;
    if (window.top === window) {
      toggleReaderMode();
    }
});


function toggleReaderMode() {
    if (isReaderModeOn) {
        setSpeed(selectedSpeed);
        turnReaderModeOn();
    } else {
        turnReaderModeOff();
    }
}


function turnReaderModeOff() {
    clearInterval(scrollInterval);
    document.getElementById("background").remove();
    isReaderModeOn = false;
    isArticleFound = false;
    wordsArray = [];
    paragraphs = [];
    browser.runtime.sendMessage({ isActive: false });
}


function setSpeed(wpm) {
    const minute = 60_000;
    const speed = Number(wpm);
    const perWord = minute / speed;
    scrollSpeed = Math.round(perWord / 5);
}


function turnReaderModeOn() {
    getArticleText(document.body);
    setBackground();
    scrollInterval = setInterval(beginScroll, scrollSpeed * 5);
    isReaderModeOn = true;
}


const idProperty = Object.freeze({
    id: "id",
    className: "className",
    itemProp: "itemprop"
})


function getArticleText(section) {

    let conditionsToCheck = [];
    let idMethod = "";

    switch (document.location.host) {
        case "news.yahoo.com":
            conditionsToCheck = ["caas-body"];
            idMethod = idProperty.className;
            break;
        case "www.npr.org":
            conditionsToCheck = ["storytext"];
            idMethod = idProperty.id;
            break;
        case "www.nbcnews.com":
            conditionsToCheck = ["article-body__content"];
            idMethod = idProperty.className;
            break;
        case "quillette.com":
            conditionsToCheck = ["entry-content"];
            idMethod = idProperty.className;
            break;
        case "www.foxnews.com":
            conditionsToCheck = ["article-body"];
            idMethod = idProperty.className;
            break;
        case "www.huffpost.com":
            conditionsToCheck = ["entry-text"];
            idMethod = idProperty.id;
            break;
        case "www.cnn.com":
            conditionsToCheck = ["l-container"];
            idMethod = idProperty.className;
            break;
        case "www.dailymail.co.uk":
            conditionsToCheck = ["articleBody"];
            idMethod = idProperty.itemProp;
            break;
        default:
            break;
    }
    getArticle(section, conditionsToCheck, idMethod);
}


function getArticle(section, conditions, idMethod) {

    for (let i = 0; i < section.childNodes.length; i++) {

        let label = "";
        console.log("NODENAME - ", section.nodeName);
        switch (idMethod) {
            case idProperty.id:
                label = section.childNodes[i].id;
                break;
            case idProperty.className:
                label = section.childNodes[i].className;
                break;
            case idProperty.itemProp:
                if (section.hasAttribute("itemprop")) {
                    label = section.getAttribute("itemprop");
                } 
                break;
        }

        for (let j = 0; j < conditions.length; j++) {

            if (conditions[j] === label) {
                isArticleFound = true;
                console.log("*****", section.childNodes);
                if (document.location.host == "www.dailymail.co.uk") {
                    for (let k = 0; k < section.childNodes.length; k++) {
                        findParagraphs(section.childNodes[k]);
                    }
                } else {
                    for (let k = 0; k < section.childNodes[i].childNodes.length; k++) {
                        findParagraphs(section.childNodes[i].childNodes[k]);
                    }
                }
            }
        }

        if (section.childNodes[i].childNodes.length > 0) {
            getArticle(section.childNodes[i], conditions, idMethod);
            if (isArticleFound) { break; }
        }
    }
}

function findParagraphs(element) {
    if (document.location.host == "www.cnn.com") {
        if (element.className == "zn-body__paragraph") {
            extractText(element);
        }
    } 
    else if (element.nodeName == "P") {
        extractText(element);
    } 

    if ((element.childNodes.length > 0) && 
        ((document.location.host == "www.huffpost.com") ||
         (document.location.host == "www.cnn.com") || 
         (document.location.host == "www.dailymail.co.uk"))) {
        for (let i = 0; i < element.childNodes.length; i++) {
            findParagraphs(element.childNodes[i]);
        }
    }
}


function extractText(element) {
    let text = element.innerText;
        let array = [];
        let word = "";
        for (let l = 0; l < text.length; l++) {
            if ((text[l] == " ") || (text[l] == "\n") || (text[l] == ".")) {
                if (word.length > 0) { 
                    array.push(word);
                    word = "";
                }
            } else {
                word += text[l];
            }
        }
        paragraphs.push({
            wordArray: array,
            yPosition: element.offsetTop 
        });
}

function setBackground() {
    const backgroundDiv = document.createElement('h1');
    backgroundDiv.id = "background";
    backgroundDiv.onmousedown = function() {
        isMouseDown = true;
    };
    backgroundDiv.onmouseup = function() {
        isMouseDown = false;
    };
    document.body.appendChild(backgroundDiv);
}


function beginScroll() {

     if (!isMouseDown) { return; }

     if (paragraphs.length == 0) {
        document.getElementById("background").innerText = "Unable to detect article text";
        return;
     }

     if (wordIndex >= paragraphs[paraIndex].wordArray.length) { 
         paraIndex += 1;
         wordIndex = 0;
         scrollTo({
             top: paragraphs[paraIndex].yPosition,
             left: 0, 
             behavior: 'smooth' 
             });
     }

     if (paraIndex >= paragraphs.length) { return; }
     
     if (paragraphs[paraIndex].wordArray[wordIndex].length < 5) {
         document.getElementById("background").innerText =  paragraphs[paraIndex].wordArray[wordIndex] + " " + paragraphs[paraIndex].wordArray[wordIndex + 1];
         wordIndex += 1;
     } else {
         document.getElementById("background").innerText =  paragraphs[paraIndex].wordArray[wordIndex];
     }
     wordIndex += 1;
}
