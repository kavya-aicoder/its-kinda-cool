// --- Global Variables & Constants ---
const appContainer = document.getElementById('app-container');
const scrapbookScreen = document.getElementById('scrapbook-screen');
const sparkleCanvas = document.getElementById('sparkle-canvas');
const ctx = sparkleCanvas.getContext('2d');

let isAudioPlaying = false;
let audioCtx = null;
let synthInterval = null;

// Resize Sparkle Canvas to match container
function resizeCanvas() {
    sparkleCanvas.width = appContainer.clientWidth;
    sparkleCanvas.height = appContainer.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 1. Sparkle Mouse/Touch Trail ---
let sparkles = [];
const colors = ['#FFD9E2', '#FFF7F3', '#D48B8B', '#fdd835', '#ffffff', '#e8f5e9'];

class Sparkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 2.2 - 1.1;
        this.speedY = Math.random() * 2 - 2.5; // Upward drift
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01; // Slower fade
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 6 - 3;
        this.gravity = 0.04;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity; // Gravity pull down slightly
        this.alpha -= this.decay;
        this.rotation += this.rotationSpeed;
        if (this.size > 0.1) this.size -= 0.08;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.alpha;
        
        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        ctx.fillStyle = this.color;
        
        // Draw four-pointed star
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.25, -this.size * 0.25);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(this.size * 0.25, this.size * 0.25);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.25, this.size * 0.25);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(-this.size * 0.25, -this.size * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function handlePointerMove(e) {
    const rect = sparkleCanvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Add sparkles
    for (let i = 0; i < 3; i++) {
        sparkles.push(new Sparkle(x, y));
    }
}

appContainer.addEventListener('mousemove', handlePointerMove);
appContainer.addEventListener('touchmove', handlePointerMove, { passive: true });

function animateSparkles() {
    ctx.clearRect(0, 0, sparkleCanvas.width, sparkleCanvas.height);
    for (let i = 0; i < sparkles.length; i++) {
        sparkles[i].update();
        sparkles[i].draw();
        
        if (sparkles[i].alpha <= 0) {
            sparkles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animateSparkles);
}
animateSparkles();

// --- 2. Floating Words System ---
const floatingPhrases = [
    'pyari boss 🐰',
    'soft but dangerous 🔥',
    'rajma chawal supremacy 🍛',
    'magnum girl 🍦',
    'pure seduction ✨',
    'somu best hai 💖',
    'leo & bruno\'s mummy 🐾',
    'sweet chaos 🌸'
];

function spawnFloatingWord() {
    if (document.getElementById('scrapbook-screen').classList.contains('hidden')) return;

    const wordEl = document.createElement('div');
    wordEl.className = 'handwritten-text';
    wordEl.style.position = 'absolute';
    wordEl.style.left = `${Math.random() * 55 + 20}%`; // Keep centered-ish
    
    const scrollPos = scrapbookScreen.scrollTop;
    const containerHeight = appContainer.clientHeight;
    wordEl.style.top = `${scrollPos + containerHeight - 50}px`;
    wordEl.innerText = floatingPhrases[Math.floor(Math.random() * floatingPhrases.length)];
    
    const pastelColors = ['#D48B8B', '#c27e7e', '#8ba0d4', '#7da98f', '#b08bd4'];
    
    wordEl.style.fontSize = `${Math.random() * 0.35 + 1.25}rem`;
    wordEl.style.opacity = '0';
    wordEl.style.transform = `rotate(${Math.random() * 16 - 8}deg)`;
    wordEl.style.transition = 'all 4.5s cubic-bezier(0.1, 0.8, 0.3, 1)';
    wordEl.style.pointerEvents = 'none';
    wordEl.style.zIndex = '99';
    wordEl.style.color = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    wordEl.style.textShadow = '2px 2px 4px rgba(255,255,255,0.9)';
    
    scrapbookScreen.querySelector('.scrapbook-content').appendChild(wordEl);
    
    setTimeout(() => {
        wordEl.style.opacity = '0.9';
        wordEl.style.transform = `translateY(-350px) rotate(${Math.random() * 30 - 15}deg)`;
    }, 80);
    
    setTimeout(() => {
        wordEl.remove();
    }, 4600);
}
setInterval(spawnFloatingWord, 4000);

// --- 3. Web Audio API Ambient Tape Lofi Synth ---
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tape Wobble Filter LFO
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 4.5; // Wobble frequency (Hz)
    lfoGain.gain.value = 6;    // Amount of detune wobble
    
    // Reverb / Delay setup
    const delay = audioCtx.createDelay(1.0);
    const feedback = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    delay.delayTime.value = 0.6; // Slightly longer echo
    feedback.gain.value = 0.45;   // Feedback
    filter.type = 'lowpass';
    filter.frequency.value = 750; // Extra cozy lowpass filter
    
    // Connect nodes
    delay.connect(feedback);
    feedback.connect(delay);
    
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.12; // Gentle sound level
    
    filter.connect(masterGain);
    delay.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    
    // Cozy ambient arpeggios
    const chords = [
        [130.81, 196.00, 246.94, 329.63, 392.00], // Cmaj9 (C3, G3, B3, E4, G4)
        [110.00, 164.81, 220.00, 261.63, 329.63], // Am9 (A2, E3, A3, C4, E4)
        [87.31, 130.81, 174.61, 220.00, 261.63],  // Fmaj7 (F2, C3, F3, A3, C4)
        [98.00, 146.83, 196.00, 246.94, 293.66]   // G6 (G2, D3, G3, B3, D4)
    ];
    
    let currentChordIndex = 0;
    let noteIndex = 0;
    
    function playNextNote() {
        if (!isAudioPlaying) return;
        
        const chord = chords[currentChordIndex];
        const noteFreq = chord[noteIndex];
        
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        
        // Hook up LFO to oscillator frequency for vinyl pitch tape drift!
        lfoGain.connect(osc.frequency);
        
        osc.type = 'sine';
        osc.frequency.value = noteFreq;
        
        const now = audioCtx.currentTime;
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.7, now + 0.15); // Slightly softer attack
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
        
        osc.connect(oscGain);
        oscGain.connect(filter);
        oscGain.connect(delay);
        
        osc.start(now);
        osc.stop(now + 2.9);
        
        // Progress notes
        noteIndex = (noteIndex + 1) % chord.length;
        if (noteIndex === 0) {
            currentChordIndex = (currentChordIndex + 1) % chords.length;
        }
        
        const randomTempo = Math.random() * 250 + 450;
        synthInterval = setTimeout(playNextNote, randomTempo);
    }
    
    lfo.connect(lfoGain);
    lfo.start();
    playNextNote();
}

function toggleAudio() {
    const musicBtn = document.getElementById('music-btn');
    if (!audioCtx) {
        initAudio();
        isAudioPlaying = true;
        musicBtn.classList.add('playing');
    } else {
        if (isAudioPlaying) {
            isAudioPlaying = false;
            musicBtn.classList.remove('playing');
            clearTimeout(synthInterval);
            audioCtx.suspend();
        } else {
            isAudioPlaying = true;
            musicBtn.classList.add('playing');
            audioCtx.resume();
            initAudio(); // Restart loop
        }
    }
}

// --- 4. Typing Animation ---
const typingPhrases = [
    'someone very special was born on 24 may...',
    'she has a soft heart, a strong mind, and a touch of pretty chaos...',
    'welcome to...'
];

let currentPhraseIndex = 0;
let charIndex = 0;
const introTypingEl = document.getElementById('intro-typing');

function typePhrase() {
    if (currentPhraseIndex < typingPhrases.length) {
        const phrase = typingPhrases[currentPhraseIndex];
        if (charIndex < phrase.length) {
            introTypingEl.innerHTML += phrase.charAt(charIndex);
            charIndex++;
            setTimeout(typePhrase, 60);
        } else {
            setTimeout(() => {
                if (currentPhraseIndex < typingPhrases.length - 1) {
                    introTypingEl.innerHTML = '';
                    charIndex = 0;
                    currentPhraseIndex++;
                    setTimeout(typePhrase, 500);
                } else {
                    revealTitleAndButton();
                }
            }, 1600);
        }
    }
}

function revealTitleAndButton() {
    introTypingEl.style.display = 'none';
    const introTitle = document.getElementById('intro-title');
    const enterBtn = document.getElementById('enter-btn');
    
    generateStars();
    
    introTitle.classList.add('show');
    enterBtn.classList.add('show');
}

function generateStars() {
    const starryBg = document.querySelector('.starry-background');
    for (let i = 0; i < 45; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        const size = Math.random() * 2.8 + 1.2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${Math.random() * 3 + 2.5}s`;
        starryBg.appendChild(star);
    }
}

// Start Typing
window.addEventListener('DOMContentLoaded', () => {
    typePhrase();
    setupOuterDesktopPolaroids();
});

// Setup polaroids for larger screens desktop environment
function setupOuterDesktopPolaroids() {
    const desktopBg = document.querySelector('.desktop-bg-decor');
    const imagesList = ['images/somu_1.jpg', 'images/somu_2.jpg', 'images/somu_3.jpg', 'images/somu_4.jpg'];
    const caps = ['magical ✨', 'smile ♡', 'pretty 🌹', 'cute vibes'];
    
    for (let i = 0; i < 4; i++) {
        const pol = document.createElement('div');
        pol.className = 'desktop-polaroid';
        pol.innerHTML = `
            <img src="${imagesList[i]}" alt="Somu Desktop Photo">
            <span style="font-family:'Caveat'; font-size:1rem; text-align:center; display:block; margin-top:8px; color:#555;">${caps[i]}</span>
        `;
        desktopBg.appendChild(pol);
    }
}

// Enter Scrapbook
function enterWorld() {
    document.getElementById('opening-screen').classList.add('hidden');
    document.getElementById('scrapbook-screen').classList.remove('hidden');
    
    if (!isAudioPlaying) {
        toggleAudio();
    }
    
    initScrapbookScroll();
    initHeroWords();
}

// --- 5. Hero Words Carousel ---
const heroWords = ['soft heart ♡', 'strong mind 💪', 'pretty chaos ✨', 'ncc baddie 🎖️', 'main character energy 👑'];
let wordIdx = 0;

function initHeroWords() {
    const wordsContainer = document.getElementById('dynamic-words-box');
    heroWords.forEach((word, idx) => {
        const span = document.createElement('span');
        span.className = 'dynamic-word';
        span.innerText = word;
        if (idx === 0) span.classList.add('active');
        wordsContainer.appendChild(span);
    });
    
    setInterval(() => {
        const spans = wordsContainer.querySelectorAll('.dynamic-word');
        spans[wordIdx].classList.remove('active');
        wordIdx = (wordIdx + 1) % spans.length;
        spans[wordIdx].classList.add('active');
    }, 2800);
}

// --- 6. Scroll Integrations & Constellation drawing ---
let constellationAnimated = false;

function initScrapbookScroll() {
    scrapbookScreen.addEventListener('scroll', () => {
        // Timeline Draw
        const timeline = document.querySelector('.timeline-container');
        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const timelineLine = document.querySelector('.timeline-line');
            const screenHeight = appContainer.clientHeight;
            
            const topInView = rect.top;
            const totalHeight = rect.height;
            
            let progress = 0;
            if (topInView < screenHeight) {
                progress = (screenHeight - topInView) / totalHeight;
                if (progress > 1) progress = 1;
                if (progress < 0) progress = 0;
            }
            timelineLine.style.transform = `scaleY(${progress})`;
        }

        // Constellation trigger on final page scroll
        const finalPage = document.getElementById('final-page');
        if (finalPage && !constellationAnimated) {
            const rect = finalPage.getBoundingClientRect();
            const screenHeight = appContainer.clientHeight;
            if (rect.top < screenHeight - 150) {
                drawConstellation();
                constellationAnimated = true;
            }
        }
    });
}

// Draw Bunny Constellation dynamically
function drawConstellation() {
    // Add extra twinkling canvas stars to final page
    const finalPage = document.getElementById('final-page');
    
    // Injecting bunny shape stars coordinates
    const starsCoords = [
        {x: 30, y: 30}, {x: 32, y: 15}, {x: 38, y: 25}, {x: 45, y: 35}, 
        {x: 55, y: 35}, {x: 62, y: 25}, {x: 68, y: 15}, {x: 70, y: 30},
        {x: 50, y: 50}, {x: 40, y: 70}, {x: 60, y: 70}, {x: 50, y: 80}
    ];

    const svg = finalPage.querySelector('.constellation-svg');
    svg.innerHTML = ''; // Reset static drawing

    // Draw lines with delay
    const lines = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], 
        [3, 8], [4, 8], [8, 9], [8, 10], [9, 11], [10, 11]
    ];

    // Create SVG Star dots
    starsCoords.forEach((coord, idx) => {
        const star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        star.setAttribute("cx", coord.x);
        star.setAttribute("cy", coord.y);
        star.setAttribute("r", "0");
        star.setAttribute("fill", idx % 2 === 0 ? "#FFD9E2" : "#FFF7F3");
        star.style.transition = 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
        star.style.transitionDelay = `${idx * 0.15}s`;
        svg.appendChild(star);
        
        setTimeout(() => {
            star.setAttribute("r", idx === 8 ? "4" : "2.5");
        }, 100);
    });

    // Create SVG Lines connecting
    lines.forEach((linePair, idx) => {
        const start = starsCoords[linePair[0]];
        const end = starsCoords[linePair[1]];

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", start.x);
        line.setAttribute("y1", start.y);
        line.setAttribute("x2", start.x);
        line.setAttribute("y2", start.y);
        line.setAttribute("stroke", "rgba(255, 217, 226, 0.45)");
        line.setAttribute("stroke-width", "1.5");
        line.setAttribute("stroke-dasharray", "4");
        line.style.transition = 'all 1.5s ease-in-out';
        line.style.transitionDelay = `${idx * 0.12 + 1.2}s`;
        
        svg.appendChild(line);

        setTimeout(() => {
            line.setAttribute("x2", end.x);
            line.setAttribute("y2", end.y);
        }, 150);
    });
}

// --- 7. Cards Interaction Actions ---

// Walls Magnum melt toggle
function handleMagnumClick(card) {
    card.classList.toggle('melted');
}

// Rose bloom trigger
function handleRoseClick(card) {
    if (!card.classList.contains('bloomed')) {
        card.classList.add('bloomed');
        setTimeout(() => {
            card.classList.remove('bloomed');
        }, 6000);
    }
}

// Comfort Food steam trigger
function handleComfortClick(card) {
    card.classList.add('steaming');
    setTimeout(() => {
        card.classList.remove('steaming');
    }, 4500);
}

// Burger Pizza Selector
function handleFoodToggle(icon, targetFood) {
    const burgerIcon = document.getElementById('burger-icon');
    const pizzaIcon = document.getElementById('pizza-icon');
    const burgerLabel = document.getElementById('burger-label');
    
    if (targetFood === 'burger') {
        burgerIcon.classList.add('win');
        pizzaIcon.classList.add('lose');
        pizzaIcon.classList.remove('win');
        burgerIcon.classList.remove('lose');
        burgerLabel.innerText = 'Burger wins! 🍔🏆';
    } else {
        pizzaIcon.classList.add('win');
        burgerIcon.classList.add('lose');
        burgerIcon.classList.remove('win');
        pizzaIcon.classList.remove('lose');
        burgerLabel.innerText = 'Pizza is fine, but Burger rules!';
    }
}

// Colors theme transition & chalk hearts overlay
function handleColorsClick(card) {
    card.classList.toggle('dark-theme-active');
    const isDark = card.classList.contains('dark-theme-active');
    const page = document.getElementById('who-is-somu-page');
    
    if (isDark) {
        page.style.backgroundColor = '#1C1C2A';
        page.style.backgroundImage = 'radial-gradient(rgba(255, 217, 226, 0.04) 1px, transparent 1px)';
        page.querySelector('.page-title').style.color = '#FFD9E2';
        
        // Draw little chalk heart inside color card
        const chalkHeart = document.createElement('div');
        chalkHeart.id = 'chalk-heart';
        chalkHeart.style.position = 'absolute';
        chalkHeart.style.bottom = '8px';
        chalkHeart.style.right = '12px';
        chalkHeart.style.fontFamily = 'Caveat';
        chalkHeart.style.fontSize = '1.8rem';
        chalkHeart.style.color = '#FFF7F3';
        chalkHeart.style.opacity = '0.7';
        chalkHeart.innerText = '♡';
        chalkHeart.style.transform = 'scale(0.8) rotate(-10deg)';
        chalkHeart.style.transition = 'all 0.5s ease';
        card.appendChild(chalkHeart);
        setTimeout(() => {
            chalkHeart.style.transform = 'scale(1.1) rotate(5deg)';
        }, 50);
    } else {
        page.style.backgroundColor = '';
        page.style.backgroundImage = '';
        page.querySelector('.page-title').style.color = '';
        const heart = document.getElementById('chalk-heart');
        if (heart) heart.remove();
    }
}

// Tori enemy sticker shake
function handleToriClick(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 1500);
}

// Leo paw footprints click
function spawnPaws(card) {
    const rect = card.getBoundingClientRect();
    const rectParent = appContainer.getBoundingClientRect();
    
    const x = rect.left - rectParent.left + rect.width / 2;
    const y = rect.top - rectParent.top + rect.height / 2;
    
    for (let i = 0; i < 4; i++) {
        const paw = document.createElement('div');
        paw.className = 'paw-particle';
        paw.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-4.5-2c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM12 8c-.83 0-1.5.67-1.5 1.5S11.17 11 12 11s1.5-.67 1.5-1.5S12.83 8 12 8zm-4.5-1c-.83 0-1.5.67-1.5 1.5S6.67 10 7.5 10s1.5-.67 1.5-1.5S8.33 7 7.5 7zm9 0c-.83 0-1.5.67-1.5 1.5S15.67 10 16.5 10s1.5-.67 1.5-1.5S17.33 7 16.5 7z"/></svg>`;
        paw.style.left = `${x}px`;
        paw.style.top = `${y}px`;
        paw.style.position = 'absolute';
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 45 + 35;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed - 25; // Drift bias up
        
        paw.style.transition = 'all 1.4s cubic-bezier(0.1, 0.8, 0.3, 1)';
        
        appContainer.appendChild(paw);
        
        setTimeout(() => {
            paw.style.transform = `translate(${dx}px, ${dy}px) scale(0.3) rotate(${Math.random() * 60 - 30}deg)`;
            paw.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            paw.remove();
        }, 1450);
    }
}

// Replay action
function replayMemories() {
    // Reset constellation triggers
    constellationAnimated = false;
    scrapbookScreen.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
