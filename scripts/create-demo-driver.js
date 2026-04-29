// scripts/create-demo-driver.js - Create demo driver account
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createDemoDriver() {
  console.log('\n🚗 Create Demo Driver Account\n');
  
  const email = await question('Driver Email: ');
  const password = await question('Password: ');
  const fullName = await question('Driver Full Name: ');
  const phone = await question('Phone Number: ');
  const vehicleType = await question('Vehicle Type (bike/auto/sedan/suv/luxury/tempo): ');
  const vehicleNumber = await question('Vehicle Number: ');
  const licenseNumber = await question('License Number: ');
  
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
        user_type: 'driver',
        is_verified: true,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    
    if (profileError) throw profileError;
    
    // Create driver record
    const { error: driverError } = await supabase
      .from('drivers')
      .insert({
        id: authUser.user.id,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.toUpperCase(),
        license_number: licenseNumber,
        is_approved: true,
        is_online: false,
        rating: 5.0,
        total_trips: 0,
        earnings: 0,
        created_at: new Date().toISOString(),
      });
    
    if (driverError) throw driverError;
    
    console.log(`\n✅ Driver created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`\nDriver can login at: /driver/login`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

createDemoDriver();