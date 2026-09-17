const fs = require('fs');
const content = fs.readFileSync('C:/Users/MARCOS/.gemini/antigravity/brain/065dea68-33d6-41c9-a81d-eee76a13116e/.system_generated/steps/114/content.md', 'utf8');

// Find lottie URLs
const jsonUrls = content.match(/https?:\/\/[^\s"'<>]+\.json/gi);
console.log("JSON files found (potentially Lottie):", jsonUrls);

// Look around "lottie" keyword
const lottieIndex = content.toLowerCase().indexOf('lottie');
if (lottieIndex !== -1) {
    console.log("Context around 'lottie':");
    console.log(content.substring(Math.max(0, lottieIndex - 200), lottieIndex + 200));
}
