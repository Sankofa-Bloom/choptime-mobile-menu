
# ChopTime - Cameroonian Food Delivery MVP 🇨🇲

A beautiful, mobile-first Progressive Web App (PWA) for authentic Cameroonian food delivery with WhatsApp integration.

## 🌟 Features

- **Mobile-First Design**: Optimized for smartphones with responsive layout
- **Traditional Cameroonian Menu**: Eru, Achu, Ndolé, and more authentic dishes
- **WhatsApp Ordering**: Seamless order placement via WhatsApp
- **PWA Support**: Installable web app with offline capabilities
- **Cultural Design**: African-inspired colors and patterns
- **Real-time Cart**: Dynamic shopping cart with quantity management
- **Multiple Payment Options**: MTN Money, Orange Money, Pay on Delivery

## 🎨 Design System

### Brand Colors
- **Terracotta Orange**: `#D57A1F` - Primary brand color
- **Earthy Brown**: `#5A2D0C` - Text and accents
- **Soft Beige**: `#FDF1E0` - Background color

### Visual Elements
- African-inspired patterns and textures
- Warm, friendly animations
- Cultural iconography
- Mobile-optimized layouts

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd choptime-mobile-menu

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## 📱 PWA Features

### Installation
- Automatic install prompts on supported devices
- Add to home screen functionality
- App-like experience

### Offline Support
- Service worker caches essential resources
- Basic offline functionality
- Background sync capabilities

### Testing PWA
1. Open Chrome DevTools
2. Go to Application tab
3. Check Manifest and Service Workers sections
4. Test "Add to Home Screen" functionality

## 🔧 Customization Guide

### Menu Items
Edit the menu items in `src/pages/Index.tsx`:

```typescript
const [menuItems] = useState<MenuItem[]>([
  {
    id: '1',
    name: 'Your Dish Name',
    description: 'Dish description',
    price: 2500, // Price in FCFA
    image: 'image-url',
    category: 'Traditional',
    rating: 4.8,
    cookTime: '45 min',
    serves: '2-3 people'
  },
  // Add more items...
]);
```

### WhatsApp Configuration
Change the WhatsApp number in `src/pages/Index.tsx`:

```typescript
const whatsappUrl = `https://wa.me/YOUR_WHATSAPP_NUMBER?text=${message}`;
```

**Current Number**: `+237 6 70 41 64 49`

### Brand Colors
Update colors in `tailwind.config.ts`:

```typescript
choptime: {
  orange: '#D57A1F',      // Your primary color
  brown: '#5A2D0C',       // Text color
  beige: '#FDF1E0',       // Background
  'orange-light': '#E89A4D',
  'brown-light': '#8B4513'
}
```

### Support Email
Update support email throughout the app:
**Current**: `choptime237@gmail.com`

## 🌐 Deployment

### Netlify Deployment
1. Build your project: `npm run build`
2. Drag and drop the `dist` folder to Netlify
3. Configure custom domain if needed

### Vercel Deployment
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Manual Deployment
1. Build: `npm run build`
2. Upload `dist` folder contents to your web server
3. Configure server to serve `index.html` for all routes

## 📋 Project Structure

```
src/
├── components/           # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── pages/               # Main pages
│   └── Index.tsx        # Main ChopTime component
├── index.css           # Global styles with ChopTime branding
└── main.tsx            # App entry point

public/
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── pwa-icon-*.png     # PWA icons (multiple sizes)
└── robots.txt         # SEO robots file
```

## 🔧 Technical Details

### Technologies Used
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** for components
- **Lucide React** for icons
- **PWA** with service worker

### Browser Support
- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Mobile Support
- iOS Safari 14+
- Android Chrome 88+
- Samsung Internet 15+

## 📱 WhatsApp Integration

### How It Works
1. Customer fills order form
2. Clicks "Order via WhatsApp"
3. Pre-filled message opens in WhatsApp
4. Message sent to restaurant number
5. Restaurant confirms and processes order

### Message Format
```
🍽️ *ChopTime Order*

👤 *Customer:* John Doe
📱 *Phone:* +237 6XX XXX XXX
📍 *Delivery Address:* Bastos, Yaoundé
💳 *Payment:* MTN Mobile Money

🛒 *Order Details:*
• Eru with Fufu x2 - 5,000 FCFA
• Pepper Soup x1 - 2,000 FCFA

💰 *Total: 7,000 FCFA*

Thank you for choosing ChopTime! 🇨🇲
```

## 🎯 SEO & Performance

### SEO Features
- Semantic HTML structure
- Meta tags and Open Graph
- Proper headings hierarchy
- Alt text for images
- Structured data ready

### Performance Optimizations
- Image lazy loading
- Code splitting
- Service worker caching
- Minimal bundle size
- Fast loading animations

## 🐛 Troubleshooting

### Common Issues

**PWA not installing**
- Check manifest.json is accessible
- Verify HTTPS (required for PWA)
- Check service worker registration

**WhatsApp not opening**
- Verify phone number format: +237XXXXXXXXX
- Check URL encoding of message
- Test on different devices

**Styling issues**
- Clear browser cache
- Check Tailwind CSS build
- Verify custom CSS conflicts

## 📞 Support

For technical support and customization requests:
- **Email**: choptime237@gmail.com
- **WhatsApp**: +237 6 70 41 64 49

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Cameroonian culinary traditions
- African design inspiration
- Open source community
- Traditional food photography

---

**Made with ❤️ for Cameroon**

*Bringing authentic flavors to your doorstep, one order at a time.*
