document.addEventListener("DOMContentLoaded", () => {
// DOM Elements
const unlockBtn = document.getElementById("unlockBtn");
const passwordInput = document.getElementById("passwordInput");
const passwordScreen = document.getElementById("passwordScreen");
const candleScreen = document.getElementById("candleScreen");
const mainSite = document.getElementById("mainSite");
const errorText = document.getElementById("error");
const bgMusic = document.getElementById("bgMusic");
const startJourney = document.getElementById("startJourney");
const giftButton = document.getElementById("giftButton");
const finalMessage = document.getElementById("finalMessage");
const counter = document.getElementById("daysCounter");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const closeLightbox = document.getElementById("closeLightbox");
const heroName = document.querySelector(".hero h2");
const birthdayCake = document.getElementById("birthdayCake");
const micStatus = document.getElementById("micStatus");
const micHint = document.getElementById("micHint");
const manualBlowBtn = document.getElementById("manualBlowBtn");
const smokeLayer = document.getElementById("smokeLayer");

// Config Answers
const acceptedAnswers = ["manchester city", "man city", "mcfc"];

let microphoneStream = null;
let audioContext = null;
let analyser = null;
let monitorFrame = null;
let candleExperienceStarted = false;
let candlesBlownOut = false;

// 1. Password Unlock -> Birthday Candle Moment
unlockBtn.addEventListener("click", () => {
const answer = passwordInput.value.toLowerCase().trim();

if (acceptedAnswers.includes(answer)) {
errorText.textContent = "";

// Prime the audio element during the password click so the browser has a
// user gesture associated with playback. It remains silent until the candles
// are actually blown out.
bgMusic.muted = true;
bgMusic.play().then(() => {
bgMusic.pause();
bgMusic.currentTime = 0;
}).catch(() => {});

passwordScreen.style.opacity = "0";
launchBackgroundHearts();

setTimeout(() => {
passwordScreen.style.display = "none";
candleScreen.style.display = "flex";
requestAnimationFrame(() => {
candleScreen.style.opacity = "1";
});
window.scrollTo(0, 0);
startCandleExperience();
}, 800);
} else {
errorText.textContent = "Oops! Try again. ";
}
});

// Support entering password via Enter key
passwordInput.addEventListener("keypress", (e) => {
if (e.key === "Enter") {
unlockBtn.click();
}
});

async function startCandleExperience() {
if (candleExperienceStarted) return;
candleExperienceStarted = true;

if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
showMicrophoneFallback("Your browser doesn't provide microphone access.");
return;
}

try {
micStatus.textContent = "🎤 Listening for your blow...";
micHint.textContent = "Take a breath, get close to your microphone, and blow gently but firmly.";

microphoneStream = await navigator.mediaDevices.getUserMedia({
 audio: {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false
 }
});

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
audioContext = new AudioContextClass();
await audioContext.resume();

const source = audioContext.createMediaStreamSource(microphoneStream);
analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.15;
source.connect(analyser);

monitorForBlow();
} catch (error) {
console.log("Microphone access was not available:", error);
showMicrophoneFallback("Microphone access was blocked. You can still continue with the button below.");
}
}

function monitorForBlow() {
if (!analyser || candlesBlownOut) return;

const timeData = new Uint8Array(analyser.fftSize);
const frequencyData = new Uint8Array(analyser.frequencyBinCount);
let blowScore = 0;
let warmupFrames = 0;
let baseline = 0.02;

const detect = () => {
if (!analyser || candlesBlownOut) return;

analyser.getByteTimeDomainData(timeData);
let sum = 0;
for (let i = 0; i < timeData.length; i++) {
const normalized = (timeData[i] - 128) / 128;
sum += normalized * normalized;
}
const rms = Math.sqrt(sum / timeData.length);

analyser.getByteFrequencyData(frequencyData);
const nyquist = audioContext.sampleRate / 2;
let totalEnergy = 0;
let highEnergy = 0;
for (let i = 0; i < frequencyData.length; i++) {
const hz = (i / frequencyData.length) * nyquist;
const energy = frequencyData[i] / 255;
totalEnergy += energy;
if (hz >= 1200 && hz <= 9000) highEnergy += energy;
}
const highFrequencyRatio = totalEnergy ? highEnergy / totalEnergy : 0;

if (warmupFrames < 50) {
baseline = baseline * 0.95 + rms * 0.05;
warmupFrames++;
}

const dynamicThreshold = Math.max(0.055, baseline * 3.2 + 0.02);
const isBlow = rms > dynamicThreshold && highFrequencyRatio > 0.16;

if (isBlow || rms > 0.14) {
blowScore += 1;
} else {
blowScore = Math.max(0, blowScore - 0.45);
}

if (blowScore >= 7) {
blowOutCandles();
return;
}

monitorFrame = requestAnimationFrame(detect);
};

detect();
}

function showMicrophoneFallback(message) {
micStatus.textContent = "🎤 Microphone unavailable";
micHint.textContent = message;
manualBlowBtn.style.display = "inline-flex";
}

manualBlowBtn.addEventListener("click", () => {
blowOutCandles();
});

function blowOutCandles() {
if (candlesBlownOut) return;
candlesBlownOut = true;

if (monitorFrame) cancelAnimationFrame(monitorFrame);
if (microphoneStream) {
microphoneStream.getTracks().forEach(track => track.stop());
microphoneStream = null;
}
if (audioContext) {
audioContext.close().catch(() => {});
audioContext = null;
}

micStatus.textContent = "✨ Wish made! The candles are going out...";
micHint.textContent = "Happy Birthday, Essie 💝";
manualBlowBtn.style.display = "none";
birthdayCake.classList.add("blowing-out");

createSmokePuffs();

setTimeout(() => {
birthdayCake.src = "images/cake-off.png";
birthdayCake.alt = "Birthday cake with candles blown out";
birthdayCake.classList.add("candles-out");
}, 350);

setTimeout(() => {
transitionToMainSite();
}, 1500);
}

function createSmokePuffs() {
const puffs = 12;
for (let i = 0; i < puffs; i++) {
const puff = document.createElement("span");
puff.className = "smoke-puff";
puff.textContent = "·";
puff.style.left = `${22 + Math.random() * 56}%`;
puff.style.top = `${25 + Math.random() * 12}%`;
puff.style.animationDelay = `${Math.random() * 0.25}s`;
puff.style.animationDuration = `${1.1 + Math.random() * 0.8}s`;
smokeLayer.appendChild(puff);
setTimeout(() => puff.remove(), 2200);
}
}

function transitionToMainSite() {
candleScreen.style.opacity = "0";

setTimeout(() => {
candleScreen.style.display = "none";
mainSite.style.display = "block";
window.scrollTo(0, 0);

launchBackgroundHearts();
if (typeof initializeScrollAnimations === "function") {
initializeScrollAnimations();
}

// Music begins only after the candles have been blown out.
bgMusic.currentTime = 0;
bgMusic.muted = false;
bgMusic.volume = 1;
bgMusic.play().catch((err) => {
console.log("Audio playback is waiting for another user interaction:", err);
});
}, 800);
}

// 2. Journey Navigation Scroll
if (startJourney) {
startJourney.addEventListener("click", () => {
document.getElementById("story").scrollIntoView({
behavior: "smooth"
});
});
}

// 3. Days Calculation Engine System
const startDate = new Date("2025-02-19");
const today = new Date();
const difference = today - startDate;
const daysTogether = Math.floor(difference / (1000 * 60 * 60 * 24));

if (counter) {
counter.innerHTML = `We've been friends for ${daysTogether} days`;
}

// 4. Hero Name Easter Egg Click Handler
let clicks = 0;
if (heroName) {
heroName.addEventListener("click", () => {
clicks++;
if (clicks === 5) {
alert(" I will always be here for youu! ");
clicks = 0;
}
});
}

// 5. Letter Scroll Highlight System
const letterParagraphs = document.querySelectorAll(".letter-paragraph");
const letterObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add("show");
}
});
}, { threshold: 0.15 });

letterParagraphs.forEach((paragraph) => {
letterObserver.observe(paragraph);
});

// 6. Intersection Observer for Cards, Reasons, Images
function initializeScrollAnimations() {
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.style.opacity = "1";
entry.target.style.transform = "translateY(0)";
}
});
}, { threshold: 0.15 });

const animatedItems = document.querySelectorAll(".story-card, .reason, .dream-card");
animatedItems.forEach(item => {
item.style.opacity = "0";
item.style.transform = "translateY(50px)";
item.style.transition = "all 1s ease";
observer.observe(item);
});
}

// 7. Lightbox Controller Logic
const galleryImages = document.querySelectorAll(".gallery-grid img");
galleryImages.forEach((img) => {
img.addEventListener("click", () => {
lightbox.style.display = "flex";
lightboxImage.src = img.src;
});
});

closeLightbox.addEventListener("click", () => {
lightbox.style.display = "none";
});

lightbox.addEventListener("click", (e) => {
if (e.target === lightbox) {
lightbox.style.display = "none";
}
});

// 8. Background Drifting Hearts Stream
let heartsStarted = false;
function launchBackgroundHearts() {
if (heartsStarted) return;
heartsStarted = true;
const heartEmojis = ["❤️", "💖", "💝", "💕"];

setInterval(() => {
const heart = document.createElement("div");
heart.classList.add("heart");
heart.innerHTML = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
heart.style.left = Math.random() * 100 + "vw";
heart.style.fontSize = Math.random() * 15 + 15 + "px";

const duration = Math.random() * 6 + 6;
heart.style.animation = `floatHeart ${duration}s linear forwards`;

document.body.appendChild(heart);

setTimeout(() => {
heart.remove();
}, duration * 1000);
}, 500);
}

// 9. Surprise Reveal Blast
if (giftButton && finalMessage) {
giftButton.addEventListener("click", (e) => {
finalMessage.style.display = "block";
giftButton.style.display = "none";

const origX = e.clientX;
const origY = e.clientY;
massiveHeartExplosion(origX, origY);

setTimeout(() => {
finalMessage.scrollIntoView({ behavior: "smooth" });
}, 100);
});
}

function massiveHeartExplosion(x, y) {
const heartEmojis = ["❤️", "💖", "💝", "💕"];
const explosionCount = 100;

for (let i = 0; i < explosionCount; i++) {
const heart = document.createElement("div");
heart.classList.add("explosion-heart");
heart.innerHTML = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
heart.style.left = x + "px";
heart.style.top = y + "px";
heart.style.fontSize = Math.random() * 20 + 15 + "px";

const angle = Math.random() * Math.PI * 2;
const distance = Math.random() * 300 + 100;
const tx = Math.cos(angle) * distance;
const ty = Math.sin(angle) * distance;

heart.style.setProperty("--tx", `${tx}px`);
heart.style.setProperty("--ty", `${ty}px`);

const duration = Math.random() * 1.5 + 1;
heart.style.animationDuration = `${duration}s`;

document.body.appendChild(heart);

setTimeout(() => {
heart.remove();
}, duration * 1000);
}
}
});
