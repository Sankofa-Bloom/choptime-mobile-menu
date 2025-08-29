/**
 * FIX DISHES IN PRODUCTION
 * Complete solution to get dishes showing up in production
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function fixDishesProduction() {
  console.log('🔧 FIXING DISHES IN PRODUCTION');
  console.log('===============================');

  try {
    // Step 1: Check current status
    console.log('\n1️⃣ Checking current database status...');

    let hasTables = false;
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('id')
        .limit(1);

      if (!error) {
        hasTables = true;
        console.log('✅ Database tables exist');
      }
    } catch (error) {
      console.log('❌ Database tables missing');
    }

    if (!hasTables) {
      console.log('\n📋 SOLUTION: Database tables need to be created');
      console.log('================================================');

      console.log('\n📄 Copy and run this SQL in your Supabase Dashboard:');
      console.log('---------------------------------------------------');

      try {
        const sqlContent = fs.readFileSync('setup-production-database.sql', 'utf8');
        console.log('\n' + '='.repeat(60));
        console.log(sqlContent);
        console.log('='.repeat(60));
      } catch (error) {
        console.log('❌ Could not read SQL file. Make sure setup-production-database.sql exists.');
        return;
      }

      console.log('\n🎯 After running the SQL:');
      console.log('1. Refresh your browser');
      console.log('2. Check if dishes appear');
      console.log('3. If still not working, run: node fix-dishes-production.js again');

      return;
    }

    // Step 2: Check data
    console.log('\n2️⃣ Checking database data...');

    // Check dishes
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*')
      .limit(5);

    if (dishesError) {
      console.log('❌ Error fetching dishes:', dishesError.message);
    } else {
      console.log(`📊 Found ${dishes?.length || 0} dishes in database`);

      if (dishes && dishes.length > 0) {
        console.log('🍽️  Sample dishes:');
        dishes.slice(0, 3).forEach((dish, index) => {
          console.log(`   ${index + 1}. ${dish.name} - ${dish.price} FCFA (${dish.active ? 'Active' : 'Inactive'})`);
        });
      }
    }

    // Check active dishes
    const { count: activeDishes, error: activeError } = await supabase
      .from('dishes')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (activeError) {
      console.log('❌ Error checking active dishes:', activeError.message);
    } else {
      console.log(`✅ Active dishes: ${activeDishes || 0}`);

      if ((activeDishes || 0) === 0) {
        console.log('⚠️  No active dishes found! This is why dishes are not showing up.');

        // Try to activate existing dishes
        console.log('\n🔧 Activating all dishes...');
        const { error: activateError } = await supabase
          .from('dishes')
          .update({ active: true })
          .neq('id', null);

        if (activateError) {
          console.log('❌ Could not activate dishes:', activateError.message);
        } else {
          console.log('✅ All dishes activated!');
        }
      }
    }

    // Check restaurants
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(3);

    if (restError) {
      console.log('❌ Error fetching restaurants:', restError.message);
    } else {
      console.log(`🏪 Found ${restaurants?.length || 0} restaurants`);

      if (restaurants && restaurants.length > 0) {
        restaurants.forEach((rest, index) => {
          console.log(`   ${index + 1}. ${rest.name} (${rest.town})`);
        });
      }
    }

    // Check restaurant menus
    const { count: menuItems, error: menuError } = await supabase
      .from('restaurant_menus')
      .select('*', { count: 'exact', head: true })
      .eq('availability', true);

    if (menuError) {
      console.log('❌ Error checking restaurant menus:', menuError.message);
    } else {
      console.log(`📋 Available menu items: ${menuItems || 0}`);
    }

    // Step 3: Test API endpoints
    console.log('\n3️⃣ Testing API endpoints...');

    try {
      const response = await fetch('http://localhost:3001/api/dishes');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API working: ${data.data?.length || 0} dishes returned`);
      } else {
        console.log('❌ API not responding. Make sure backend server is running:');
        console.log('   cd server && npm run dev');
      }
    } catch (error) {
      console.log('❌ API connection failed. Start backend server:');
      console.log('   cd server && npm run dev');
    }

    // Step 4: Provide final status
    console.log('\n🎯 FINAL STATUS');
    console.log('================');

    const issues = [];
    const recommendations = [];

    if ((activeDishes || 0) === 0) {
      issues.push('No active dishes in database');
      recommendations.push('Activate dishes or add new ones');
    }

    if ((restaurants?.length || 0) === 0) {
      issues.push('No restaurants in database');
      recommendations.push('Add restaurants to database');
    }

    if ((menuItems || 0) === 0) {
      issues.push('No restaurant menu items');
      recommendations.push('Link dishes to restaurants');
    }

    if (issues.length === 0) {
      console.log('✅ Everything looks good! Dishes should be showing up now.');
      console.log('\n🌐 If dishes still not showing in frontend:');
      console.log('1. Hard refresh browser (Ctrl+F5)');
      console.log('2. Clear browser cache');
      console.log('3. Check browser console for errors');
      console.log('4. Verify backend server is running');
    } else {
      console.log('❌ Issues found:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });

      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Save status report
    const statusReport = {
      timestamp: new Date().toISOString(),
      database: {
        hasTables,
        activeDishes: activeDishes || 0,
        restaurants: restaurants?.length || 0,
        menuItems: menuItems || 0
      },
      issues,
      recommendations,
      status: issues.length === 0 ? 'GOOD' : 'NEEDS_FIXES'
    };

    fs.writeFileSync('dishes-status-report.json', JSON.stringify(statusReport, null, 2));
    console.log('\n📄 Status report saved: dishes-status-report.json');

  } catch (error) {
    console.log('❌ Fatal error:', error.message);
    console.log('\n💡 Most likely cause: Database tables not created');
    console.log('   Solution: Run setup-production-database.sql in Supabase');
  }
}

// Run the fix
fixDishesProduction();