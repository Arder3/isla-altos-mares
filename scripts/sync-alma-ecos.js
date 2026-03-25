import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ASSETS_DIR = path.join(__dirname, '../public/assets/alma_designs');
const REGISTRY_PATH = path.join(__dirname, '../src/core/alma_registry.json');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function syncAlmaEcos() {
  try {
    console.log('📡 Fetching approved ecos from Supabase...');
    
    // Fetch materialized drafts
    const { data: drafts, error } = await supabase
      .from('character_drafts')
      .select('*')
      .eq('status', 'materializado');

    if (error) throw error;

    console.log(`✅ Found ${drafts.length} materialized ecos.`);

    const registry = [];

    for (const draft of drafts) {
      const metadata = draft.current_metadata || {};
      const imageUrl = metadata.final_image_url;
      
      if (imageUrl) {
        const filename = `${draft.id}.webp`;
        const localPath = path.join(ASSETS_DIR, filename);
        
        console.log(`📥 Downloading vision for: ${draft.nombre_provisorio || draft.id}...`);
        await downloadImage(imageUrl, localPath);
        
        registry.push({
          id: draft.id,
          name: draft.nombre_provisorio,
          status: draft.status,
          metadata: metadata,
          localAsset: `/assets/alma_designs/${filename}`,
          syncedAt: new Date().toISOString()
        });
      }
    }

    // Write registry
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
    console.log(`✨ Sync complete! Registered ${registry.length} ecos in alma_registry.json`);

  } catch (err) {
    console.error('💥 Sync failed:', err.message);
  }
}

syncAlmaEcos();
