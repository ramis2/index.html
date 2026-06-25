# 📚 My Homework App

A Progressive Web App (PWA) for kids to track homework, stay focused, and build good study habits. Works offline on any phone — no app store needed.

---

## ✨ Features

| Feature | What It Does |
|---------|-------------|
| **📋 Homework Tracker** | Add tasks by subject with due dates |
| **📅 Due Date Alerts** | Urgent tasks (due today/tomorrow) highlighted in red |
| **⏱️ Focus Timer** | Built-in Pomodoro timer (25 min) — tap to start |
| **🔥 Streak Counter** | Tracks consecutive days of completed homework |
| **📊 Stats Dashboard** | See done/pending counts and daily usage time |
| **⏰ Time Limit** | Parents set daily screen time (default: 2 hours) |
| **🔒 Parent Dashboard** | PIN-protected settings, weekly activity chart, completed task history |
| **📲 Installable** | Add to home screen like a real app |
| **🌐 Works Offline** | Service worker caches everything — no internet needed |

---

## 📁 Files Included

```
homework-app/
├── index.html          # Main app page
├── style.css           # All styling (mobile-first)
├── app.js              # All app logic
├── manifest.json       # Makes it installable
├── service-worker.js   # Offline caching
├── icons/
│   ├── icon-192.png    # App icon (small)
│   └── icon-512.png    # App icon (large)
└── README.md           # This file
```

---

## 🚀 How to Set Up (For Parents)

### Step 1: Upload to a Web Server

You need any web hosting. Free options:
- **Netlify Drop** — drag & drop folder → [netlify.com](https://netlify.com)
- **GitHub Pages** — free hosting from a GitHub repo
- **Vercel** — drag & drop → [vercel.com](https://vercel.com)
- **Your own server** — Apache/Nginx/any static host

Just upload all files in the `homework-app` folder to the root of your site.

### Step 2: Open on Kid's Phone

1. Open the app URL in **Chrome** (Android) or **Safari** (iPhone)
2. You should see the app with a green banner at top

### Step 3: Install to Home Screen

**iPhone (Safari):**
1. Tap the **Share** button (square with arrow)
2. Scroll down and tap **"Add to Home Screen"**
3. Tap **Add**

**Android (Chrome):**
1. Tap the **3-dot menu** (top right)
2. Tap **"Add to Home screen"** or **"Install app"**
3. Tap **Install**

The app now appears on the home screen like any other app. It opens full-screen with no browser chrome.

---

## 🔐 Parent Setup

### First Time: Change the PIN

Default PIN is `0000`. **Change it immediately:**

1. Open the app on the kid's phone
2. Tap the **⚙️ gear icon** (top right)
3. Enter PIN: `0000`
4. Scroll to **"Change PIN"**
5. Enter a new 4-digit PIN
6. Tap **Save PIN**

### Set Daily Time Limit

1. Tap **⚙️ gear icon** → enter PIN
2. Find **"Daily Time Limit"**
3. Change the hours (e.g., `2` for 2 hours)
4. It saves automatically

### What the Parent Dashboard Shows

- **Time Limit** — how many hours the kid can use the app per day
- **Current Usage** — time used today
- **Weekly Chart** — bar graph of completed tasks per day (last 7 days)
- **Completed Tasks** — list of recently finished homework
- **Reset All Data** — wipes everything (requires double confirmation)

---

## 👦 How Kids Use It

### Add Homework

1. Pick a subject tab (Math, Science, English, History, Other)
2. Type homework in the bottom bar
3. *(Optional)* Tap the date icon to set a due date
4. Tap **➕** to add

### Complete a Task

- Tap the **circle** next to any task → it turns green with a checkmark
- The task gets a strikethrough and moves to the bottom

### Delete a Task

- Tap the **🗑️ trash can** → confirm deletion

### Use the Focus Timer

- Tap the **⏱️ timer** at the top → starts 25-minute countdown
- Timer pulses orange while running
- Tap again to stop early
- When time's up, you get a notification to take a break

### Check Your Stats

- **Done** — total completed tasks
- **To Do** — pending tasks
- **🔥 Streak** — consecutive days with completed homework
- **Today** — time spent in the app today

---

## ⏰ When Time Limit Is Reached

When the kid hits their daily limit:
- The app shows a **"Daily Limit Reached!"** screen
- They can't use the app until tomorrow
- **Parent Override** button lets you add 30 more minutes (requires PIN)

---

## 🔧 Customization

### Change Default PIN
Edit `app.js`, find this line near the top:
```javascript
pin: '0000',
```
Change `'0000'` to your preferred PIN.

### Change Default Time Limit
Edit `app.js`, find:
```javascript
timeLimit: 2,
```
Change `2` to any number of hours.

### Add More Subjects
In `index.html`, add a new button inside `<nav id="subjects">`:
```html
<button class="subject-btn" data-subject="art">🎨 Art</button>
```

Then in `app.js`, add to the `SUBJECTS` array:
```javascript
const SUBJECTS = ['math', 'science', 'english', 'history', 'other', 'art'];
```

And add an icon:
```javascript
const SUBJECT_ICONS = { ... art: '🎨' };
```

### Change Colors
Edit `style.css`, find `:root` at the top:
```css
:root {
    --primary: #4CAF50;      /* Main green */
    --accent: #FF9800;       /* Orange timer */
    --danger: #f44336;       /* Red alerts */
    --bg: #f0f2f5;           /* Background gray */
}
```

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---------|-----|
| App won't install | Make sure you're using HTTPS (required for PWAs) |
| Offline mode not working | Check that `service-worker.js` is in the same folder as `index.html` |
| Icons not showing | Verify `icons/` folder has `icon-192.png` and `icon-512.png` |
| Data lost | All data is saved in the phone's browser. Clearing browser data will erase it. |
| Timer not working | Make sure the phone isn't in Low Power Mode (can pause JS timers) |
| PIN forgotten | Clear browser data for this site → resets everything to default |

---

## 📝 Technical Notes

- **No backend needed** — all data stored in `localStorage`
- **No tracking** — no ads, no analytics, no external connections
- **Privacy** — data never leaves the device
- **Browser support** — Chrome, Safari, Edge, Firefox (mobile & desktop)
- **File size** — under 50KB total (excluding icons)

---

## 🎓 Tips for Parents

1. **Set the PIN before giving the phone to your kid**
2. **Review the weekly chart** to see study patterns
3. **Use the time limit** to enforce healthy screen habits
4. **The app has no external links** — kids can't browse away
5. **Works in airplane mode** — great for distraction-free focus time

---

Made with ❤️ for focused kids and peace-of-mind parents.
