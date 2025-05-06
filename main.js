// main.js - Electron entry point
// هذا الملف مسؤول عن تشغيل تطبيق سطح المكتب باستخدام Electron

const { app, BrowserWindow } = require('electron');
const path = require('path');

// وظيفة إنشاء نافذة التطبيق الرئيسية
function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'), // تحميل سكريبت الواجهة
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html'); // تحميل الصفحة الرئيسية
}

// عند جاهزية التطبيق، أنشئ النافذة
app.whenReady().then(createWindow);

// عند إغلاق جميع النوافذ، أغلق التطبيق (إلا على Mac)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});