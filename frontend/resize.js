import sharp from 'sharp';
import fs from 'fs';

async function resizeIcons() {
    const inputPath = "C:\\Users\\Windows\\.gemini\\antigravity\\brain\\5ea314f2-581b-4b79-b5bc-d1a1fc5cab90\\pwa_icon_1772712612456.png";
    const publicDir = "c:\\Users\\Windows\\Desktop\\sites\\erpmarche\\frontend\\public";

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    try {
        // 192x192
        await sharp(inputPath)
            .resize(192, 192)
            .toFile(publicDir + '\\pwa-192x192.png');

        // 512x512
        await sharp(inputPath)
            .resize(512, 512)
            .toFile(publicDir + '\\pwa-512x512.png');

        // favicon
        await sharp(inputPath)
            .resize(32, 32)
            .toFile(publicDir + '\\favicon.ico');

        console.log("Icons generated successfully.");
    } catch (e) {
        console.error("Error formatting icons:", e);
    }
}

resizeIcons();
