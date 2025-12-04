// redirect,js
document.addEventListener('DOMContentLoaded', () => {
    
    // Delay before redirect (in milliseconds)
    const redirectDelay = 2000; // basically 2 seconds
    const isLocal = window.location.hostname == "localhost" || window.location.hostname === "127.0.0.1";

    // GitHub Pages project base path is your repo name
    const redirectURL = isLocal ? "/login/" : "/UMBC-VISA-DASHBOARD/frontend/login/";

    console.log(`Redirecting to ${redirectURL} in ${redirectDelay / 1000}s`);

    setTimeout(() => {
        window.location.href = redirectURL;
    }, redirectDelay);
});