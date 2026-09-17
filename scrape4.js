const fs = require('fs');
const js = fs.readFileSync('bg.js', 'utf8');

let startIndex = 0;
while(true) {
    const idx = js.toLowerCase().indexOf('spline', startIndex);
    if (idx === -1) break;
    
    console.log("Context:");
    console.log(js.substring(Math.max(0, idx - 100), idx + 100));
    startIndex = idx + 6;
}
