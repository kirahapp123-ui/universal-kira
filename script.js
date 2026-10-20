const canvas = document.getElementById('sandbox-canvas');
const ctx = canvas.getContext('2d');

// Resizing configurations
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// State variables
let bodies = [];
let G = 1; 
let timeStep = 1;
let showTrails = true;
let showGrid = false;

// Mouse vector tracking
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let currentMousePos = { x: 0, y: 0 };

// Object configuration definitions
const PRESETS = {
    planet: { mass: 10, radius: 5, color: '#4ba3ff' },
    star: { mass: 1000, radius: 14, color: '#ffdd6b' },
    dust: { mass: 0.1, radius: 2, color: '#ae9fff' },
    blackhole: { mass: 20000, radius: 8, color: '#ffffff' }
};

class CelestialBody {
    constructor(x, y, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.mass = PRESETS[type].mass;
        this.radius = PRESETS[type].radius;
        this.color = PRESETS[type].color;
        this.trail = [];
        this.maxTrailLength = 120;
    }

    updatePosition() {
        if (timeStep === 0) return;
        this.x += this.vx * timeStep;
        this.y += this.vy * timeStep;

        if (showTrails) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        } else {
            this.trail = [];
        }
    }

    draw() {
        // Draw Orbits
        if (showTrails && this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = this.color + '22'; // Faint transparency trail
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Draw Glow for Massive Elements
        if (this.type === 'star' || this.type === 'blackhole') {
            ctx.beginPath();
            let gradient = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 3);
            if (this.type === 'star') {
                gradient.addColorStop(0, 'rgba(255, 221, 107, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 221, 107, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(150, 150, 255, 0.4)');
                gradient.addColorStop(0.3, 'rgba(20, 10, 40, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            }
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Primary Body Component
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.type === 'blackhole' ? '#000000' : this.color;
        ctx.fill();
        if (this.type === 'blackhole') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// Universal Gravity Resolution Engine Engine
function calculateGravity() {
    if (timeStep === 0) return;

    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            let b1 = bodies[i];
            let b2 = bodies[j];

            let dx = b2.x - b1.x;
            let dy = b2.y - b1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Set minimum distance constraint boundary to avoid infinite limits
            if (dist < 4) dist = 4; 

            // Collision check configuration
            if (dist < (b1.radius + b2.radius)) {
                // Merge mechanics: Larger mass absorbs smaller body
                if (b1.mass >= b2.mass) {
                    b1.vx = (b1.vx * b1.mass + b2.vx * b2.mass) / (b1.mass + b2.mass);
                    b1.vy = (b1.vy * b1.mass + b2.vy * b2.mass) / (b1.mass + b2.mass);
                    b1.mass += b2.mass;
                    b1.radius = Math.max(b1.radius, Math.sqrt(b1.radius*b1.radius + b2.radius*b2.radius)*0.8);
                    bodies.splice(j, 1);
                    j--;
                    continue;
                } else {
                    b2.vx = (b1.vx * b1.mass + b2.vx * b2.mass) / (b1.mass + b2.mass);
                    b2.vy = (b1.vy * b1.mass + b2.vy * b2.mass) / (b1.mass + b2.mass);
                    b2.mass += b1.mass;
                    b2.radius = Math.max(b2.radius, Math.sqrt(b1.radius*b1.radius + b2.radius*b2.radius)*0.8);
                    bodies.splice(i, 1);
                    i--;
                    break;
                }
            }

            // Newtonian Force Calculation Vector Layout
            let force = (G * b1.mass * b2.mass) / (dist * dist);
            let fx = force * (dx / dist);
            let fy = force * (dy / dist);

            // Apply acceleration limits
            b1.vx += (fx / b1.mass) * timeStep;
            b1.vy += (fy / b1.mass) * timeStep;
            b2.vx -= (fx / b2.mass) * timeStep;
            b2.vy -= (fy / b2.mass) * timeStep;
        }
    }
}

// Rendering Cosmic Grid Component
function drawGridOverlay() {
    ctx.strokeStyle = 'rgba(80, 100, 250, 0.04)';
    ctx.lineWidth = 1;
    let gridSize = 60;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Preset setup utility configurations
function loadSolarSystemPreset() {
    bodies = [];
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    // Star Base Center
    bodies.push(new CelestialBody(centerX, centerY, 0, 0, 'star'));
    
    // Planet 1 Close Orbit
    bodies.push(new CelestialBody(centerX, centerY - 140, 2.7, 0, 'planet'));

    // Planet 2 Outer Orbit
    let p2 = new CelestialBody(centerX, centerY + 240, -2.0, 0, 'planet');
    p2.color = '#ff8f4b';
    bodies.push(p2);

    // Dynamic Dust Ring Array Injection Layout
    for (let i = 0; i < 45; i++) {
        let angle = Math.random() * Math.PI * 2;
        let radius = 170 + Math.random() * 50;
        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius;
        
        // Perpendicular Vector velocity calculation setup for orbit
        let speed = Math.sqrt((G * 1000) / radius);
        let vx = -Math.sin(angle) * speed;
        let vy = Math.cos(angle) * speed;
        
        bodies.push(new CelestialBody(x, y, vx, vy, 'dust'));
    }
}

// Application Primary Animation Loop Component
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) drawGridOverlay();

    calculateGravity();

    bodies.forEach(body => {
        body.updatePosition();
        body.draw();
    });

    // Render Sling Input Indicator Line UI Setup
    if (isDragging) {
        ctx.beginPath();
        ctx.moveTo(dragStart.x, dragStart.y);
        ctx.lineTo(currentMousePos.x, currentMousePos.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Preview spawned body layout footprint representation target node
        let selectedType = document.getElementById('body-type').value;
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, PRESETS[selectedType].radius, 0, Math.PI * 2);
        ctx.fillStyle = PRESETS[selectedType].color;
        ctx.fill();
    }

    requestAnimationFrame(loop);
}

// User Control Interface Event Attachments
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    currentMousePos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    currentMousePos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;

    let selectedType = document.getElementById('body-type').value;
    
    // Physics Velocity scaling offset vector setup logic rule profile
    let vx = (dragStart.x - e.clientX) * 0.04;
    let vy = (dragStart.y - e.clientY) * 0.04;

    bodies.push(new CelestialBody(dragStart.x, dragStart.y, vx, vy, selectedType));
});

document.getElementById('gravity-slider').addEventListener('input', (e) => {
    G = parseFloat(e.target.value);
});

document.getElementById('time-slider').addEventListener('input', (e) => {
    timeStep = parseFloat(e.target.value);
});

document.getElementById('toggle-trails').addEventListener('change', (e) => {
    showTrails = e.target.checked;
});

document.getElementById('toggle-grid').addEventListener('change', (e) => {
    showGrid = e.target.checked;
});

document.getElementById('btn-clear').addEventListener('click', () => {
    bodies = [];
});

document.getElementById('btn-preset').addEventListener('click', loadSolarSystemPreset);

// Initialization System Launcher Triggers
loadSolarSystemPreset();
loop();
