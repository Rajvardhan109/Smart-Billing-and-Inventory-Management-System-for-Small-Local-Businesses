const fs = require('fs');
const js = fs.readFileSync('bg.js', 'utf8');
const urls = js.match(/https?:\/\/[^\s"'<>]+\.(splinecode|json|gltf|glb)/gi);
console.log('URLs:', urls);
