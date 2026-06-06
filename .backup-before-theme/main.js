const {
  app, BrowserWindow, Tray, Menu, shell, ipcMain, nativeImage, Notification,
} = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { execSync } = require('child_process');

// ---- 配置 ----
const CONFIG_DIR = path.join(app.getPath('home'), '.dock');
const CONFIG_PATH = path.join(CONFIG_DIR, 'projects.json');
const SETTINGS_PATH = path.join(CONFIG_DIR, 'settings.json');

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch { return { openWindowOnStart: true }; }
}
function writeSettings(s) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf8');
}

function ensureConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ projects: [] }, null, 2), 'utf8');
  }
}
function readProjects() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw).projects || [];
  } catch { return []; }
}
function writeProjects(projects) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ projects }, null, 2), 'utf8');
}

// ---- 全局 ----
let tray = null;
let dashWindow = null;
let settingsWindow = null;

// ---- 端口检测 ----
function checkPort(port) {
  try {
    const out = execSync('lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null', {
      encoding: 'utf8', timeout: 2000
    });
    const re = new RegExp(':' + port + '\\s*\\(LISTEN\\)');
    return Promise.resolve(re.test(out));
  } catch(e) {
    return Promise.resolve(false);
  }
}

async function getPortStatuses(projects) {
  const results = {};
  await Promise.all(
    projects.map(async (p) => {
      results[p.port] = await checkPort(p.port);
    })
  );
  return results;
}

// ---- 菜单栏图标 ----
function createTrayIcon() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Dock');
}

// ---- 构建菜单 ----
async function buildMenu() {
  const projects = readProjects();

  if (projects.length === 0) {
    const menu = Menu.buildFromTemplate([
      { label: '还没有项目', enabled: false },
      { type: 'separator' },
      { label: '管理项目', click: () => openDashboard() },
      { type: 'separator' },
      { type: 'separator' },
      { label: '开机自启', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
      { label: '退出 Dock', click: () => app.quit() },
    ]);
    tray.setContextMenu(menu);
    return;
  }

  const statuses = await getPortStatuses(projects);

  const projectItems = projects.map((p) => {
    const online = statuses[p.port];
    return {
      label: `${online ? '●' : '○'}  ${p.name}  :${p.port}`,
      enabled: online,
      click: online ? () => shell.openExternal(`http://localhost:${p.port}`) : undefined,
    };
  });

  const menu = Menu.buildFromTemplate([
    { label: '项目', enabled: false },
    ...projectItems,
    { type: 'separator' },
    { label: '刷新状态', click: () => buildMenu() },
    { label: '管理项目', click: () => openDashboard() },
    { type: 'separator' },
    { type: 'separator' },
      { label: '开机自启', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
      { type: 'separator' },
      { label: '开机自启', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
        click: (mi) => app.setLoginItemSettings({ openAtLogin: mi.checked }) },
      { label: '退出 Dock', click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

// ---- 管理窗口 ----
function openDashboard() {
  if (dashWindow) {
    dashWindow.focus();
    return;
  }
  dashWindow = new BrowserWindow({
    width: 720,
    height: 580,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e20',
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  dashWindow.loadFile('renderer.html');
  dashWindow.on('closed', () => { dashWindow = null; });
}

// ---- 设置窗口 ----
function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 380,
    height: 350,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e20',
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  settingsWindow.loadFile('settings.html');
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// ---- IPC ----
ipcMain.handle('check-port', async (_e, port) => checkPort(port));

ipcMain.handle('check-all-ports', async (_e, ports) => {
  const results = {};
  const list = await Promise.all(
    ports.map(async (p) => {
      const online = await checkPort(p);
      return { port: p, online };
    })
  );
  list.forEach(({ port, online }) => { results[port] = online; });
  return results;
});

ipcMain.handle('open-external', async (_e, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('get-projects', () => readProjects());

ipcMain.handle('save-projects', (_e, projects) => {
  writeProjects(projects);
  buildMenu();
  return true;
});

ipcMain.handle('get-settings', () => ({
  ...readSettings(),
  openAtLogin: app.getLoginItemSettings().openAtLogin
}));

ipcMain.handle('save-settings', (_e, settings) => {
  if (typeof settings.openAtLogin === 'boolean') {
    app.setLoginItemSettings({ openAtLogin: settings.openAtLogin });
  }
  if (typeof settings.openWindowOnStart === 'boolean') {
    writeSettings({ openWindowOnStart: settings.openWindowOnStart });
  }
  return true;
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('open-settings-window', () => {
  openSettings();
});

ipcMain.handle('refresh-menu', () => {
  buildMenu();
});

ipcMain.handle('scan-ports', async () => {
  const existing = readProjects().map(p => p.port);
  const found = [];
  const seen = new Set();

  // Parse lsof output to find all listening ports with process names
  let output = '';
  try {
    output = execSync('lsof -iTCP -sTCP:LISTEN -P -n', {
      encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'ignore']
    });
  } catch(e) {
    output = e.stdout || '';
  }
  
  for (const line of output.split('\n')) {
    if (!line.includes('LISTEN')) continue;
    const pm = line.match(/^(\S+)/);
    const ppm = line.match(/:(\d+) \(LISTEN\)/);
    if (!pm || !ppm) continue;
    const proc = pm[1];
    if (proc === 'COMMAND') continue;
    const port = parseInt(ppm[1], 10);
    if (port < 1024 || existing.includes(port) || seen.has(port)) continue;
    seen.add(port);
    found.push({ port, process: proc });
  }
  
  return found;
});

// ---- 备份/恢复 ----
ipcMain.handle('export-config', async () => {
  const data = JSON.stringify({ projects: readProjects() }, null, 2);
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog({
    defaultPath: 'dock-projects.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (!result.canceled && result.filePath) {
    require('fs').writeFileSync(result.filePath, data, 'utf8');
    return true;
  }
  return false;
});

ipcMain.handle('import-config', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePath) {
    const data = JSON.parse(require('fs').readFileSync(result.filePath, 'utf8'));
    const imported = data.projects || [];
    const existing = readProjects();
    const existingPorts = new Set(existing.map(p => p.port));
    let added = 0;
    for (const p of imported) {
      if (!existingPorts.has(p.port)) {
        existing.push(p);
        existingPorts.add(p.port);
        added++;
      }
    }
    writeProjects(existing);
    buildMenu();
    return added;
  }
  return 0;
});

// ---- 状态变化通知 ----
let lastStatuses = {};
async function checkAndNotify() {
  const projects = readProjects();
  if (projects.length === 0) return;
  const statuses = await getPortStatuses(projects);
  for (const p of projects) {
    const was = lastStatuses[p.port];
    const now = statuses[p.port];
    if (was !== undefined && was !== now) {
      new Notification({
        title: now ? '🟢 ' + p.name + ' 已上线' : '🔴 ' + p.name + ' 已离线',
        body: 'localhost:' + p.port,
        silent: true,
      }).show();
    }
  }
  lastStatuses = statuses;
}

// ---- 启动 ----
app.whenReady().then(() => {
  ensureConfig();
  createTrayIcon();
  buildMenu();
  const settings = readSettings();
  if (settings.openWindowOnStart !== false) openDashboard();
  setInterval(() => { buildMenu(); checkAndNotify(); }, 30000);
  // 首次状态检测
  setTimeout(() => { getPortStatuses(readProjects()).then(s => { lastStatuses = s; }); }, 5000);
});

app.on('window-all-closed', () => {});
