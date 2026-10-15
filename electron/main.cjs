/**
 * Sentinel HQ — proceso principal Electron
 * Sirve el build de Vite y proxea APIs (mismo contrato que vite.config).
 */
const { app, BrowserWindow, shell } = require("electron");
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
const HOST = "127.0.0.1";
let PORT = 17473;
let mainWindow = null;
let server = null;

const PROXIES = {
  "/api/yt": "https://www.googleapis.com",
  "/api/mp": "https://api.mercadopago.com",
  "/api/gh": "https://api.github.com",
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
        // En dev la UI la sirve Vite; este server solo proxea si hiciera falta
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

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
