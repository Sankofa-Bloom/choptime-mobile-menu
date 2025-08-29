/**
 * FIX PRODUCTION DISHES ISSUE
 * Diagnoses and fixes dishes not showing in production
 */

const { createClient } = require('@supabase/supabase-js');

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://qrpukxmzdwkepfpuapzh.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs';

// Development Supabase configuration
const DEV_SUPABASE_URL = 'http://127.0.0.1:54321';
const DEV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function checkEnvironment() {
  console.log('🔍 CHECKING ENVIRONMENT CONFIGURATION');
  console.log('=====================================');

  // Check which environment file is being used
  const fs = require('fs');
  const path = require('path');

  const serverEnvPath = path.join(__dirname, 'server', '.env');

  if (fs.existsSync(serverEnvPath)) {
    const envContent = fs.readFileSync(serverEnvPath, 'utf8');
    const supabaseUrlMatch = envContent.match(/SUPABASE_URL=(.+)/);

    if (supabaseUrlMatch) {
      const currentUrl = supabaseUrlMatch[1].trim();
      console.log(`Current server Supabase URL: ${currentUrl}`);

      if (currentUrl === DEV_SUPABASE_URL) {
        console.log('⚠️  Server is using DEVELOPMENT database!');
        console.log('💡 Should be using PRODUCTION database for production');
        return 'dev';
      } else if (currentUrl === PROD_SUPABASE_URL) {
        console.log('✅ Server is using PRODUCTION database');
        return 'prod';
      } else {
        console.log('❓ Server is using unknown database URL');
        return 'unknown';
      }
    }
  } else {
    console.log('❌ Server .env file not found');
    return 'missing';
  }
}

async function testDatabaseConnection(env) {
  console.log(`\n🔗 TESTING ${env.toUpperCase()} DATABASE CONNECTION`);
  console.log('==========================================');

  const url = env === 'prod' ? PROD_SUPABASE_URL : DEV_SUPABASE_URL;
  const key = env === 'prod' ? PROD_SUPABASE_ANON_KEY : DEV_SUPABASE_ANON_KEY;

  const supabase = createClient(url, key);

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('delivery_fee_settings')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ ${env.toUpperCase()} database connection failed:`, error.message);
      return false;
    }

    console.log(`✅ ${env.toUpperCase()} database connection successful`);

    // Check dishes table
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .limit(5);

    if (dishesError) {
      console.log(`❌ Dishes table error in ${env}:`, dishesError.message);
      return false;
    }

    console.log(`🍽️  Found ${dishes?.length || 0} dishes in ${env} database`);

    // Check active dishes
    const { count: activeCount, error: activeError } = await supabase
      .from('dishes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (activeError) {
      console.log(`❌ Error checking active dishes in ${env}:`, activeError.message);
    } else {
      console.log(`✅ Active dishes in ${env}: ${activeCount || 0}`);
    }

    return true;

  } catch (error) {
    console.log(`❌ ${env.toUpperCase()} database test failed:`, error.message);
    return false;
  }
}

async function createProductionDatabaseTables() {
  console.log('\n🏗️  CREATING PRODUCTION DATABASE TABLES');
  console.log('=======================================');

  const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY);

  // SQL to create tables (simplified version)
  const createTablesSQL = `
    -- Create delivery_fee_settings table
    CREATE TABLE IF NOT EXISTS delivery_fee_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      is_delivery_fee_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE delivery_fee_settings ENABLE ROW LEVEL SECURITY;

    -- Create policy
    CREATE POLICY IF NOT EXISTS "Allow all access to delivery fee settings"
      ON delivery_fee_settings FOR ALL USING (true);

    -- Insert default setting
    INSERT INTO delivery_fee_settings (is_delivery_fee_enabled)
    SELECT false WHERE NOT EXISTS (SELECT 1 FROM delivery_fee_settings);

    -- Create dishes table
    CREATE TABLE IF NOT EXISTS dishes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      image_url TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create restaurants table
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      address TEXT,
      phone VARCHAR(20),
      town VARCHAR(100),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create restaurant_menus table
    CREATE TABLE IF NOT EXISTS restaurant_menus (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER REFERENCES restaurants(id),
      dish_id INTEGER REFERENCES dishes(id),
      price DECIMAL(10,2) NOT NULL,
      availability BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  console.log('📄 Running table creation SQL...');
  console.log('Note: You may need to run this manually in Supabase dashboard');

  // For now, just provide the SQL
  console.log('\n📋 COPY AND RUN THIS SQL IN SUPABASE DASHBOARD:');
  console.log('===============================================');
  console.log(createTablesSQL);
  console.log('===============================================');
}

async function seedProductionData() {
  console.log('\n🌱 SEEDING PRODUCTION DATABASE');
  console.log('===============================');

  const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY);

  // Sample dishes data
  const sampleDishes = [
    {
      name: 'Eru with Achu',
      description: 'Traditional Cameroonian dish with fermented cassava leaves and pounded cocoyam',
      price: 2500,
      category: 'Traditional',
      active: true
    },
    {
      name: 'Ndolé with Fried Plantains',
      description: 'Bitterleaf stew with roasted peanuts and fried plantains',
      price: 2200,
      category: 'Traditional',
      active: true
    },
    {
      name: 'Chicken Pepper Soup',
      description: 'Spicy chicken soup with peppers and traditional spices',
      price: 1800,
      category: 'Soups',
      active: true
    },
    {
      name: 'Grilled Fish with Chips',
      description: 'Fresh grilled fish served with French fries and vegetables',
      price: 3000,
      category: 'Seafood',
      active: true
    },
    {
      name: 'Jollof Rice with Chicken',
      description: 'West African rice dish with tender chicken and vegetables',
      price: 2000,
      category: 'Rice Dishes',
      active: true
    }
  ];

  // Sample restaurants
  const sampleRestaurants = [
    {
      name: 'Mama\'s Kitchen',
      description: 'Authentic Cameroonian cuisine since 2010',
      address: 'Mile 2, Limbe',
      phone: '+237670416449',
      town: 'Limbe',
      active: true
    },
    {
      name: 'Coastal Flavors',
      description: 'Fresh seafood and traditional dishes',
      address: 'Down Beach, Limbe',
      phone: '+237677123456',
      town: 'Limbe',
      active: true
    }
  ];

  try {
    console.log('🍽️  Adding sample dishes...');

    const { data: dishesData, error: dishesError } = await supabase
      .from('dishes')
      .insert(sampleDishes)
      .select();

    if (dishesError) {
      console.log('❌ Error adding dishes:', dishesError.message);
    } else {
      console.log(`✅ Added ${dishesData?.length || 0} dishes`);
    }

    console.log('🏪 Adding sample restaurants...');

    const { data: restaurantsData, error: restaurantsError } = await supabase
      .from('restaurants')
      .insert(sampleRestaurants)
      .select();

    if (restaurantsError) {
      console.log('❌ Error adding restaurants:', restaurantsError.message);
    } else {
      console.log(`✅ Added ${restaurantsData?.length || 0} restaurants`);
    }

    // Create menu relationships
    if (dishesData && restaurantsData) {
      console.log('📋 Creating restaurant menus...');

      const menuItems = [];
      dishesData.forEach(dish => {
        restaurantsData.forEach(restaurant => {
          menuItems.push({
            restaurant_id: restaurant.id,
            dish_id: dish.id,
            price: dish.price,
            availability: true
          });
        });
      });

      const { data: menuData, error: menuError } = await supabase
        .from('restaurant_menus')
        .insert(menuItems)
        .select();

      if (menuError) {
        console.log('❌ Error creating menu:', menuError.message);
      } else {
        console.log(`✅ Created ${menuData?.length || 0} menu items`);
      }
    }

  } catch (error) {
    console.log('❌ Error seeding data:', error.message);
  }
}

async function fixServerConfiguration() {
  console.log('\n🔧 FIXING SERVER CONFIGURATION');
  console.log('===============================');

  const fs = require('fs');
  const path = require('path');

  const serverEnvPath = path.join(__dirname, 'server', '.env');

  if (fs.existsSync(serverEnvPath)) {
    let envContent = fs.readFileSync(serverEnvPath, 'utf8');

    // Replace Supabase URLs with production ones
    envContent = envContent.replace(
      /SUPABASE_URL=.*/,
      `SUPABASE_URL=${PROD_SUPABASE_URL}`
    );

    envContent = envContent.replace(
      /SUPABASE_ANON_KEY=.*/,
      `SUPABASE_ANON_KEY=${PROD_SUPABASE_ANON_KEY}`
    );

    // Also replace service role key if it exists
    envContent = envContent.replace(
      /SUPABASE_SERVICE_ROLE_KEY=.*/,
      `SUPABASE_SERVICE_ROLE_KEY=${PROD_SUPABASE_ANON_KEY}`
    );

    fs.writeFileSync(serverEnvPath, envContent);

    console.log('✅ Server configuration updated to use production database');
    console.log('🔄 Restart your server for changes to take effect');

  } else {
    console.log('❌ Server .env file not found');
  }
}

async function main() {
  console.log('🚀 FIXING PRODUCTION DISHES ISSUE');
  console.log('==================================');

  // Step 1: Check current environment
  const currentEnv = await checkEnvironment();

  // Step 2: Test both databases
  console.log('\n📊 TESTING DATABASE CONNECTIONS');
  console.log('================================');

  const devWorking = await testDatabaseConnection('dev');
  const prodWorking = await testDatabaseConnection('prod');

  console.log('\n📋 DIAGNOSIS SUMMARY');
  console.log('====================');

  if (currentEnv === 'dev' && prodWorking) {
    console.log('🎯 ISSUE FOUND: Server is using development database in production!');
    console.log('💡 SOLUTION: Switch server to use production database');

    await fixServerConfiguration();
  } else if (!prodWorking) {
    console.log('🎯 ISSUE FOUND: Production database is not properly configured!');
    console.log('💡 SOLUTION: Set up production database tables and data');

    await createProductionDatabaseTables();
    await seedProductionData();
  } else {
    console.log('✅ Everything looks good!');
  }

  console.log('\n🎉 FIX COMPLETE!');
  console.log('================');
  console.log('1. If you updated server config, restart the server');
  console.log('2. If you ran SQL, wait for tables to be created');
  console.log('3. If you seeded data, dishes should now appear');
  console.log('4. Test your production app - dishes should now display!');
}

// Run the fix
main().catch(console.error);