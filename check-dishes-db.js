/**
 * CHECK DISHES IN DATABASE
 * Diagnoses why dishes are not showing up in production
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkDishesDatabase() {
  console.log('🔍 CHECKING DISHES IN DATABASE');
  console.log('================================');

  try {
    // Step 1: Test database connection
    console.log('\n1️⃣ Testing database connection...');

    const { data: testData, error: testError } = await supabase
      .from('delivery_fee_settings')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      console.log('💡 Possible issues:');
      console.log('   - Supabase local instance not running');
      console.log('   - Environment variables incorrect');
      console.log('   - Network connectivity issues');
      return;
    }

    console.log('✅ Database connection successful');

    // Step 2: Check if dishes table exists
    console.log('\n2️⃣ Checking dishes table...');

    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .limit(5);

    if (dishesError) {
      console.log('❌ Dishes table error:', dishesError.message);

      if (dishesError.code === 'PGRST205') {
        console.log('💡 Issue: Dishes table does not exist');
        console.log('🔧 Solution: Run database migrations');
      }

      return;
    }

    console.log(`📊 Found ${dishes?.length || 0} dishes in database`);

    if (dishes && dishes.length > 0) {
      console.log('🍽️  Sample dishes:');
      dishes.slice(0, 3).forEach((dish, index) => {
        console.log(`   ${index + 1}. ${dish.name} (${dish.active ? 'Active' : 'Inactive'})`);
      });
    }

    // Step 3: Check active dishes count
    console.log('\n3️⃣ Checking active dishes...');

    const { count: activeCount, error: activeError } = await supabase
      .from('dishes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (activeError) {
      console.log('❌ Error checking active dishes:', activeError.message);
    } else {
      console.log(`✅ Active dishes: ${activeCount}`);

      if (activeCount === 0) {
        console.log('⚠️  Warning: No active dishes found!');
        console.log('💡 This explains why dishes are not showing up');
      }
    }

    // Step 4: Check restaurants and menu relationships
    console.log('\n4️⃣ Checking restaurants and menus...');

    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('id, name, active')
      .eq('active', true)
      .limit(3);

    if (restError) {
      console.log('❌ Restaurants query error:', restError.message);
    } else {
      console.log(`🏪 Active restaurants: ${restaurants?.length || 0}`);
      if (restaurants && restaurants.length > 0) {
        restaurants.forEach((rest, index) => {
          console.log(`   ${index + 1}. ${rest.name}`);
        });
      }
    }

    const { data: menus, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('count', { count: 'exact', head: true })
      .eq('availability', true);

    if (menuError) {
      console.log('❌ Menu query error:', menuError.message);
    } else {
      console.log(`📋 Available menu items: ${menus}`);
    }

    // Step 5: Provide solutions
    console.log('\n🎯 DIAGNOSIS & SOLUTIONS');
    console.log('========================');

    if (!dishes || dishes.length === 0) {
      console.log('❌ PROBLEM: No dishes in database');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Run: npm run create-admin');
      console.log('   2. Add dishes via admin dashboard');
      console.log('   3. Or run database seeding script');
    } else if (activeCount === 0) {
      console.log('❌ PROBLEM: All dishes are inactive');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Activate dishes in admin dashboard');
      console.log('   2. Or run SQL: UPDATE dishes SET active = true;');
    } else {
      console.log('✅ Database looks good!');
      console.log('💡 If dishes still not showing:');
      console.log('   1. Check browser console for API errors');
      console.log('   2. Verify frontend is calling correct API endpoint');
      console.log('   3. Check network connectivity');
      console.log('   4. Clear browser cache and reload');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('💡 Check your Supabase local instance is running');
  }
}

// Run the check
checkDishesDatabase();