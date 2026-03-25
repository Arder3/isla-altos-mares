import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the project path
// This is a scratch script for debugging
dotenv.config({ path: 'c:/Users/Ariel Deyá/Documents/Isla de Altos Mares/isla de altos mares 4.0/04_Proyectos/04.02_Portal_Unificado/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAltarTables() {
    console.log("Checking tables...");
    
    const { data: sessions, error: sError } = await supabase
        .from('altar_chat_sessions')
        .select('*')
        .limit(1);
    
    if (sError) {
        console.error("Error fetching sessions (likely table missing):", sError.message);
    } else {
        console.log("altar_chat_sessions exists. Count:", sessions.length);
    }

    const { data: messages, error: mError } = await supabase
        .from('altar_messages_v2')
        .select('*')
        .limit(1);

    if (mError) {
        console.error("Error fetching messages (likely table missing):", mError.message);
    } else {
        console.log("altar_messages_v2 exists. Count:", messages.length);
    }

    const { data: perms, error: pError } = await supabase
        .from('altar_permissions')
        .select('*')
        .limit(1);

    if (pError) {
        console.error("Error fetching permissions (likely table missing):", pError.message);
    } else {
        console.log("altar_permissions exists. Count:", perms.length);
    }
}

checkAltarTables();
