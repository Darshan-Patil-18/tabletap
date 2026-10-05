# 🍽️ TableTap - Restaurant POS & Analytics

> **Lightning-fast, zero-hassle POS built specifically for restaurants, cafes, and cloud kitchens.**

A modern, browser-based Point of Sale (POS) system designed for small to medium restaurants. No servers, no setup fees, no complexity - everything runs securely in your browser.

---

Live Link : https://restaurantbillingg.netlify.app/

---

## 🌟 Features

### 🔐 Secure Authentication
- **Username + 4-Digit PIN** authentication system
- SHA-256 encrypted PIN storage
- Session management for secure access
- Change username and PIN anytime from profile

### ⚡ Fast Billing
- Quick order entry with real-time cart
- Smart portion sizing (Half/Full) with checkbox control
- Automatic bill numbering with unique Order IDs
- Instant discount application
- One-click bill generation and printing

### 📋 Menu Management
- Add items manually or scan receipts (OCR)
- Edit/delete menu items anytime
- Customize portion options per item
- Category-based organization
- Search and filter capabilities

### 🧾 Smart Receipts
- Professional bill formatting
- A4-centered print layout (600px width)
- Automatic GST calculation
- Order number tracking
- Print-ready PDF generation

### 📊 History & Analytics
- Complete billing history
- Revenue tracking per bill
- Date-wise filtering
- Customer order patterns
- Storage usage monitoring

### 👤 Profile Dashboard
- Account management (change username/PIN)
- Data & Storage insights
- Security settings
- Help & Support
- Backup & Export (coming soon)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tabletap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

The production build will be available in the `dist` folder.

---

## 📱 User Workflow

### First Time Setup

```
1. Open TableTap
   ↓
2. Click "Create Free Account"
   ↓
3. Enter Username → Click Next
   ↓
4. Create 4-Digit PIN
   ↓
5. Confirm 4-Digit PIN
   ↓
6. Account Created → Dashboard Opens
```

### Daily Operations

#### **Taking Orders**
```
1. Dashboard → Click "+ Order"
   ↓
2. Add items from menu
   ├─ Items WITH half/full: Choose portion
   └─ Items WITHOUT half/full: Direct add to cart
   ↓
3. View cart with Order Number
   ↓
4. Add more items or proceed to billing
```

#### **Billing**
```
1. Cart → Click "Process to Bill"
   ↓
2. Apply discount (optional)
   ↓
3. Review bill details
   ↓
4. Click "Save & Print Bill"
   ↓
5. Bill saved to history
   ↓
6. Print or download PDF
```

#### **Menu Management**
```
1. Dashboard → "Add Items" or "Edit Menu"
   ↓
2. Add Manually
   ├─ Enter item name, price
   ├─ Check "Has Half/Full" if needed
   └─ Click Add
   OR
3. Scan Receipt (OCR)
   ├─ Upload receipt image
   ├─ Review parsed items
   └─ Confirm & save
```

#### **Profile Management**
```
1. Click Profile Icon (top right)
   ↓
2. Profile Dashboard Opens
   ↓
3. Select Option:
   ├─ Account: Change username/PIN
   ├─ Data & Storage: View usage
   ├─ Security: Security settings
   ├─ Help & Support: FAQs
   └─ Logout: Sign out
```

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (utility-first)
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: SHA-256 hashing
- **Storage**: Browser LocalStorage
- **Icons**: Emoji-based (no icon library)

### Project Structure
```
tabletap/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/          # Images and static files
│   ├── components/      # Reusable components
│   │   ├── ProfileCard.jsx
│   │   └── Toast.jsx
│   ├── screens/         # Main app screens
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── OrderScreen.jsx
│   │   ├── BillPreview.jsx
│   │   ├── History.jsx
│   │   ├── AddManually.jsx
│   │   ├── EditMenu.jsx
│   │   ├── ProfileDashboard.jsx
│   │   └── ...
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── index.css        # Global styles
│   ├── main.jsx         # Entry point
│   ├── utils.js         # Helper functions
│   ├── ocrParser.js     # OCR functionality
│   └── sampleData.js    # Demo data
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

### Data Storage

All data is stored in browser's **LocalStorage**:

```javascript
// User Credentials
users: {
  "username": {
    username: "string",
    hash: "sha256_hash"
  }
}

// Session
session: "current_username"

// Menu Items (per user)
menu_username: [
  {
    id: "unique_id",
    name: "Item name",
    price: 100,
    hasPortions: true/false
  }
]

// Bills (per user)
bills_username: [
  {
    id: "B0001",
    orderNumber: 1,
    items: [...],
    subtotal: 500,
    discount: 0,
    gst: 90,
    total: 590,
    payment: "Cash",
    date: "timestamp"
  }
]

// Order Counter (per user)
orderCounter_username: 5
```

---

## 🔒 Security Features

### Authentication
- ✅ SHA-256 encrypted PIN storage
- ✅ No plain text passwords
- ✅ Session-based access control
- ✅ Auto-logout on session end

### Data Privacy
- ✅ All data stored locally (no server sync)
- ✅ No external API calls for user data
- ✅ No tracking or analytics
- ✅ Username-based data isolation

### Best Practices
- ⚠️ **Backup Regularly**: Export your data periodically
- ⚠️ **Clear Browser Data**: Will delete all stored information
- ⚠️ **Private Browsing**: Not recommended (data won't persist)
- ⚠️ **Shared Devices**: Always logout after use

---

## 🎨 Design System

### Colors
- **Primary**: Orange (#f97316)
- **Accent**: Indigo (#6366f1)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Background**: Dynamic (Light/Dark mode)

### Typography
- **Heading Font**: System font stack
- **Body Font**: Inter, system-ui
- **Mono Font**: Courier, monospace

### Components
- Glass-morphism cards
- Gradient buttons
- Smooth animations
- Toast notifications (auto-dismiss)

---

## 📝 Common Issues & Solutions

### Issue: Can't login
**Solution**: Ensure you're using correct username and PIN. Reset by clearing browser data (note: this deletes all data).

### Issue: Menu items not showing
**Solution**: Check if you're logged in with correct account. Each username has separate menu data.

### Issue: Bill not printing
**Solution**: Check browser print settings. Ensure pop-ups are allowed.

### Issue: Storage full
**Solution**: Check Data & Storage in Profile. Delete old bills from History if needed.

### Issue: Lost my PIN
**Solution**: Currently no recovery option. Clear browser data to start fresh (creates new account).

---

## 🛣️ Roadmap

### Upcoming Features
- [ ] Cloud backup & sync
- [ ] Multi-device support
- [ ] WhatsApp bill sharing
- [ ] Advanced analytics dashboard
- [ ] Inventory management
- [ ] Customer database
- [ ] QR code ordering
- [ ] Payment gateway integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Developer Notes

### Running Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm run preview  # Preview production build
```

### Code Style
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Comment complex logic

### Performance Tips
- Lazy load heavy components
- Optimize images
- Minimize re-renders
- Use proper key props in lists


## 🙏 Acknowledgments

- Built with React + Vite
- Inspired by modern POS systems
- Designed for small business owners
- Community feedback appreciated

---

**Made with ❤️ for restaurant owners who deserve better tools**
