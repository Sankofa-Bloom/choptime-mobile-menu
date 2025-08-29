#!/bin/bash

# MOBILE APP CONVERSION SCRIPT
# Convert your PWA to native iOS/Android apps using Capacitor

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi

    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js version 20+ required. Current: $(node --version)"
        exit 1
    fi

    log_success "Node.js $(node --version) detected"
}

# Install Capacitor dependencies
install_capacitor() {
    log_info "Installing Capacitor dependencies..."

    npm install @capacitor/core @capacitor/cli --save-dev
    npm install @capacitor/android @capacitor/ios

    # Mobile-specific plugins
    npm install @capacitor/geolocation
    npm install @capacitor/camera
    npm install @capacitor/push-notifications
    npm install @capacitor/device
    npm install @capacitor/status-bar

    log_success "Capacitor dependencies installed"
}

# Initialize Capacitor
init_capacitor() {
    log_info "Checking Capacitor initialization..."

    # Check if Capacitor is already initialized
    if [ -f "capacitor.config.ts" ] || [ -f "capacitor.config.json" ]; then
        log_info "Capacitor already initialized"
        return
    fi

    log_info "Initializing Capacitor project..."

    # Initialize Capacitor
    npx cap init "ChopTym" "com.choptym.mobile" --web-dir=dist

    log_success "Capacitor initialized"
}

# Add mobile platforms
add_platforms() {
    log_info "Adding mobile platforms..."

    # Add Android platform (only if not exists)
    if [ ! -d "android" ]; then
        log_info "Adding Android platform..."
        npx cap add android
        log_success "Android platform added"
    else
        log_info "Android platform already exists"
    fi

    # Add iOS platform (only on macOS and if not exists)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [ ! -d "ios" ]; then
            log_info "Adding iOS platform..."
            npx cap add ios
            log_success "iOS platform added"
        else
            log_info "iOS platform already exists"
        fi
    else
        log_warning "iOS platform skipped (not on macOS)"
    fi

    log_success "Mobile platforms configured"
}

# Configure mobile-specific features
configure_mobile_features() {
    log_info "Configuring mobile-specific features..."

    # Create capacitor.config.json with mobile optimizations
    cat > capacitor.config.json << 'EOF'
{
  "appId": "com.choptym.mobile",
  "appName": "ChopTym",
  "bundledWebRuntime": false,
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "launchAutoHide": true,
      "backgroundColor": "#D57A1F",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  },
  "server": {
    "url": "https://choptym.com",
    "cleartext": false
  },
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  },
  "ios": {
    "allowsLinkPreview": false,
    "contentInset": "automatic"
  }
}
EOF

    log_success "Mobile configuration created"
}

# Build and sync
build_and_sync() {
    log_info "Building and syncing mobile apps..."

    # Build the web app
    npm run build

    # Sync with mobile platforms
    npx cap sync

    log_success "Mobile apps built and synced"
}

# Create mobile-specific documentation
create_mobile_docs() {
    log_info "Creating mobile app documentation..."

    cat > docs/MOBILE_APP_SETUP.md << 'EOF'
# 📱 ChopTym Mobile Apps

## Development Setup

### Prerequisites
- Node.js 20+
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Java JDK 11+ (for Android)

### Android Development
```bash
# Open Android project
npx cap open android

# In Android Studio:
# 1. Sync project with Gradle files
# 2. Build > Make Project
# 3. Run > Run 'app'
```

### iOS Development (macOS only)
```bash
# Open iOS project
npx cap open ios

# In Xcode:
# 1. Select your development team
# 2. Set bundle identifier
# 3. Build and run
```

## App Store Deployment

### Android (Google Play)
1. Build APK/AAB in Android Studio
2. Create Google Play Console account
3. Upload and publish app

### iOS (App Store)
1. Build IPA in Xcode
2. Create Apple Developer account ($99/year)
3. Submit through App Store Connect

## Mobile-Specific Features

### Native Capabilities
- **GPS**: Precise location tracking
- **Camera**: Take photos of dishes
- **Notifications**: Rich push notifications
- **Offline**: Enhanced offline mode
- **Biometrics**: Fingerprint/Face ID login

### Configuration
Mobile features are automatically enabled when running on device:
```javascript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Mobile-specific features
}
```
EOF

    log_success "Mobile documentation created"
}

# Main setup process
main() {
    echo "🚀 ChopTym Mobile App Setup"
    echo "=========================="

    log_info "This will convert your PWA into native mobile apps"
    log_info "Continue? (y/N)"
    read -r response

    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi

    check_node
    install_capacitor
    init_capacitor
    add_platforms
    configure_mobile_features
    build_and_sync
    create_mobile_docs

    echo ""
    echo "🎉 MOBILE APP SETUP COMPLETE!"
    echo "============================="
    echo ""
    echo "📱 Your app is now ready for mobile development!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open Android Studio: npx cap open android"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "2. Open Xcode: npx cap open ios"
    fi
    echo "3. Test on devices/simulators"
    echo "4. Configure app icons and splash screens"
    echo "5. Submit to app stores"
    echo ""
    echo "📖 Documentation: docs/MOBILE_APP_SETUP.md"
    echo ""
    echo "Happy coding! 🇨🇲📱"
}

# Run main function
main "$@"