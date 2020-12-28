browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    window.localStorage.setItem("active", false);
});
