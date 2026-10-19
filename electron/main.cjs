/**
 * Sentinel HQ — proceso principal Electron
 * Sirve el build de Vite, proxea APIs y expone widget flotante anclado.
 */
const { app, BrowserWindow, shell, ipcMain, screen } = require("electron");
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const { URL } = require("url");

// Linux empaquetado: evita crash de chrome-sandbox / zygote si el SUID no está bien
if (process.platform === "linux") {
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("disable-gpu-sandbox");
}

const isDev = !app.isPackaged;
const DIST = path.join(__dirname, "..", "dist");
const PRELOAD = path.join(__dirname, "preload.cjs");
const HOST = "127.0.0.1";
let PORT = 17473;
let mainWindow = null;
let widgetWindow = null;
let server = null;

const PROXIES = {
  "/api/yt": "https://www.googleapis.com",
  "/api/mp": "https://api.mercadopago.com",
  "/api/gh": "https://api.github.com",
  "/api/ig": "https://graph.instagram.com",
  "/api/x": "https://api.x.com",
  "/api/li": "https://api.linkedin.com",
};

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };
  return map[ext] || "application/octet-stream";
}

function proxyRequest(req, res, targetBase, stripPrefix) {
  const u = new URL(req.url, `http://${HOST}`);
  const destPath = u.pathname.replace(stripPrefix, "") + u.search;
  const target = new URL(destPath, targetBase);

  const headers = { ...req.headers, host: target.host };
  delete headers["origin"];
  delete headers["referer"];

  const lib = target.protocol === "https:" ? https : http;
  const upstream = lib.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers,
    },
    (upRes) => {
      res.writeHead(upRes.statusCode || 502, upRes.headers);
      upRes.pipe(res);
    },
  );
  upstream.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Proxy error: " + err.message);
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.normalize(path.join(DIST, urlPath));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      res.writeHead(200, { "Content-Type": contentType(filePath) });
      res.end(data);
      return;
    }
    // SPA fallback
    const index = path.join(DIST, "index.html");
    fs.readFile(index, (err2, html) => {
      if (err2) {
        res.writeHead(404);
        res.end("Not found. ¿Corriste vite build?");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    });
  });
}

function createLocalServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const url = req.url || "/";
      for (const [prefix, target] of Object.entries(PROXIES)) {
        if (url.startsWith(prefix)) {
          proxyRequest(req, res, target, prefix);
          return;
        }
      }
      if (isDev) {
        res.writeHead(404);
        res.end("dev mode");
        return;
      }
      serveStatic(req, res);
    });

    const tryListen = (port) => {
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") tryListen(port + 1);
        else reject(err);
      });
      server.listen(port, HOST, () => {
        PORT = port;
        resolve(port);
      });
    };
    tryListen(PORT);
  });
}

function appBaseUrl() {
  if (isDev) return "http://localhost:8080";
  return `http://${HOST}:${PORT}`;
}

function broadcastWidgetState() {
  const open = !!(widgetWindow && !widgetWindow.isDestroyed());
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send("widget:state", open);
  }
}

function createWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    widgetWindow.focus();
    broadcastWidgetState();
    return widgetWindow;
  }

  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.workAreaSize;
  const ww = 320;
  const wh = 360;
  const x = Math.max(0, sw - ww - 24);
  const y = 24;

  widgetWindow = new BrowserWindow({
    width: ww,
    height: wh,
    x,
    y,
    minWidth: 280,
    minHeight: 280,
    maxWidth: 420,
    maxHeight: 520,
    frame: false,
    transparent: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: true,
    backgroundColor: "#040b08",
    title: "Sentinel Widget",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD,
    },
  });

  widgetWindow.setAlwaysOnTop(true, "floating");
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  widgetWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  widgetWindow.loadURL(`${appBaseUrl()}/widget`);

  widgetWindow.on("closed", () => {
    widgetWindow = null;
    broadcastWidgetState();
  });

  broadcastWidgetState();
  return widgetWindow;
}

function closeWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
  }
  widgetWindow = null;
  broadcastWidgetState();
}

function toggleWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    closeWidgetWindow();
    return false;
  }
  createWidgetWindow();
  return true;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: "Sentinel HQ",
    backgroundColor: "#040b08",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: PRELOAD,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:8080");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await createLocalServer();
    await mainWindow.loadURL(`http://${HOST}:${PORT}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("widget:toggle", () => toggleWidgetWindow());
ipcMain.handle("widget:open", () => {
  createWidgetWindow();
  return true;
});
ipcMain.handle("widget:close", () => {
  closeWidgetWindow();
  return false;
});
ipcMain.handle("widget:is-open", () => !!(widgetWindow && !widgetWindow.isDestroyed()));

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
