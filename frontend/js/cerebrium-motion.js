// ------- Exact Cerebrium.ai Motion System (Native WebGL) ------- //

document.addEventListener('DOMContentLoaded', () => {
    initThreeJSFlythrough();
    initSplitTitleReveal();
    initScrambleText();
    initFeatureCardsReveal();
});

// 1. Native WebGL 3D Tunnel Fly-through (The Cerebrium hero animation)
function initThreeJSFlythrough() {
    const hero = document.getElementById('hero');
    const container = document.getElementById('three-container');
    const cursor = document.getElementById('click-cursor');
    const heroContent = document.querySelector('.hero-content');
    
    if (!hero || !container || !cursor || typeof THREE === 'undefined') return;
    
    // Inject Custom Cursor CSS if not already there
    const style = document.createElement('style');
    style.innerHTML = `
        .click-hold-cursor {
            position: fixed;
            top: 0; left: 0;
            pointer-events: none;
            z-index: 9999;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .cursor-ring {
            width: 60px; height: 60px;
            border: 1px solid rgba(255,255,255,0.7);
            border-radius: 50%;
            position: relative;
            transition: transform 0.3s ease;
        }
        .cursor-ring::after {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            width: 6px; height: 6px;
            background: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        .cursor-text {
            margin-top: 10px;
            font-size: 0.65rem;
            letter-spacing: 0.15em;
            color: white;
            font-weight: 600;
        }
        .hero:hover .click-hold-cursor { opacity: 1; }
        .hero:active .cursor-ring { transform: scale(0.6); }
        .hero-fly-text-overlay {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-size: 8rem; font-weight: 700; color: white;
            font-family: 'Inter', sans-serif;
            text-shadow: 0 0 30px rgba(255,255,255,0.6);
            opacity: 0; pointer-events: none; z-index: 50;
            transition: opacity 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Create HTML overlays for the text since HTML text looks sharper than 3D text
    const textWords = ["Quickly", "Scale", "Globally", "SmartBill"];
    const textEls = textWords.map(word => {
        const el = document.createElement('div');
        el.className = 'hero-fly-text-overlay';
        el.textContent = word;
        hero.appendChild(el);
        return el;
    });

    // --- THREE.JS SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / hero.offsetHeight, 0.1, 2000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, hero.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xff488b, 2, 800);
    pointLight.position.set(0, 0, 200);
    scene.add(pointLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(100, 200, 500);
    scene.add(dirLight);

    // Create 3D Ribbons (Tubes)
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x931b7d, 
        emissive: 0x2a0026,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const tubes = [];
    for(let i=0; i<6; i++) {
        // Create a random curving path
        const points = [];
        for(let j=0; j<10; j++) {
            points.push(new THREE.Vector3(
                (Math.random() - 0.5) * 600,
                (Math.random() - 0.5) * 600,
                -j * 400 + (Math.random() * 100)
            ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 100, 25 + Math.random()*20, 16, false);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        tubes.push(mesh);
    }
    
    // Add floating particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 1000;
    const posArray = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount*3; i+=3) {
        posArray[i] = (Math.random() - 0.5) * 1500;
        posArray[i+1] = (Math.random() - 0.5) * 1500;
        posArray[i+2] = (Math.random() - 0.5) * -4000 + 200;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({ size: 3, color: 0xffffff, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Interaction Variables
    let isHolding = false;
    let targetZ = 200;
    let currentZ = 200;
    
    heroContent.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

    hero.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    hero.addEventListener('mousedown', (e) => {
        if(e.target.closest('a')) return;
        isHolding = true;
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'scale(1.1)';
    });
    
    window.addEventListener('mouseup', () => {
        isHolding = false;
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'scale(1)';
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / hero.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, hero.offsetHeight);
    });

    // Animation Loop
    const maxZDepth = -3000;
    function animate() {
        if(isHolding) {
            targetZ -= 40; // fly forward
            if(targetZ < maxZDepth) targetZ = maxZDepth;
        } else {
            targetZ += (200 - targetZ) * 0.05; // spring back
        }
        
        currentZ += (targetZ - currentZ) * 0.1;
        camera.position.z = currentZ;
        
        // Gentle auto-rotation of tubes
        tubes.forEach((t, i) => {
            t.rotation.z += 0.001 * (i%2==0?1:-1);
        });
        
        // Move particles slightly
        particles.rotation.z += 0.0005;

        // Show text dynamically based on depth
        // Text 0: ~ -500, Text 1: ~ -1200, Text 2: ~ -1900, Text 3: ~ -2600
        const depths = [-500, -1200, -1900, -2600];
        textEls.forEach((el, index) => {
            const dist = Math.abs(currentZ - depths[index]);
            if (dist < 300) {
                el.style.opacity = (1 - dist / 300).toFixed(2);
                el.style.transform = `translate(-50%, -50%) scale(${1 + (300-dist)/300 * 0.2})`;
            } else {
                el.style.opacity = 0;
            }
        });

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    
    animate();
}

// 2. Split Title Animation
function initSplitTitleReveal() {
    const title = document.querySelector('.hero-title');
    if (!title) return;
    
    const lines = title.innerHTML.split('<br>');
    title.innerHTML = '';
    
    lines.forEach((lineHtml, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'inline-block';
        wrapper.style.verticalAlign = 'top';
        if(index > 0) title.appendChild(document.createElement('br'));
        
        const content = document.createElement('span');
        content.innerHTML = lineHtml;
        content.style.display = 'inline-block';
        content.style.transform = 'translateY(120%)';
        content.style.opacity = '0';
        content.style.transition = `transform 0.8s cubic-bezier(0.19, 1, 0.22, 1) ${index * 0.15}s, opacity 0.8s ease ${index * 0.15}s`;
        
        wrapper.appendChild(content);
        title.appendChild(wrapper);
        
        void content.offsetWidth;
        
        requestAnimationFrame(() => {
            content.style.transform = 'translateY(0)';
            content.style.opacity = '1';
        });
    });
}

// 3. Scramble Text on Hover
function initScrambleText() {
    const chars = '!<>-_\\\\/[]{}—=+*^?#_';
    document.querySelectorAll('.nav-link, .btn, .footer-links a').forEach(el => {
        const targetElement = el.querySelector('span') || el;
        if(targetElement.children.length > 0 && targetElement.tagName !== 'SPAN') return;
        
        const originalText = targetElement.innerText.trim();
        if(!originalText) return;
        
        targetElement.dataset.original = originalText;
        let interval = null;
        
        el.addEventListener('mouseenter', () => {
            let iteration = 0;
            clearInterval(interval);
            
            interval = setInterval(() => {
                targetElement.innerText = originalText
                    .split('')
                    .map((letter, index) => {
                        if(index < iteration) return originalText[index];
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');
                
                if(iteration >= originalText.length){
                    clearInterval(interval);
                    targetElement.innerText = originalText;
                }
                
                iteration += 1 / 3;
            }, 30);
        });
        
        el.addEventListener('mouseleave', () => {
            clearInterval(interval);
            targetElement.innerText = originalText;
        });
    });
}

// 4. Clean Feature Cards
function initFeatureCardsReveal() {
    const cards = document.querySelectorAll('.feature-card, .tech-card, .step-card');
    cards.forEach(card => {
        card.style.transform = 'none';
        card.style.transformStyle = 'flat';
        card.style.transition = 'transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.4s ease';
        
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(227, 58, 219, 0.15) inset';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });
}
