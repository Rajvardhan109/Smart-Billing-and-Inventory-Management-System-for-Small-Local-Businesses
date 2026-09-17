const fs = require('fs');
const content = fs.readFileSync('C:/Users/MARCOS/.gemini/antigravity/brain/065dea68-33d6-41c9-a81d-eee76a13116e/.system_generated/steps/114/content.md', 'utf8');

const customElements = content.match(/<c-[a-zA-Z0-9-]+/gi);
console.log("Custom Elements:", [...new Set(customElements)]);

const allImages = content.match(/https:\/\/www\.datocms-assets\.com\/[^\s"'<>]+/gi);
console.log("\nDatoCMS unique assets:", [...new Set(allImages)].slice(0, 10));
