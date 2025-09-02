#!/bin/bash

# Import Restaurants Script
# This script imports restaurant data to fix the menu loading issue

set -e

echo "🍽️  Importing restaurants to fix menu loading issue..."

# Configuration
SUPABASE_URL="https://qrpukxmzdwkepfpuapzh.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgxNzkxOCwiZXhwIjoyMDY2MzkzOTE4fQ.j525YKJgdiyZaR6Gw1dsH71mmhEmVvaiO1EKxrAvsDs"
RESTAURANTS_FILE="exports/local_data/restaurants.json"

# Check if restaurants file exists
if [ ! -f "$RESTAURANTS_FILE" ]; then
    echo "❌ Restaurants file not found: $RESTAURANTS_FILE"
    exit 1
fi

echo "📋 Reading restaurants data from: $RESTAURANTS_FILE"

# Import restaurants using jq to process the JSON array
echo "🔄 Importing restaurants..."

# Use jq to extract each restaurant and import individually
jq -c '.[]' "$RESTAURANTS_FILE" | while read -r restaurant; do
    echo "📝 Importing restaurant: $(echo "$restaurant" | jq -r '.name')"
    
    response=$(curl -s -X POST "$SUPABASE_URL/rest/v1/restaurants" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "$restaurant")
    
    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "✅ Successfully imported: $(echo "$restaurant" | jq -r '.name')"
    else
        echo "❌ Failed to import: $(echo "$restaurant" | jq -r '.name')"
        echo "Error: $response"
    fi
done

echo "🔍 Verifying import..."

# Check how many restaurants are now in the database
restaurant_count=$(curl -s "$SUPABASE_URL/rest/v1/restaurants?select=*" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" | jq length)

echo "📊 Restaurants in database: $restaurant_count"

# Check if restaurants are accessible with anon key (for frontend)
anon_restaurant_count=$(curl -s "$SUPABASE_URL/rest/v1/restaurants?select=*" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFycHVreG16ZHdrZXBmcHVhcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTc5MTgsImV4cCI6MjA2NjM5MzkxOH0.Ix3k_w-nbJQ29FcuP3YYRT_K6ZC7RY2p80VKaDA0JEs" | jq length)

echo "🌐 Restaurants accessible with anon key: $anon_restaurant_count"

if [ "$anon_restaurant_count" -eq 0 ] && [ "$restaurant_count" -gt 0 ]; then
    echo "⚠️  WARNING: Restaurants exist but are not accessible with anon key (RLS issue)"
    echo "🔧 This means the frontend will still show 'menu loading error'"
    echo "💡 You may need to check RLS policies for the restaurants table"
else
    echo "✅ Restaurants are accessible with anon key"
fi

echo "🎉 Restaurant import completed!"
