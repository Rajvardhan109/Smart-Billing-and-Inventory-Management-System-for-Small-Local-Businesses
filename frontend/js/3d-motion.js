// ------- Exact 3D Motion (Tilt + Glare + 3D Canvas) ------- //

document.addEventListener('DOMContentLoaded', () => {
    initAdvanced3DTilt();
    initCerebriumStyleCanvas();
});

// 1. Advanced 3D Tilt with Glare (similar to vanilla-tilt)
function initAdvanced3DTilt() {
    const cards = document.querySelectorAll('.feature-card, .tech-card, .step-card, .dash-card, .content-card, .auth-card');
    
    cards.forEach(card => {
        // Setup Card Styles
        card.style.transformStyle = 'preserve-3d';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        
        // Add Glare Element
        const glare = document.createElement('div');
        glare.className = 'card-glare';
        glare.style.position = 'absolute';
        glare.style.top = '0';
        glare.style.left = '0';
        glare.style.width = '100%';
        glare.style.height = '100%';
        glare.style.background = 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15), transparent)';
        glare.style.pointerEvents = 'none';
        glare.style.opacity = '0';
        glare.style.transition = 'opacity 0.3s ease';
        glare.style.zIndex = '10';
        card.appendChild(glare);

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const maxTilt = 15; // Max degrees
            
            const rotateX = ((y - centerY) / centerY) * -maxTilt; 
            const rotateY = ((x - centerX) / centerX) * maxTilt;
            
            // Apply 3D Transform
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
            card.style.transition = 'none';
            card.style.zIndex = '10';
            
            // Apply Glare position
            glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`;
            glare.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s ease';
            card.style.zIndex = '1';
            glare.style.opacity = '0';
            glare.style.transition = 'opacity 0.5s ease';
        });
    });
}

// 2. Exact 3D Network/Wave Canvas for Hero Background
function initCerebriumStyleCanvas() {
    const canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Mouse tracking for 3D perspective shift
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 };
    
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // Smooth mouse movement
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
    });
    
    // 3D Grid parameters
    const cols = 25;
    const rows = 15;
    let time = 0;
    
    function draw() {
        // Smoothly interpolate mouse
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
        
        ctx.clearRect(0, 0, width, height);
        time += 0.015;
        
        const spacingX = width / cols;
        const spacingY = height / rows;
        
        const nodes = [];
        
        // Calculate nodes in 3D
        for (let j = 0; j <= rows; j++) {
            nodes[j] = [];
            for (let i = 0; i <= cols; i++) {
                // Base 2D position
                const bx = (i * spacingX) - (width * 0.1);
                const by = (j * spacingY) - (height * 0.1);
                
                // 3D Wave math (Simulate Z-depth based on Sine waves)
                const waveX = Math.sin(i * 0.3 + time) * 30;
                const waveY = Math.cos(j * 0.3 + time) * 30;
                const z = Math.sin(i * 0.2 + j * 0.2 + time); // -1 to 1
                
                // Add Parallax from mouse
                const parallaxX = (mouse.x - width/2) * (z * 0.1);
                const parallaxY = (mouse.y - height/2) * (z * 0.1);
                
                const finalX = bx + waveX - parallaxX;
                const finalY = by + waveY - parallaxY;
                
                nodes[j][i] = { x: finalX, y: finalY, z: z };
            }
        }
        
        // Draw Connections
        ctx.lineWidth = 1;
        
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const n1 = nodes[j][i];
                const n2 = nodes[j][i+1];
                const n3 = nodes[j+1][i];
                
                // Only draw if relatively close to center or randomly to create abstract shape
                const distToCenter = Math.sqrt(Math.pow(n1.x - width/2, 2) + Math.pow(n1.y - height/2, 2));
                if (distToCenter < width * 0.6) {
                    const opacity = Math.max(0, 0.3 + (n1.z * 0.2));
                    
                    // X connection
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(227, 58, 219, ${opacity * 0.5})`;
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                    
                    // Y connection
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 72, 139, ${opacity * 0.5})`;
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n3.x, n3.y);
                    ctx.stroke();
                    
                    // Draw node point
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.arc(n1.x, n1.y, 1.5 + (n1.z), 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }
        
        requestAnimationFrame(draw);
    }
    
    draw();
}
