#!/bin/bash

# Create Restaurant Menus Script
# This script creates restaurant_menus entries linking all dishes to all restaurants

set -e

echo "🍽️  Creating restaurant menus to fix menu loading issue..."

# Configuration
SUPABASE_URL="https://qrpukxmzdwkepfpuapzh.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgxNzkxOCwiZXhwIjoyMDY2MzkzOTE4fQ.j525YKJgdiyZaR6Gw1dsH71mmhEmVvaiO1EKxrAvsDs"

echo "📋 Fetching restaurants and dishes..."

# Get all restaurants
RESTAURANTS=$(curl -s "$SUPABASE_URL/rest/v1/restaurants?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY")

# Get all dishes
DISHES=$(curl -s "$SUPABASE_URL/rest/v1/dishes?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY")

echo "📊 Found $(echo "$RESTAURANTS" | jq length) restaurants and $(echo "$DISHES" | jq length) dishes"

echo "🔄 Creating restaurant menus..."

# Create restaurant menus by linking all dishes to all restaurants
echo "$RESTAURANTS" | jq -c '.[]' | while read -r restaurant; do
    restaurant_id=$(echo "$restaurant" | jq -r '.id')
    restaurant_name=$(echo "$restaurant" | jq -r '.name')
    
    echo "📝 Creating menus for restaurant: $restaurant_name (ID: $restaurant_id)"
    
    echo "$DISHES" | jq -c '.[]' | while read -r dish; do
        dish_id=$(echo "$dish" | jq -r '.id')
        dish_name=$(echo "$dish" | jq -r '.name')
        dish_price=$(echo "$dish" | jq -r '.price')
        
        # Create restaurant menu entry
        menu_item=$(jq -n \
            --arg restaurant_id "$restaurant_id" \
            --arg dish_id "$dish_id" \
            --arg price "$dish_price" \
            '{
                restaurant_id: $restaurant_id,
                dish_id: $dish_id,
                price: ($price | tonumber),
                availability: true
            }')
        
        echo "  🍽️  Adding $dish_name (Price: $dish_price)"
        
        response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/restaurant_menus" \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d "$menu_item")
        
        if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
            echo "    ✅ Success"
        else
            echo "    ❌ Failed: $response"
        fi
    done
done

echo "🔍 Verifying import..."

# Check how many restaurant menus are now in the database
menu_count=$(curl -s "$SUPABASE_URL/rest/v1/restaurant_menus?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" | jq length)

echo "📊 Restaurant menus in database: $menu_count"

# Check if restaurant menus are accessible with anon key (for frontend)
anon_menu_count=$(curl -s "$SUPABASE_URL/rest/v1/restaurant_menus?select=*" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs" | jq length)

echo "🌐 Restaurant menus accessible with anon key: $anon_menu_count"

if [ "$anon_menu_count" -eq 0 ] && [ "$menu_count" -gt 0 ]; then
    echo "⚠️  WARNING: Restaurant menus exist but are not accessible with anon key (RLS issue)"
    echo "🔧 This means the frontend will still show 'menu loading error'"
    echo "💡 You may need to check RLS policies for the restaurant_menus table"
else
    echo "✅ Restaurant menus are accessible with anon key"
fi

echo "🎉 Restaurant menus creation completed!"
