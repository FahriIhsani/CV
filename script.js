document.addEventListener('DOMContentLoaded', () => {

    // --- CUSTOM CURSOR ---
    const cursor = document.createElement('div');
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(196, 181, 253, 0.7);
        border-radius: 50%;
        left: -30px; /* Start off-screen */
        top: -30px;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.2s ease-out;
        mix-blend-mode: difference;
    `;
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', e => {
        cursor.style.left = `${e.clientX - 10}px`;
        cursor.style.top = `${e.clientY - 10}px`;
    });
     window.addEventListener('mousedown', () => cursor.style.transform = 'scale(1.5)');
    window.addEventListener('mouseup', () => cursor.style.transform = 'scale(1)');

    // --- DYNAMIC BACKGROUND ---
    const canvas = document.getElementById('constellation-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [], shootingStars = [], ripples = [];
    let mouse = { x: null, y: null };

    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        // Make canvas cover the entire scrollable page height
        canvas.height = Math.max(document.body.scrollHeight, window.innerHeight);
    };

    class Star {
        constructor(x, y, radius, color) {
            this.x = x; this.y = y;
            this.radius = radius; this.color = color;
            this.baseX = x; this.baseY = y;
            this.density = (Math.random() * 20) + 5;
            this.vx = 0; this.vy = 0;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }
        update() {
            // Gravity effect towards cursor
            let dx_mouse = mouse.x - this.x;
            let dy_mouse = mouse.y - this.y;
            let dist_mouse = Math.sqrt(dx_mouse * dx_mouse + dy_mouse * dy_mouse);

            if (dist_mouse < 200) {
                this.vx += dx_mouse / dist_mouse * 0.05;
                this.vy += dy_mouse / dist_mouse * 0.05;
            }

            // Ripple effect repulsion
            ripples.forEach(ripple => {
                let dx_ripple = this.x - ripple.x;
                let dy_ripple = this.y - ripple.y;
                let dist_ripple = Math.sqrt(dx_ripple * dx_ripple + dy_ripple * dy_ripple);
                if (dist_ripple < ripple.radius && dist_ripple > ripple.radius - 50) {
                    this.vx += dx_ripple / dist_ripple * (ripple.radius / dist_ripple) * 0.1 * ripple.strength;
                    this.vy += dy_ripple / dist_ripple * (ripple.radius / dist_ripple) * 0.1 * ripple.strength;
                }
            });

            // Spring back to base position
            let dx_base = this.baseX - this.x;
            let dy_base = this.baseY - this.y;
            this.vx += dx_base * 0.01;
            this.vy += dy_base * 0.01;

            // Apply velocity and friction
            this.x += this.vx; this.y += this.vy;
            this.vx *= 0.95; this.vy *= 0.95;

            this.draw();
        }
    }

    class ShootingStar {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = 0;
            this.len = (Math.random() * 80) + 10;
            this.speed = (Math.random() * 10) + 6;
            this.size = (Math.random() * 1) + 0.1;
            this.angle = Math.PI / 4; // Always shoot down-right for consistency
        }
        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.len * Math.cos(this.angle), this.y + this.len * Math.sin(this.angle));
            ctx.lineWidth = this.size;
            ctx.strokeStyle = 'rgba(196, 181, 253, 0.5)';
            ctx.stroke();
        }
        update() {
            this.x += this.speed * Math.cos(this.angle);
            this.y += this.speed * Math.sin(this.angle);
            if(this.y > canvas.height || this.x > canvas.width){
                this.reset();
            }
            this.draw();
        }
    }

    class Ripple {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.radius = 1; this.maxRadius = 200;
            this.speed = 5; this.strength = 1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(196, 181, 253, ${this.strength * 0.5})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        update() {
            this.radius += this.speed;
            if (this.radius > this.maxRadius) {
                this.strength -= 0.02;
            }
            this.draw();
        }
    }

    const initScene = () => {
        stars = [];
        let starCount = (canvas.width * canvas.height) / 9000;
        for (let i = 0; i < starCount; i++) {
            let radius = Math.random() * 1.5;
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            stars.push(new Star(x, y, radius, 'rgba(196, 181, 253, 0.7)'));
        }
        shootingStars = [];
        for(let i = 0; i < 3; i++) {
            shootingStars.push(new ShootingStar());
        }
    };
    
    const connectStars = () => {
        // Same as before
        let opacityValue = 1;
        for (let a = 0; a < stars.length; a++) {
            for (let b = a; b < stars.length; b++) {
                let distance = Math.sqrt(Math.pow(stars[a].x - stars[b].x, 2) + Math.pow(stars[a].y - stars[b].y, 2));
                if (distance < 120) {
                    opacityValue = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${opacityValue * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(stars[a].x, stars[a].y);
                    ctx.lineTo(stars[b].x, stars[b].y);
                    ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        stars.forEach(s => s.update());
        shootingStars.forEach(ss => ss.update());
        ripples = ripples.filter(r => r.strength > 0);
        ripples.forEach(r => r.update());
        
        connectStars();
    };

    window.addEventListener('mousemove', e => {
        mouse.x = e.pageX;
        mouse.y = e.pageY; // Use pageY for full-page coords
    });
    
    window.addEventListener('mousedown', e => {
        ripples.push(new Ripple(e.pageX, e.pageY));
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setCanvasSize();
            initScene();
        }, 250);
    });

    setCanvasSize();
    initScene();
    animate();

    // --- HEADER SCROLL EFFECT (Unchanged) ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        // Adjust mouse Y for scrolling in constellation
        mouse.y = window.scrollY + (mouse.y - window.scrollY); 
    });

    // --- TYPING EFFECT (Unchanged) ---
    const typingElement = document.getElementById('typing-effect');
    if(typingElement) {
        const words = ["Creative Developer.", "Problem Solver.", "UI/UX Enthusiast.", "Tech Architect."];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const type = () => {
            const currentWord = words[wordIndex];
            let displayText = isDeleting 
                ? currentWord.substring(0, charIndex - 1) 
                : currentWord.substring(0, charIndex + 1);
            
            typingElement.textContent = displayText;
            charIndex = isDeleting ? charIndex - 1 : charIndex + 1;

            let typeSpeed = isDeleting ? 75 : 150;

            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }

            setTimeout(type, typeSpeed);
        };
        type();
    }

    // --- SCROLL REVEAL ANIMATION (Unchanged) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-fade').forEach(el => {
        observer.observe(el);
    });
});

