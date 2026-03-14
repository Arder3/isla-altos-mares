/**
 * build-local-manifest.cjs
 *
 * Crawls the ENTIRE project folder structure and builds local_manifest.json.
 * Each file gets automatically tagged based on the rules in tag_taxonomy.json.
 *
 * Run with: npm run build-manifest
 */

const fs   = require('fs');
const path = require('path');
require('dotenv').config();

// ──────────────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────────────

const BASE  = 'c:/Users/Ariel Deyá/Documents/Isla de Altos Mares/isla de altos mares 4.0';
const OUT   = path.join(__dirname, '../src/core/local_manifest.json');
const TAX   = path.join(__dirname, '../src/core/tag_taxonomy.json');
const taxonomy = JSON.parse(fs.readFileSync(TAX, 'utf8'));

// Folders to completely skip
const SKIP_DIRS = ['ZZ_Papelera', '.git', 'node_modules', '__pycache__', '.venv'];
// File extensions to include
const INCLUDE_EXT = new Set([
  '.png','.jpg','.jpeg','.webp','.psd',
  '.mp4','.mov','.gif',
  '.md','.txt','.pdf',
  '.csv','.xlsx',
  '.json',
  '.py','.cjs','.js','.jsx'
]);

// ──────────────────────────────────────────────────
// TAG ENGINE
// ──────────────────────────────────────────────────

function deriveTags(absolutePath) {
  const rel  = absolutePath.replace(/\\/g, '/');
  const ext  = path.extname(absolutePath).toLowerCase();
  const base = path.basename(absolutePath, ext);
  const tags = new Set();

  // 1. HIERARCHY TAGS — from folder segments in path
  for (const [segment, segTags] of Object.entries(taxonomy.hierarchyTags)) {
    if (segment.startsWith('_')) continue;
    if (rel.includes(segment)) segTags.forEach(t => tags.add(t));
  }

  // 2. OBJECT TYPE TAGS — from specific type-folder segments
  for (const [segment, segTags] of Object.entries(taxonomy.objectTypeTags)) {
    if (segment.startsWith('_')) continue;
    if (rel.includes(segment)) segTags.forEach(t => tags.add(t));
  }

  // 3. STATUS FOLDER TAGS — from subfolder names
  const segments = rel.split('/');
  for (const seg of segments) {
    for (const [pattern, patTags] of Object.entries(taxonomy.statusFolderTags)) {
      if (pattern.startsWith('_')) continue;
      if (seg.includes(pattern)) patTags.forEach(t => tags.add(t));
    }
  }

  // 4. FILE NAME PATTERN TAGS
  for (const [pattern, patTags] of Object.entries(taxonomy.fileNamePatternTags)) {
    if (pattern.startsWith('_')) continue;
    if (base.toLowerCase().includes(pattern.toLowerCase())) {
      patTags.forEach(t => tags.add(t));
    }
  }

  // 5. EXTENSION TAGS
  const extTags = taxonomy.extensionTags[ext] || [];
  extTags.forEach(t => tags.add(t));

  // 6. CONTENT SEGMENT TAGS
  const numericMatch = base.match(/^(\d{2}\.\d{2}\.\d{2}\.\d{2}(?:\.\d{2})+)\.(\d{2})/);
  if (numericMatch) {
    const contentSeg = numericMatch[2];
    const contentTag = taxonomy.contentSegmentTags[contentSeg];
    if (contentTag) tags.add(contentTag);
  }

  // 7. ANGLE TAGS
  for (const [pattern, tag] of Object.entries(taxonomy.angleTags)) {
    if (pattern.startsWith('_')) continue;
    try {
      if (new RegExp(pattern, 'i').test(base)) { tags.add(tag); }
    } catch(_) {}
  }

  // 8. EXPRESSION TAGS
  for (const [word, tag] of Object.entries(taxonomy.expressionTags)) {
    if (word.startsWith('_')) continue;
    if (base.toLowerCase().includes(word.toLowerCase())) tags.add(tag);
  }

  // 9. ENTITY/CHARACTER TAGS
  const charFolderMatch = rel.match(/\d{2}\.\d{2}\.\d{2}\.\d{2}_([^/]+)/);
  if (charFolderMatch) {
    tags.add(`entity:${charFolderMatch[1].toLowerCase()}`);
  }

  // 10. CONTENT:HERO TAG
  if (rel.includes('Material_Web')) {
    tags.add('content:hero');
  }

  return [...tags].sort();
}

function resolveHdPath(absolutePath) {
  const rel = absolutePath.replace(/\\/g, '/');
  if (!rel.includes('.03.50_Material_Web')) return null;

  const hdRel = rel
    .replace(/\.03_Aprobados/g, '.04_Material_HD')
    .replace(/\.03\.50_Material_Web/g, '.04.50_Material_Web')
    .replace(/\.03\.50\./g, '.04.50.');

  const hdAbs = hdRel.replace(/\//g, path.sep);
  if (fs.existsSync(hdAbs)) {
    return hdRel;
  }
  return null;
}

function humanName(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  // Remove numeric prefix like "03.02.03.01_"
  return base.replace(/^\d[\d.]*_/, '').replace(/_/g, ' ');
}

const manifest = [];
let scanned = 0;
let indexed = 0;

function crawl(dir) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch(_) { return; }

  for (const entry of entries) {
    if (SKIP_DIRS.includes(entry)) continue;
    const full = path.join(dir, entry);
    let stat;
    try { stat = fs.lstatSync(full); } catch(_) { continue; }

    if (stat.isDirectory()) {
      crawl(full);
    } else {
      scanned++;
      const ext = path.extname(entry).toLowerCase();
      if (!INCLUDE_EXT.has(ext)) continue;

      const rel  = full.replace(/\\/g, '/');
      const base = path.basename(entry, ext);
      const tags = deriveTags(full);
      indexed++;

      const hdPath = resolveHdPath(full);
      if (hdPath) {
        tags.push('status:hd_disponible');
        tags.sort();
      }

      const entry_obj = {
        id:     rel,
        fileId: base, // KEEP THE ORIGINAL FILENAME (WITH ID) FOR LOOKUP
        name:   humanName(full),
        path:   rel,
        ext:    ext.replace('.', ''),
        format: ext.replace('.', ''),
        tags,
        size:   stat.size,
        modified: stat.mtime.toISOString().split('T')[0]
      };

      if (hdPath) entry_obj.hd_path = hdPath;
      manifest.push(entry_obj);
    }
  }
}

console.log('--- Building Local File Manifest ---');
crawl(BASE);
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`✅ Scanned: ${scanned} files, Indexed: ${indexed} files`);
console.log(`✅ Manifest written to: ${OUT}`);
console.log('--- Done ---');
