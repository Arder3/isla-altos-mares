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
  //    Supports 6-segment IDs (XX.XX.XX.XX.XX.CC) AND
  //             7-segment IDs (XX.XX.XX.XX.XX.XX.CC) — e.g. after Material_Web migration
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

  // 9. ENTITY/CHARACTER TAGS — extract char name from path
  //    Pattern: XX.XX.XX.NN_CharName (4th level entity folder)
  const charFolderMatch = rel.match(/\d{2}\.\d{2}\.\d{2}\.\d{2}_([^/]+)/);
  if (charFolderMatch) {
    tags.add(`entity:${charFolderMatch[1].toLowerCase()}`);
  }

  // 10. CONTENT:HERO TAG for Material_Web
  if (rel.includes('Material_Web')) {
    tags.add('content:hero');
  }

  return [...tags].sort();
}

// ──────────────────────────────────────────────────
// HD PRIORITY RESOLVER
// ──────────────────────────────────────────────────
// If a file lives in XX.03.50_Material_Web, check if its homolog
// exists in XX.04.50_Material_Web. If so, tag it with status:hd_disponible
// and store hd_path so the portal can serve the HD version automatically.

function resolveHdPath(absolutePath) {
  const rel = absolutePath.replace(/\\/g, '/');
  // Detect if this file is inside a 03.50_Material_Web subtree
  if (!rel.includes('.03.50_Material_Web')) return null;

  // Build the homolog HD path:
  // 1. Jump from _Aprobados to _Material_HD tree
  // 2. Change version segment 03.50 to 04.50
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

// ──────────────────────────────────────────────────
// CRAWLER
// ──────────────────────────────────────────────────

function humanName(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  // Remove numeric prefix like "03.02.03.01_" or "01.06.02_"
  return base.replace(/^\d[\d.]*_/, '').replace(/_/g, ' ');
}

const manifest = [];
let scanned = 0;
let indexed = 0;
let hdResolved = 0;

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
      const tags = deriveTags(full);
      indexed++;

      // HD Priority Resolution
      const hdPath = resolveHdPath(full);
      if (hdPath) {
        tags.push('status:hd_disponible');
        tags.sort();
        hdResolved++;
      }

      const entry_obj = {
        id:     rel,
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

// ──────────────────────────────────────────────────
// RUN
// ──────────────────────────────────────────────────

console.log('--- Building Local File Manifest ---');
crawl(BASE);

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`✅ Scanned: ${scanned} files, Indexed: ${indexed} files`);
console.log(`✅ Manifest written to: ${OUT}`);
console.log('--- Done ---');
