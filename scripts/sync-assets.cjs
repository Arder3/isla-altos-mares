const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.VITE_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const BASE_PROJECT_PATH = 'c:/Users/Ariel Deyá/Documents/Isla de Altos Mares/isla de altos mares 4.0';
const TARGET_CHARACTERS = ['Mita', 'Cito'];

const galleryManifest = {};

const syncFolder = async (localPath, cloudinaryFolder, charName, type, rootFolder = null) => {
    if (!fs.existsSync(localPath)) return;

    if (!galleryManifest[charName]) galleryManifest[charName] = { SD: [], HD: [] };

    const files = fs.readdirSync(localPath);
    for (const file of files) {
        const fullPath = path.join(localPath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            await syncFolder(fullPath, rootFolder || cloudinaryFolder, charName, type, rootFolder || cloudinaryFolder);
        } else if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
            const publicId = path.parse(file).name;
            console.log(`🚀 Syncing: ${file} -> ${rootFolder || cloudinaryFolder}`);
            try {
                await cloudinary.uploader.upload(fullPath, {
                    public_id: publicId,
                    folder: rootFolder || cloudinaryFolder,
                    overwrite: true,
                    resource_type: 'image'
                });
                // Add to manifest
                if (!galleryManifest[charName][type].includes(publicId)) {
                    galleryManifest[charName][type].push(publicId);
                }
            } catch (err) {
                console.error(`❌ Error syncing ${file}:`, err.message);
            }
        }
    }
};

const findCharFolder = (charName) => {
    const charBasePath = path.join(BASE_PROJECT_PATH, '03_Universo/03.02_Arte/03.02.03_Personajes_Principales');
    const folders = fs.readdirSync(charBasePath);
    // Find folder ending with _CharName (e.g., 03.02.03.01_Mita)
    const match = folders.find(f => f.endsWith(`_${charName}`));
    return match ? path.join(charBasePath, match) : null;
};

const runSync = async () => {
    console.log('--- Starting Cloudinary Mirror Sync ---');
    for (const char of TARGET_CHARACTERS) {
        const charPath = findCharFolder(char);
        if (!charPath) {
            console.warn(`⚠️ Character folder not found for: ${char}`);
            continue;
        }

        console.log(`📂 Processing: ${char} (Path: ${charPath})`);

        // Sync Aprobados -> SD
        const approvedSub = fs.readdirSync(charPath).find(f => f.includes('_Aprobados'));
        if (approvedSub) {
            await syncFolder(path.join(charPath, approvedSub), `AltosMares/${char}/SD`, char, 'SD');
        }

        // Sync HD -> HD
        const hdSub = fs.readdirSync(charPath).find(f => f.includes('_Material_HD'));
        if (hdSub) {
            await syncFolder(path.join(charPath, hdSub), `AltosMares/${char}/HD`, char, 'HD');
        }

        // Sync WEB -> SD
        const webSub = fs.readdirSync(charPath).find(f => f.includes('_Material_Web'));
        if (webSub) {
            // Web portal assets are synced to SD folder
            await syncFolder(path.join(charPath, webSub), `AltosMares/${char}/SD`, char, 'SD');
        }
    }

    // Write manifest
    const manifestPath = path.join(__dirname, '../src/core/gallery_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(galleryManifest, null, 2));
    console.log(`✅ Gallery manifest generated at: ${manifestPath}`);

    console.log('--- Sync Completed ---');
};

runSync();
