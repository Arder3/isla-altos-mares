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

const syncFolder = async (localPath, cloudinaryFolder, rootFolder = null) => {
    if (!fs.existsSync(localPath)) return;

    const files = fs.readdirSync(localPath);
    for (const file of files) {
        const fullPath = path.join(localPath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            // Pass the root cloudinaryFolder to keep it flat
            await syncFolder(fullPath, rootFolder || cloudinaryFolder, rootFolder || cloudinaryFolder);
        } else if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
            console.log(`🚀 Syncing: ${file} -> ${rootFolder || cloudinaryFolder}`);
            try {
                await cloudinary.uploader.upload(fullPath, {
                    public_id: path.parse(file).name,
                    folder: rootFolder || cloudinaryFolder,
                    overwrite: true,
                    resource_type: 'image'
                });
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

        // Sync Aprobados (look for a folder starting with ID + .03_Aprobados or similar)
        const approvedSub = fs.readdirSync(charPath).find(f => f.includes('_Aprobados'));
        if (approvedSub) {
            await syncFolder(path.join(charPath, approvedSub), `AltosMares/${char}/SD`);
        }

        // Sync HD (look for a folder starting with ID + .04_Material_HD or similar)
        const hdSub = fs.readdirSync(charPath).find(f => f.includes('_Material_HD'));
        if (hdSub) {
            await syncFolder(path.join(charPath, hdSub), `AltosMares/${char}/HD`);
        }

        // Sync WEB (look for a folder starting with ID + .05_Material_Web or similar)
        const webSub = fs.readdirSync(charPath).find(f => f.includes('_Material_Web'));
        if (webSub) {
            // Web portal assets are synced to SD folder
            await syncFolder(path.join(charPath, webSub), `AltosMares/${char}/SD`);
        }
    }
    console.log('--- Sync Completed ---');
};

runSync();
