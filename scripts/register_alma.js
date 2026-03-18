import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerAlma(email, password) {
  try {
    console.log(`📡 Connecting to Supabase at ${supabaseUrl}...`);
    console.log(`📧 Registering Alma (${email})...`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          rol: 'kids',
          nombre_display: 'Alma',
          tipo_invitacion: 'kids'
        }
      }
    });

    if (error) {
      console.error('❌ Error registering Alma:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Alma registered successfully!');
      console.log('🆔 User ID:', data.user.id);
      console.log('👤 Role: kids');
      process.exit(0);
    }
  } catch (err) {
    console.error('💥 Unexpected crash during registration:', err);
    process.exit(1);
  }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/register_alma.js <email> <password>');
} else {
  registerAlma(args[0], args[1]);
}
