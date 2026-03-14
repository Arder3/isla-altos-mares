const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.VITE_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BASE_ART_PATH = 'c:/Users/Ariel Deyá/Documents/Isla de Altos Mares/isla de altos mares 4.0/03_Universo/03.02_Arte';

// Auto-discovers all character folders across all importance levels
const CHAR_CATEGORY_FOLDERS = [
    { folder: '03.02.03_Personajes_Principales', importance: 'Principal' },
    { folder: '03.02.04_Personajes_Secundarios', importance: 'Secundario' },
    { folder: '03.02.05_Personajes_NPC',         importance: 'NPC' },
];

const galleryManifest = {};

const syncFolder = async (localPath, cloudinaryFolder, charName, type, rootFolder = null) => {
    if (!fs.existsSync(localPath)) return;
    if (!galleryManifest[charName]) galleryManifest[charName] = { SD: [], HD: [], importance: '' };

    const files = fs.readdirSync(localPath);
    for (const file of files) {
        const fullPath = path.join(localPath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            await syncFolder(fullPath, rootFolder || cloudinaryFolder, charName, type, rootFolder || cloudinaryFolder);
        } else if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
            const publicId = path.parse(file).name;
            console.log(`🚀 Syncing: ${file} -> ${rootFolder || cloudinaryFolder}`);
            try {
                // We ALWAYS add to manifest first so Local Portal works without Cloudinary
                if (!galleryManifest[charName][type].includes(publicId)) {
                    galleryManifest[charName][type].push(publicId);
                }

                await cloudinary.uploader.upload(fullPath, {
                    public_id: publicId,
                    folder: rootFolder || cloudinaryFolder,
                    overwrite: true,
                    resource_type: 'image',
                });
            } catch (err) {
                console.warn(`⚠️ Local entry kept, but Cloudinary sync failed for ${file}:`, err.message);
            }
        }
    }
};

// Extracts character name from folder like "03.02.03.01_Mita" -> "Mita"
const extractCharName = (folderName) => {
    const parts = folderName.split('_');
    return parts.slice(1).join('_'); // Everything after the numeric ID
};

const runSync = async () => {
    console.log('--- Starting Auto-Discovery Cloudinary Sync (HD-Priority) ---');

    for (const category of CHAR_CATEGORY_FOLDERS) {
        const categoryPath = path.join(BASE_ART_PATH, category.folder);
        if (!fs.existsSync(categoryPath)) {
            console.warn(`⚠️ Category folder not found: ${category.folder}`);
            continue;
        }

        const charFolders = fs.readdirSync(categoryPath).filter(f => {
            const full = path.join(categoryPath, f);
            return fs.lstatSync(full).isDirectory() && /^\d+\.\d+/.test(f) && !f.includes('SSoT');
        });

        for (const charFolder of charFolders) {
            const charName = extractCharName(charFolder);
            const charPath = path.join(categoryPath, charFolder);
            console.log(`📂 Processing [${category.importance}]: ${charName}`);

            if (!galleryManifest[charName]) {
                galleryManifest[charName] = { SD: [], HD: [], importance: category.importance };
            }
            galleryManifest[charName].importance = category.importance;

            const subFolders = fs.readdirSync(charPath);

            // ── Aprobados (includes nested 03.50_Material_Web) ───────────────
            const approvedSub = subFolders.find(f => f.includes('_Aprobados'));
            if (approvedSub) {
                await syncFolder(path.join(charPath, approvedSub), `AltosMares/${charName}/SD`, charName, 'SD');
            }

            // ── Material_HD (includes nested 04.50_Material_Web) ─────────────
            // Sync HD first to build the HD id set for priority check
            const hdSub = subFolders.find(f => f.includes('_Material_HD'));
            if (hdSub) {
                await syncFolder(path.join(charPath, hdSub), `AltosMares/${charName}/HD`, charName, 'HD');
            }

            // ── HD Priority: remove from SD any publicId that already has an HD copy ──
            // This prevents serving a Web-quality asset when an HD version is already on Cloudinary
            if (galleryManifest[charName].HD.length > 0) {
                const hdSet = new Set(galleryManifest[charName].HD);
                const before = galleryManifest[charName].SD.length;
                galleryManifest[charName].SD = galleryManifest[charName].SD.filter(id => {
                    // Compare by the descriptive suffix (after the numeric prefix)
                    // e.g. "Mita_Hero_1-1_PoseA_v01" should match regardless of 03.50 vs 04.50 prefix
                    const label = id.replace(/^\d[\d.]*_/, '');
                    const hasHd = [...hdSet].some(hdId => hdId.replace(/^\d[\d.]*_/, '') === label);
                    return !hasHd;
                });
                const removed = before - galleryManifest[charName].SD.length;
                if (removed > 0) {
                    console.log(`  ⭐ HD-Priority: ${removed} Web asset(s) superseded by HD for ${charName}`);
                }
            }
        }
    }

    const manifestPath = path.join(__dirname, '../src/core/gallery_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(galleryManifest, null, 2));
    console.log(`✅ Gallery manifest generated at: ${manifestPath}`);
    console.log(`✅ ${Object.keys(galleryManifest).length} characters indexed.`);
    console.log('--- Sync Completed ---');
};

runSync();

