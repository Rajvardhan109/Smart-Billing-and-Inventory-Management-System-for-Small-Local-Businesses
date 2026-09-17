const fs = require('fs');
const content = fs.readFileSync('C:/Users/MARCOS/.gemini/antigravity/brain/065dea68-33d6-41c9-a81d-eee76a13116e/.system_generated/steps/114/content.md', 'utf8');

const heroMatch = content.match(/<section[^>]*hero[^>]*>([\s\S]*?)<\/section>/i) 
    || content.match(/<header[^>]*>([\s\S]*?)<\/header>/i)
    || content.match(/<main[^>]*>([\s\S]*?)<section/i);

if (heroMatch) {
    console.log("Hero Match length:", heroMatch[1].length);
    console.log("Hero snippet:", heroMatch[1].substring(0, 1500));
}

const datocmsMedia = content.match(/https:\/\/www\.datocms-assets\.com\/[^\s"'<>]+/gi);
if (datocmsMedia) {
    console.log("\nDatoCMS assets:");
    console.log([...new Set(datocmsMedia)].filter(url => url.includes('json') || url.includes('mp4') || url.includes('webm') || url.includes('lottie')));
}
