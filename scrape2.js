const https = require('https');
https.get('https://cerebrium.ai/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // find script src
        const scripts = data.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi);
        console.log("Scripts:", scripts);
        
        // Let's also check for any inline WebGL shaders or variables
        const inlineScripts = data.match(/<script>([\s\S]*?)<\/script>/gi);
        if (inlineScripts) {
            console.log("Inline script lengths:", inlineScripts.map(s => s.length));
        }
    });
});
