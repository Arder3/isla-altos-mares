/**
 * AssetResolver.js
 * Utility to translate project IDs into Cloudinary URLs.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const resolveAssetUrl = (id, charName, type = 'SD') => {
    // Base folder structure: AltosMares/{Char}/{Type}/{FileName}
    // Example ID: 03.02.03.02.03.14.01_Interaccion_Abeja_Flor

    // Note: we assume Cloudinary public_id matches the numerical part or the full name.
    // In the current sync script, we use path.parse(file).name as public_id.

    // Type: 'SD' or 'HD'
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/AltosMares/${charName}/${type}/${id}`;
};

export const getCloudinaryThumbnail = (id, charName) => {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_thumb,w_200,g_face/v1/AltosMares/${charName}/SD/${id}`;
};
