// scripts/create-admin.js - Create admin user in Supabase
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
  console.log('\n🔐 Create Admin User for Maa Saraswati Travels\n');
  
  const email = await question('Email: ');
  const password = await question('Password (min 6 chars): ');
  const fullName = await question('Full Name: ');
  const phone = await question('Phone Number: ');
  
  if (!email || !password || password.length < 6) {
    console.error('❌ Invalid input. Password must be at least 6 characters.');
    process.exit(1);
  }
  
  try {
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    
    if (authError) throw authError;
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        phone,
        full_name: fullName,
        user_type: 'admin',
        is_verified: true,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    
    if (profileError) throw profileError;
    
    console.log(`\n✅ Admin user created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\nYou can now login at: /login`);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();