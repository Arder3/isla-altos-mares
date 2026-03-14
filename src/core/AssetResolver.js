/**
 * AssetResolver.js
 * Utility to translate project IDs into URLs.
 * Hybrid Mode: Prioritizes local files if found in local_manifest.json (via /public junction).
 */

import localManifest from './local_manifest.json';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const getLocalPath = (id) => {
    // 1. Check local manifest first (Hybrid Mode)
    // We search by fileId (original filename without extension) OR by original name
    const localEntry = localManifest.find(m => m.fileId === id || m.name === id);
    if (localEntry && localEntry.path) {
        // Robust path splitting (handles \ and /)
        const normalizedPath = localEntry.path.replace(/\\/g, '/');
        const parts = normalizedPath.split('/03_Universo/');
        if (parts.length > 1) {
            return `/03_Universo/${parts[1]}`;
        }
    }
    return null;
};

export const resolveAssetUrl = (id, charName, type = 'SD') => {
    // Only use local fallback in development mode (localhost)
    if (import.meta.env.DEV) {
        const local = getLocalPath(id);
        if (local) return local;
    }

    // Always use Cloudinary in production (Vercel)
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/AltosMares/${charName}/${type}/${id}`;
};

export const getCloudinaryThumbnail = (id, charName, type = 'SD') => {
    // Only use local fallback in development mode (localhost)
    if (import.meta.env.DEV) {
        const local = getLocalPath(id);
        if (local) return local;
    }

    // Always use Cloudinary Thumbnail in production
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_thumb,w_200,g_face/v1/AltosMares/${charName}/${type}/${id}`;
};
