// redirect,js
document.addEventListener('DOMContentLoaded', () => {
    
    // Delay before redirect (in milliseconds)
    const redirectDelay = 2000; // basically 2 seconds

    // Destination (relative to root)
    const redirectURL = './DashBoardProject/';

    console.log('Redirecting to ${redirectURL} in ${redirectDelay / 1000}s');

    setTimeout(() => {
        window.location.href = redirectURL;
    }, redirectDelay);
});