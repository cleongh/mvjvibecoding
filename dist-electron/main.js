import { BrowserWindow, app } from "electron";
import path from "node:path";
//#region main.ts
var mainWindow = null;
function createWindow() {
	const window = new BrowserWindow({});
	mainWindow = window;
	window.setMenu(null);
	if (process.env.VITE_DEV_SERVER_URL) window.loadURL(new URL("index.electron.html", process.env.VITE_DEV_SERVER_URL).toString());
	else window.loadFile(path.join(import.meta.dirname, "../dist/index.electron.html"));
	window.on("closed", () => {
		mainWindow = null;
	});
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
	if (mainWindow === null) createWindow();
});
//#endregion
export {};
