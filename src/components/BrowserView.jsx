import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Grid, List, FileImage, FileVideo, FileText, FileSpreadsheet, SlidersHorizontal, ZoomIn } from 'lucide-react';
import { getTranslation as t } from '../core/i18n';
import { MODULE_REGISTRY } from '../core/registry';
import { getCloudinaryThumbnail, resolveAssetUrl } from '../core/AssetResolver';
import galleryManifest from '../core/gallery_manifest.json';
import localManifest from '../core/local_manifest.json';

// Derive character name lists from registry (single source of truth)
const ALL_CHARS = Object.values(MODULE_REGISTRY);
const CHAR_NAMES_BY_TYPE = {
  Principal:  ALL_CHARS.filter(c => c.type === 'Principal').map(c => ({ id: `char:name:${c.id}`, label: c.name, regId: c.id })),
  Secundario: ALL_CHARS.filter(c => c.type === 'Secundario').map(c => ({ id: `char:name:${c.id}`, label: c.name, regId: c.id })),
  NPC:        ALL_CHARS.filter(c => c.type === 'NPC').map(c => ({ id: `char:name:${c.id}`, label: c.name, regId: c.id })),
};

// ─────────────────────────────────────────────
// TAXONOMY — Single source of truth for filters
// ─────────────────────────────────────────────

const AREAS = [
  { id: 'area:gestion',    es: 'Gestión',  en: 'Management' },
  { id: 'area:referencia', es: 'Referencia', en: 'References' },
  { id: 'area:universo',   es: 'Universo',  en: 'Universe' },
  { id: 'area:proyectos',  es: 'Proyectos', en: 'Projects' },
];

const AREA_SUB = [
  { id: 'area:flujos',    es: 'Flujos',    en: 'Workflows' },
  { id: 'area:matrices',  es: 'Matrices',  en: 'Matrices' },
  { id: 'area:plantillas',es: 'Plantillas',en: 'Templates' },
  { id: 'area:narrativa', es: 'Narrativa', en: 'Narrative' },
  { id: 'area:arte',      es: 'Arte',      en: 'Art' },
];

const STATUS_TYPES = [
  { id: 'status:aprobado', es: 'Aprobado',  en: 'Approved' },
  { id: 'status:proceso',  es: 'En Proceso',en: 'In Process' },
  { id: 'status:boceto',   es: 'Boceto',    en: 'Sketch' },
  { id: 'status:hd',       es: 'HD',        en: 'HD' },
  { id: 'status:web',      es: 'Web',       en: 'Web' },
];

const DOC_DETAIL_TYPES = [
  { id: 'type:ssot',     es: 'SSoT',     en: 'SSoT' },
  { id: 'type:plantilla',es: 'Plantilla',en: 'Template' },
  { id: 'type:listado',  es: 'Listado',  en: 'List' },
  { id: 'type:matriz',   es: 'Matriz',   en: 'Matrix' },
];

const DOC_TYPES = [
  { id: 'doc:imagen', es: 'Imagen', en: 'Image', icon: FileImage, subtypes: ['jpeg', 'png', 'webp', 'psd'] },
  { id: 'doc:video', es: 'Video', en: 'Video', icon: FileVideo, subtypes: ['mp4', 'mov', 'gif'] },
  { id: 'doc:texto', es: 'Texto', en: 'Text', icon: FileText, subtypes: ['md', 'pdf', 'txt'] },
  { id: 'doc:calculo', es: 'Cálculo', en: 'Spreadsheet', icon: FileSpreadsheet, subtypes: ['xlsx', 'csv'] },
];

const OBJ_TYPES = [
  { id: 'obj:personaje', es: 'Personaje', en: 'Character' },
  { id: 'obj:locacion', es: 'Locación', en: 'Location' },
  { id: 'obj:objeto', es: 'Objeto', en: 'Prop' },
  { id: 'obj:escenografia', es: 'Escenografía', en: 'Set Piece' },
  { id: 'obj:vehiculo', es: 'Vehículo', en: 'Vehicle' },
];

const CHAR_IMPORTANCE = [
  { id: 'char:principal', es: 'Principal', en: 'Main' },
  { id: 'char:secundario', es: 'Secundario', en: 'Secondary' },
  { id: 'char:npc', es: 'NPC', en: 'NPC' },
];

const CHAR_CONTENT = [
  { id: 'content:concepto_general', es: 'Concepto General', en: 'General Concept' },
  { id: 'content:pose_referencia', es: 'Pose / Referencia', en: 'Reference Pose' },
  { id: 'content:ref_facial', es: 'Referencia Facial', en: 'Facial Reference' },
  { id: 'content:turnaround_rostro', es: 'Turnaround Rostro', en: 'Facial Turnaround' },
  { id: 'content:turnaround_cuerpo', es: 'Turnaround Cuerpo', en: 'Body Turnaround' },
  { id: 'content:expresiones', es: 'Expresiones', en: 'Expressions' },
  { id: 'content:gestos', es: 'Gestos', en: 'Gestures' },
  { id: 'content:vestuario', es: 'Vestuario', en: 'Wardrobe' },
  { id: 'content:acting', es: 'Acting', en: 'Acting' },
  { id: 'content:detalles', es: 'Detalles', en: 'Details' },
];

const VEHICLE_CONTENT = [
  { id: 'content:concepto_general', es: 'Concepto General', en: 'General Concept' },
  { id: 'content:turnaround_cuerpo', es: 'Turnaround Lateral', en: 'Side Turnaround' },
  { id: 'content:vista_superior', es: 'Vista Superior', en: 'Top View' },
  { id: 'content:plano_tecnico', es: 'Plano Técnico', en: 'Technical Drawing' },
  { id: 'content:detalles', es: 'Detalles', en: 'Details' },
];

const ANGLES = [
  { id: 'angle:frontal', es: 'Frontal', en: 'Front' },
  { id: 'angle:posterior', es: 'Posterior', en: 'Back' },
  { id: 'angle:lateral_derecho', es: 'Lat. Derecho', en: 'Right Side' },
  { id: 'angle:lateral_izquierdo', es: 'Lat. Izquierdo', en: 'Left Side' },
  { id: 'angle:3q_frontal_derecho', es: '3/4 F. Der.', en: '3/4 F. Right' },
  { id: 'angle:3q_frontal_izquierdo', es: '3/4 F. Izq.', en: '3/4 F. Left' },
  { id: 'angle:3q_posterior_derecho', es: '3/4 P. Der.', en: '3/4 B. Right' },
  { id: 'angle:3q_posterior_izquierdo', es: '3/4 P. Izq.', en: '3/4 B. Left' },
  { id: 'angle:superior', es: 'Superior', en: 'Top' },
];

// ─────────────────────────────────────────────
// ID TAXONOMY PARSER
// ID structure: XX.XX.XX.YY.ZZ.CC.NN_Label_Label
//   Segment 5 (ZZ=03) = Aprobados, (ZZ=04) = HD
//   Segment 6 (CC)    = content code   03.XX=Aprobados sub
// ─────────────────────────────────────────────

// Mapping from 6th numeric segment to content filter tag
const CONTENT_MAP = {
  '01': 'content:concepto_general',
  '02': 'content:pose_referencia',
  '03': 'content:concepto_general',   // generic concept variants
  '08': 'content:ref_facial',
  '09': 'content:turnaround_cuerpo',
  '10': 'content:turnaround_rostro',
  '11': 'content:ref_facial',
  '12': 'content:expresiones',
  '13': 'content:actuacion',
  '14': 'content:gestos',             // acting / gestures
  '05': 'content:actuacion',          // hero / acting poses
};

// Mapping from label words in filename to angle filter tags
const ANGLE_KEYWORDS = [
  { re: /frontal/i,           tag: 'angle:frontal' },
  { re: /posterior/i,         tag: 'angle:posterior' },
  { re: /lateral_derech/i,    tag: 'angle:lateral_derecho' },
  { re: /lateral_izquierd/i,  tag: 'angle:lateral_izquierdo' },
  { re: /lateral/i,           tag: 'angle:lateral_derecho' },
  { re: /34_frontal_derech|frontal_derech/i, tag: 'angle:3q_frontal_derecho' },
  { re: /34_frontal_izquierd|frontal_izquierd/i, tag: 'angle:3q_frontal_izquierdo' },
  { re: /34_posterior_derech|posterior_derech/i, tag: 'angle:3q_posterior_derecho' },
  { re: /34_posterior_izquierd|posterior_izquierd/i, tag: 'angle:3q_posterior_izquierdo' },
  { re: /34|3_4/i,            tag: 'angle:3q_frontal_derecho' },
];

// Looks up character importance from MODULE_REGISTRY by name
const getImportanceTag = (charName, manifestImportance) => {
  // First try the manifest importance field (new format)
  if (manifestImportance) {
    return `char:${manifestImportance.toLowerCase()}`;
  }
  // Fallback: search MODULE_REGISTRY by name
  const entry = Object.values(MODULE_REGISTRY).find(c => c.name === charName);
  if (!entry) return null;
  return `char:${entry.type.toLowerCase()}`;
};

const getRegistryId = (charName) => {
  const entry = Object.values(MODULE_REGISTRY).find(c => c.name === charName);
  return entry ? entry.id : null;
};

// Main parser: turns a manifest entry into a Browser asset with full tag set
const parseManifestId = (publicId, charName, type, manifestImportance) => {
  // publicId example: "03.02.03.01.03.10.01_Frontal"
  const [numericPart, ...labelParts] = publicId.split('_');
  const label = labelParts.join('_');
  const segments = numericPart.split('.');

  const tags = ['area:arte', 'doc:imagen', 'obj:personaje'];

  const importanceTag = getImportanceTag(charName, manifestImportance);
  if (importanceTag) tags.push(importanceTag);

  const regId = getRegistryId(charName);
  if (regId) tags.push(`char:name:${regId}`);

  const contentSeg = segments[5]; // 6th segment (0-indexed)
  const contentTag = CONTENT_MAP[contentSeg];
  if (contentTag) tags.push(contentTag);

  // Detect angle from label
  const isTurnaround = contentTag === 'content:turnaround_cuerpo' || contentTag === 'content:turnaround_rostro';
  if (isTurnaround || contentTag === 'content:expresiones') {
    for (const { re, tag } of ANGLE_KEYWORDS) {
      if (re.test(publicId)) { tags.push(tag); break; }
    }
  }

  // Format format (png assumed for all synced images)
  const format = 'png';

  const humanLabel = label.replace(/_/g, ' ');
  const name = `${charName} · ${humanLabel || numericPart}`;

  // IMPORTANT: The id must be the full publicId (including labels) for Cloudinary to find it
  return { id: publicId, name, char: charName, tags, format, status: type.toLowerCase() };
};

// Build the full asset list from the manifest — **zero hardcoded entries**
const buildAssetsFromManifest = (manifest) => {
  if (!manifest) return [];
  const assets = [];
  Object.entries(manifest).forEach(([charName, data]) => {
    const importance = data.importance || null;
    const processIds = (ids, type) => {
      ids.forEach(id => {
        assets.push(parseManifestId(id, charName, type, importance));
      });
    };
    processIds(data.SD || [], 'SD');
    processIds(data.HD || [], 'HD');
  });
  return assets;
};

// ─────────────────────────────────────────────
// FILTER BUTTON
// ─────────────────────────────────────────────

function FilterBtn({ label, active, onClick, accent = false }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border whitespace-nowrap"
      style={active
        ? accent
          ? { background: '#6366f1', borderColor: '#6366f1', color: '#fff' }
          : { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'var(--accent-invert)' }
        : { borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }
      }
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// LIGHTBOX
// ─────────────────────────────────────────────

function Lightbox({ asset, onClose }) {
  if (!asset) return null;
  const isHd = asset.status === 'hd' || asset.tags?.includes('status:hd');
  const fullUrl = resolveAssetUrl(asset.id, asset.char || 'Unknown', isHd ? 'HD' : 'SD');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
        <X size={24} />
      </button>
      <motion.img
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        src={fullUrl}
        alt={asset.name}
        className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
        onError={e => { e.target.src = ''; e.target.style.display='none'; }}
      />
      <div className="mt-4 text-center">
        <p className="text-white font-bold text-sm">{asset.name}</p>
        <p className="text-white/40 font-mono text-[10px] mt-1 uppercase tracking-widest">{asset.id}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ASSET CARD
// ─────────────────────────────────────────────

function AssetCard({ asset, lang, onOpen }) {
  const [thumbError, setThumbError] = useState(false);
  const isImage = ['png','jpg','jpeg','webp','psd'].includes(asset.format);
  const isHd = asset.status === 'hd' || asset.tags?.includes('status:hd');
  const thumbUrl = isImage && asset.char
    ? getCloudinaryThumbnail(asset.id, asset.char, isHd ? 'HD' : 'SD')
    : null;

  const statusColor = {
    hd: 'bg-indigo-500',
    aprobado: 'bg-emerald-500',
    web: 'bg-emerald-500',
    proceso: 'bg-amber-400',
    activo: 'bg-sky-400',
  }[asset.status] || 'bg-zinc-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      onClick={() => onOpen(asset)}
      className="group relative bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-indigo-400 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-indigo-900/20"
    >
      {/* Thumbnail area */}
      <div className="aspect-square bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden">
        {thumbUrl && !thumbError ? (
          <img
            src={thumbUrl}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setThumbError(true)}
          />
        ) : (
          <span className="text-4xl opacity-20">{isImage ? '🖼️' : '📄'}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="text-white text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
            <ZoomIn size={10} /> Abrir
          </span>
        </div>
        {/* Format badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-full text-[8px] font-mono uppercase tracking-widest text-white/70 border border-white/10">
          {asset.format}
        </span>
        {/* Status dot */}
        <span className={`absolute top-2 left-2 w-2 h-2 rounded-full ${statusColor}`} title={asset.status} />
        {/* HD Available badge */}
        {asset.hd_path && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-indigo-500/90 backdrop-blur rounded text-[7px] font-bold uppercase tracking-widest text-white shadow-lg">
            ⭐ HD Disponible
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[var(--text-primary)] text-xs font-bold leading-tight line-clamp-2">{asset.name}</p>
        <p className="text-[var(--text-dim)] text-[9px] font-mono mt-1 uppercase tracking-widest">{asset.id}</p>
        {/* Tags preview */}
        <div className="flex flex-wrap gap-1 mt-2">
          {asset.tags.filter(tag => !tag.startsWith('char:name')).slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-primary)] rounded text-[8px] font-mono text-[var(--text-secondary)] border border-[var(--border-secondary)]">
              {tag.split(':')[1]}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// ACTIVE FILTER CHIPS
// ─────────────────────────────────────────────

function ActiveChips({ active, onRemove, lang }) {
  if (active.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {active.map(f => (
        <span key={f} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full text-[10px] font-mono tracking-widest text-indigo-300">
          {f.split(':')[1]}
          <button onClick={() => onRemove(f)} className="hover:text-white transition-colors"><X size={10} /></button>
        </span>
      ))}
      <button onClick={() => active.forEach(onRemove)} className="text-[var(--text-dim)] text-[10px] font-mono hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">
        Limpiar todo
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// FILTER ROW
// ─────────────────────────────────────────────

function FilterRow({ label, filters, active, onToggle, lang, accent }) {
  const labelKey = lang === 'en' ? 'en' : 'es';
  return (
    <div className="flex gap-3 items-start">
      <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20 mt-1.5 flex-shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <FilterBtn
            key={f.id}
            label={f[labelKey]}
            active={active.includes(f.id)}
            onClick={() => onToggle(f.id)}
            accent={accent}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BROWSER VIEW — Main Component
// ─────────────────────────────────────────────

export default function BrowserView({ lang, onBack }) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [lightboxAsset, setLightboxAsset] = useState(null);

  // Safely build all assets — Cloudinary gallery + local project files
  const allAssets = useMemo(() => {
    const cloudinaryAssets = buildAssetsFromManifest(galleryManifest);
    // Local manifest: already has tags, just need to ensure required fields
    const localAssets = (localManifest || []).map(f => ({
      ...f,
      status: f.tags.includes('status:hd') ? 'hd'
            : f.tags.includes('status:web') ? 'web'
            : 'local',
      hd_path: f.hd_path || null,
      thumb: null, 
      cloudUrl: null,
    }));
    return [...cloudinaryAssets, ...localAssets];
  }, []);

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      if (prev.includes(id)) {
        // Remove this filter and any children (e.g. removing obj:personaje removes char:* and content:* and angle:*)
        const prefixesToClear = getChildPrefixes(id);
        return prev.filter(f => f !== id && !prefixesToClear.some(p => f.startsWith(p)));
      }
      return [...prev, id];
    });
  };

  const removeFilter = (id) => {
    setActiveFilters(prev => {
      const prefixesToClear = getChildPrefixes(id);
      return prev.filter(f => f !== id && !prefixesToClear.some(p => f.startsWith(p)));
    });
  };

  // Contextual logic
  const hasPersonaje = activeFilters.includes('obj:personaje');
  const hasVehiculo = activeFilters.includes('obj:vehiculo');
  const hasTurnaround = activeFilters.includes('content:turnaround_rostro') || activeFilters.includes('content:turnaround_cuerpo');
  const hasDocImagen = activeFilters.includes('doc:imagen');
  const hasDocVideo = activeFilters.includes('doc:video');
  const hasDocTexto = activeFilters.includes('doc:texto');
  const hasDocCalculo = activeFilters.includes('doc:calculo');
  const hasAreaSub = activeFilters.some(f => ['area:gestion','area:referencia','area:universo','area:proyectos'].includes(f));

  // Which importance classes are active (for name sub-filter)
  const activeImportance = [
    activeFilters.includes('char:principal') ? 'Principal' : null,
    activeFilters.includes('char:secundario') ? 'Secundario' : null,
    activeFilters.includes('char:npc') ? 'NPC' : null,
  ].filter(Boolean);

  // Names to show: if importance selected → only those, else all chars
  const visibleCharNames = hasPersonaje
    ? (activeImportance.length > 0
        ? activeImportance.flatMap(t => CHAR_NAMES_BY_TYPE[t] || [])
        : Object.values(CHAR_NAMES_BY_TYPE).flat())
    : [];

  const activeDocSubtypes = DOC_TYPES.filter(d => activeFilters.includes(d.id));

  // Filtered assets
  const filtered = useMemo(() => {
    return allAssets.filter(asset => {
      const matchSearch = !search || asset.name.toLowerCase().includes(search.toLowerCase()) || asset.id.includes(search);
      const matchFilters = activeFilters.length === 0 || activeFilters.every(f => asset.tags.includes(f));
      return matchSearch && matchFilters;
    });
  }, [allAssets, search, activeFilters]);

  const labelEs = (arr) => arr.map(f => f.es).join(' · ');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxAsset && <Lightbox asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors mb-6 group text-xs font-mono uppercase tracking-widest">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Portal
        </button>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter">Browser</h1>
            <p className="text-[var(--text-dim)] font-mono text-xs mt-1 uppercase tracking-widest">
              {lang === 'en' ? 'Assets · Gallery · Explorer' : 'Assets · Galería · Explorador'}
            </p>
          </div>
          {/* View mode */}
          <div className="flex gap-1 bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--accent-primary)] text-[var(--accent-invert)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}><Grid size={14} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-[var(--accent-invert)]' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
        <input
          type="text"
          placeholder={lang === 'en' ? 'Search by name, ID or tag...' : 'Busca por nombre, ID o etiqueta...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--surface-card)] border border-[var(--border-primary)] rounded-xl pl-10 pr-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--text-secondary)] transition-colors text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* FILTERS PANEL */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-secondary)] rounded-2xl p-5 mb-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={13} className="text-[var(--text-dim)]" />
          <span className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest">
            {lang === 'en' ? 'Filters' : 'Filtros'}
          </span>
        </div>

        {/* LEVEL 1 — Always visible */}
        <FilterRow
          label={lang === 'en' ? 'Area' : 'Área'}
          filters={AREAS}
          active={activeFilters}
          onToggle={toggleFilter}
          lang={lang}
        />

        {/* Area sub-types — appear when any area is selected */}
        <AnimatePresence>
          {hasAreaSub && (
            <motion.div key="area-sub" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="border-l-2 border-sky-500/30 pl-4">
                <FilterRow label={lang === 'en' ? 'Sub-area' : 'Sub-área'} filters={AREA_SUB} active={activeFilters} onToggle={toggleFilter} lang={lang} accent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FilterRow
          label={lang === 'en' ? 'Status' : 'Estado'}
          filters={STATUS_TYPES}
          active={activeFilters}
          onToggle={toggleFilter}
          lang={lang}
        />
        <FilterRow
          label={lang === 'en' ? 'Doc Type' : 'Tipo Doc'}
          filters={DOC_TYPES}
          active={activeFilters}
          onToggle={toggleFilter}
          lang={lang}
        />

        {/* Doc detail types — SSoT, Plantilla etc */}
        <AnimatePresence>
          {(hasDocTexto || hasDocCalculo) && (
            <motion.div key="doc-detail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="border-l-2 border-violet-500/30 pl-4">
                <FilterRow label={lang === 'en' ? 'Doc Kind' : 'Tipo'} filters={DOC_DETAIL_TYPES} active={activeFilters} onToggle={toggleFilter} lang={lang} accent />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FilterRow
          label={lang === 'en' ? 'Object' : 'Objeto'}
          filters={OBJ_TYPES}
          active={activeFilters}
          onToggle={toggleFilter}
          lang={lang}
        />

        {/* LEVEL 2 — Doc subtypes */}
        <AnimatePresence>
          {activeDocSubtypes.length > 0 && activeDocSubtypes.map(docType => (
            <motion.div
              key={docType.id + ':subtypes'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-3 items-start pt-1">
                <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20 mt-1.5 flex-shrink-0 opacity-60">{docType[lang === 'en' ? 'en' : 'es']} →</span>
                <div className="flex flex-wrap gap-2">
                  {docType.subtypes.map(sub => (
                    <FilterBtn
                      key={sub}
                      label={sub}
                      active={activeFilters.includes(`fmt:${sub}`)}
                      onClick={() => toggleFilter(`fmt:${sub}`)}
                      accent
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* LEVEL 2 — Character subfilters */}
        <AnimatePresence>
          {hasPersonaje && (
            <motion.div
              key="char-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 pt-1"
            >
              <div className="border-l-2 border-indigo-500/30 pl-4 space-y-3">
                <FilterRow
                  label={lang === 'en' ? 'Importance' : 'Importancia'}
                  filters={CHAR_IMPORTANCE}
                  active={activeFilters}
                  onToggle={toggleFilter}
                  lang={lang}
                  accent
                />

                {/* Character name sub-filter — contextual by importance */}
                <AnimatePresence>
                  {visibleCharNames.length > 0 && (
                    <motion.div
                      key="char-names"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-3 items-start">
                        <span className="text-[var(--text-dim)] font-mono text-[9px] uppercase tracking-widest w-20 mt-1.5 flex-shrink-0">
                          {lang === 'en' ? 'Name' : 'Nombre'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {visibleCharNames.map(c => (
                            <FilterBtn
                              key={c.id}
                              label={c.label}
                              active={activeFilters.includes(c.id)}
                              onClick={() => toggleFilter(c.id)}
                              accent
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <FilterRow
                  label={lang === 'en' ? 'Content' : 'Contenido'}
                  filters={CHAR_CONTENT}
                  active={activeFilters}
                  onToggle={toggleFilter}
                  lang={lang}
                  accent
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LEVEL 2 — Vehicle subfilters */}
        <AnimatePresence>
          {hasVehiculo && (
            <motion.div
              key="vehicle-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <div className="border-l-2 border-amber-500/30 pl-4">
                <FilterRow
                  label={lang === 'en' ? 'Content' : 'Contenido'}
                  filters={VEHICLE_CONTENT}
                  active={activeFilters}
                  onToggle={toggleFilter}
                  lang={lang}
                  accent
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LEVEL 3 — Angle subfilters */}
        <AnimatePresence>
          {hasTurnaround && (
            <motion.div
              key="angle-filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-1"
            >
              <div className="border-l-2 border-emerald-500/30 pl-4">
                <FilterRow
                  label={lang === 'en' ? 'Angle' : 'Ángulo'}
                  filters={ANGLES}
                  active={activeFilters}
                  onToggle={toggleFilter}
                  lang={lang}
                  accent
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active filter chips */}
      <ActiveChips active={activeFilters} onRemove={removeFilter} lang={lang} />

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[var(--text-dim)] font-mono text-[10px] uppercase tracking-widest">
          {filtered.length} {lang === 'en' ? 'assets' : 'assets'}
          {activeFilters.length > 0 ? ` · ${activeFilters.length} ${lang === 'en' ? 'filters active' : 'filtros activos'}` : ''}
        </p>
      </div>

      {/* GRID */}
      {filtered.length > 0 ? (
        <motion.div layout className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1'}`}>
          <AnimatePresence>
            {filtered.map(asset => (
              <AssetCard key={asset.id} asset={asset} lang={lang} onOpen={setLightboxAsset} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-[var(--text-dim)] font-mono text-xs uppercase tracking-widest">
            {lang === 'en' ? 'No assets match these filters' : 'Ningún asset coincide con estos filtros'}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper: given a parent filter ID, return what child prefixes to clear
function getChildPrefixes(id) {
  if (id === 'obj:personaje') return ['char:', 'content:', 'angle:'];
  if (id === 'obj:vehiculo') return ['content:', 'angle:'];
  if (id === 'char:principal' || id === 'char:secundario' || id === 'char:npc') return ['char:name:'];
  if (id.startsWith('content:turnaround')) return ['angle:'];
  if (id.startsWith('doc:')) return ['fmt:', 'type:'];
  if (['area:gestion','area:referencia','area:universo','area:proyectos'].includes(id)) return ['area:flujos','area:matrices','area:plantillas','area:narrativa','area:arte'];
  return [];
}
