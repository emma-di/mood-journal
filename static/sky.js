const cloudContainer = document.getElementById("cloud-container");

function createCloud(initial = false) {
    const cloud = document.createElement("img");
    cloud.src = "/static/assets/cloud.png";
    cloud.classList.add("cloud-img");

    // Random vertical position (top half: 5% to 35%)
    cloud.style.top = `${Math.random() * 30 + 5}%`;

    // Random size
    const scale = Math.random() * 0.5 + 0.75;
    cloud.style.transform = `scale(${scale})`;

    // Random animation duration (30–50s)
    const duration = Math.random() * 20 + 45;
    cloud.style.animationDuration = `${duration}s`;

    if (initial) {
        // Place cloud somewhere randomly across the screen (already floating)
        const startLeft = Math.random() * window.innerWidth;
        cloud.style.left = `${startLeft}px`;
    }

    cloudContainer.appendChild(cloud);

    // Remove cloud after it finishes drifting
    setTimeout(() => {
        cloud.remove();
    }, duration * 1000);
}

// 🌤️ Generate some clouds on screen immediately
for (let i = 0; i < 8; i++) {
    createCloud(true);  // pass "true" to start them across the screen
}

// 🌀 Continue adding new clouds from the left
let cloudLoopRunning = true;
let cloudLoopScheduled = false;

function startCloudLoop() {
    if (!cloudLoopRunning || cloudLoopScheduled) return;

    cloudLoopScheduled = true;
    const nextDelay = Math.random() * 2000 + 4000;

    setTimeout(() => {
        cloudLoopScheduled = false;
        if (cloudLoopRunning) {
            createCloud(false);
            startCloudLoop();
        }
    }, nextDelay);
}


document.addEventListener("visibilitychange", () => {
    const visible = document.visibilityState === "visible";
    document.body.classList.toggle("paused", !visible);
    cloudLoopRunning = visible;

    if (visible && !cloudLoopScheduled) {
        startCloudLoop();
    }
});

document.addEventListener("click", (e) => {
    // Skip clicks on buttons or inputs
    if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;

    for (let i = 0; i < 5; i++) {
        const petal = document.createElement("img");
        petal.src = "/static/assets/petal.png"; // make sure this path is right
        petal.classList.add("petal");

        // Randomize slight offset from click
        const offsetX = (Math.random() - 0.5) * 40;
        const offsetY = (Math.random() - 0.5) * 20;

        petal.style.left = `${e.clientX}px`;
        petal.style.top = `${e.clientY}px`;

        // Set custom CSS vars for flutter direction and rotation
        const dx = (Math.random() - 0.5) * 100; // x drift
        const dy = (Math.random() - 0.5) * 100;  // y drift
        const rot = (Math.random() - 0.5) * 360;

        petal.style.setProperty('--x', `${dx}px`);
        petal.style.setProperty('--y', `${dy}px`);
        petal.style.setProperty('--r', `${rot}deg`);


        document.body.appendChild(petal);

        setTimeout(() => {
            petal.remove();
        }, 1500); // match animation duration
    }
});

startCloudLoop();