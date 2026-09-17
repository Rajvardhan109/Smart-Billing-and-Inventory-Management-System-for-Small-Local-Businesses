const https = require('https');

https.get('https://cerebrium.ai/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Looking for Spline:", data.toLowerCase().includes('spline'));
        console.log("Looking for WebGL/Three:", data.toLowerCase().includes('three') || data.toLowerCase().includes('webgl'));
        
        const assets = data.match(/https?:\/\/[^\s"'<>]+/gi) || [];
        const models = assets.filter(url => url.match(/\.(glb|gltf|splinecode|js|json|mp4|webm)$/i));
        
        console.log("\nPotential 3D/Animation Assets found:");
        console.log([...new Set(models)].filter(u => !u.includes('googletag') && !u.includes('analytics')));
        
        const customTags = data.match(/<c-[a-zA-Z0-9-]+/gi) || [];
        console.log("\nCustom Elements:");
        console.log([...new Set(customTags)]);
    });
});
