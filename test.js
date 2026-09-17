const fs = require('fs');
const content = fs.readFileSync('C:/Users/MARCOS/.gemini/antigravity/brain/065dea68-33d6-41c9-a81d-eee76a13116e/.system_generated/steps/114/content.md', 'utf8');

console.log("SVG count:", (content.match(/<svg/g) || []).length);
console.log("Videos:", content.match(/<video[^>]*>/g));
console.log("Canvases:", content.match(/<canvas[^>]*>/g));
console.log("Iframes:", content.match(/<iframe[^>]*>/g));
console.log("Lottie:", content.match(/lottie/gi));
console.log("Spline:", content.match(/spline/gi));
console.log("Webgl:", content.match(/webgl/gi));

// Let's find any unique elements that could be the main animation
console.log("Data attributes containing 'animation' or 'motion':", content.match(/data-[a-zA-Z0-9-]+=["'][^"']*(?:animation|motion)[^"']*["']/gi));

// Let's find CSS classes with 'animate' or 'motion'
console.log("Classes with 'animate':", content.match(/class=["'][^"']*animate[^"']*["']/gi));
