/**
 * VERIFY PRODUCTION FIX
 * Test that dishes are now showing in production
 */

const { createClient } = require('@supabase/supabase-js');

// Production Supabase configuration
const PROD_SUPABASE_URL = 'https://qrpukxmzdwkepfpuapzh.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs';

const supabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY);

async function verifyProductionFix() {
  console.log('🔍 VERIFYING PRODUCTION FIX');
  console.log('===========================');

  try {
    // Step 1: Test database connection
    console.log('\n1️⃣ Testing production database connection...');

    const { data: testData, error: testError } = await supabase
      .from('delivery_fee_settings')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Production database connection failed:', testError.message);
      console.log('💡 Make sure you ran the SQL setup script in Supabase dashboard');
      return;
    }

    console.log('✅ Production database connection successful');

    // Step 2: Check dishes
    console.log('\n2️⃣ Checking dishes in production...');

    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .eq('active', true)
      .limit(10);

    if (dishesError) {
      console.log('❌ Error fetching dishes:', dishesError.message);
      return;
    }

    const dishCount = dishes?.length || 0;
    console.log(`🍽️  Found ${dishCount} active dishes in production`);

    if (dishCount === 0) {
      console.log('❌ No dishes found! Did you run the SQL setup script?');
      console.log('💡 Run: setup-production-database.sql in Supabase dashboard');
      return;
    }

    // Show sample dishes
    console.log('\n📋 Sample dishes:');
    dishes.slice(0, 5).forEach((dish, index) => {
      console.log(`   ${index + 1}. ${dish.name} - ${dish.price} FCFA (${dish.category})`);
    });

    // Step 3: Check restaurants
    console.log('\n3️⃣ Checking restaurants...');

    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, town, active')
      .eq('active', true);

    if (restError) {
      console.log('❌ Error fetching restaurants:', restError.message);
    } else {
      const restaurantCount = restaurants?.length || 0;
      console.log(`🏪 Found ${restaurantCount} active restaurants`);

      if (restaurantCount > 0) {
        restaurants.slice(0, 3).forEach((rest, index) => {
          console.log(`   ${index + 1}. ${rest.name} (${rest.town})`);
        });
      }
    }

    // Step 4: Check menu relationships
    console.log('\n4️⃣ Checking restaurant menus...');

    const { data: menus, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('count', { count: 'exact', head: true })
      .eq('availability', true);

    if (menuError) {
      console.log('❌ Error checking menus:', menuError.message);
    } else {
      console.log(`📋 Found ${menus || 0} available menu items`);
    }

    // Step 5: Test API endpoint (if server is running)
    console.log('\n5️⃣ Testing API endpoint...');

    try {
      const response = await fetch('http://localhost:3001/api/dishes');
      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API working: ${apiData.data?.length || 0} dishes returned via API`);
      } else {
        console.log('⚠️  API not accessible (server may not be running with production config)');
        console.log('💡 Make sure server is restarted with production environment');
      }
    } catch (error) {
      console.log('⚠️  API test failed - server may not be running');
      console.log('💡 Start server with: npm run server (after restarting with prod config)');
    }

    // Final summary
    console.log('\n🎉 VERIFICATION SUMMARY');
    console.log('=======================');

    const issues = [];
    const successes = [];

    if (dishCount > 0) {
      successes.push(`✅ ${dishCount} dishes available`);
    } else {
      issues.push('❌ No dishes found');
    }

    if (restaurants?.length > 0) {
      successes.push(`✅ ${restaurants.length} restaurants available`);
    } else {
      issues.push('❌ No restaurants found');
    }

    if (menus > 0) {
      successes.push(`✅ ${menus} menu items available`);
    } else {
      issues.push('❌ No menu items found');
    }

    successes.forEach(success => console.log(success));
    issues.forEach(issue => console.log(issue));

    console.log('\n📋 NEXT STEPS');
    console.log('=============');

    if (issues.length === 0) {
      console.log('🎊 SUCCESS! Your production dishes should now be working!');
      console.log('');
      console.log('🌐 Test your production app:');
      console.log('   • Open your production URL');
      console.log('   • Navigate to menu/browse dishes');
      console.log('   • You should now see dishes displayed!');
      console.log('');
      console.log('📱 Mobile app users:');
      console.log('   • Refresh the app');
      console.log('   • Clear app cache if needed');
      console.log('   • Dishes should now load from production database');
    } else {
      console.log('⚠️  Some issues still remain. Please:');
      console.log('   1. Run setup-production-database.sql in Supabase dashboard');
      console.log('   2. Restart your server to use production config');
      console.log('   3. Run this verification script again');
    }

  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

// Run verification
verifyProductionFix();