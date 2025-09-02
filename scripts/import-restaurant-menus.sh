#!/bin/bash

# Import Restaurant Menus Script
# This script imports restaurant_menus data with proper ID mapping

set -e

echo "🍽️  Importing restaurant menus to complete menu data..."

# Configuration
SUPABASE_URL="https://qrpukxmzdwkepfpuapzh.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgxNzkxOCwiZXhwIjoyMDY2MzkzOTE4fQ.j525YKJgdiyZaR6Gw1dsH71mmhEmVvaiO1EKxrAvsDs"
RESTAURANTS_FILE="exports/local_data/restaurants.json"
RESTAURANT_MENUS_FILE="exports/local_data/restaurant_menus.json"

# Check if files exist
if [ ! -f "$RESTAURANTS_FILE" ]; then
    echo "❌ Restaurants file not found: $RESTAURANTS_FILE"
    exit 1
fi

if [ ! -f "$RESTAURANT_MENUS_FILE" ]; then
    echo "❌ Restaurant menus file not found: $RESTAURANT_MENUS_FILE"
    exit 1
fi

echo "📋 Creating restaurant ID mapping..."

# Get current restaurants from production database
echo "🔄 Fetching current restaurants from production..."
PROD_RESTAURANTS=$(curl -s "$SUPABASE_URL/rest/v1/restaurants?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY")

# Create mapping from old UUID to new integer IDs
echo "🔧 Creating UUID to integer ID mapping..."

# Create a temporary mapping file
MAPPING_FILE="/tmp/restaurant_mapping.json"

# Use jq to create mapping based on restaurant names
jq -n --argjson prod "$PROD_RESTAURANTS" --argjson local "$(cat $RESTAURANTS_FILE)" '
  reduce ($local | .[]) as $local_restaurant ({}; 
    . + {
      ($local_restaurant.id): (
        $prod | .[] | select(.name == $local_restaurant.name) | .id
      )
    }
  )
' > "$MAPPING_FILE"

echo "📊 Restaurant ID mapping:"
cat "$MAPPING_FILE" | jq .

echo "🔄 Importing restaurant menus with mapped IDs..."

# Import restaurant menus with mapped IDs
jq -c '.[]' "$RESTAURANT_MENUS_FILE" | while read -r menu_item; do
    old_restaurant_id=$(echo "$menu_item" | jq -r '.restaurant_id')
    new_restaurant_id=$(cat "$MAPPING_FILE" | jq -r --arg old_id "$old_restaurant_id" '.[$old_id]')
    
    if [ "$new_restaurant_id" != "null" ] && [ -n "$new_restaurant_id" ]; then
        # Create new menu item with mapped restaurant_id
        new_menu_item=$(echo "$menu_item" | jq --arg new_id "$new_restaurant_id" '.restaurant_id = $new_id | del(.id)')
        
        echo "📝 Importing menu item for restaurant ID: $old_restaurant_id -> $new_restaurant_id"
        
        response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/restaurant_menus" \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d "$new_menu_item")
        
        if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
            echo "✅ Successfully imported menu item"
        else
            echo "❌ Failed to import menu item"
            echo "Error: $response"
        fi
    else
        echo "⚠️  Skipping menu item - no mapping found for restaurant ID: $old_restaurant_id"
    fi
done

# Clean up
rm -f "$MAPPING_FILE"

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

echo "🎉 Restaurant menus import completed!"
