import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { VpnSettings } from "../vpn/vpn.service";
import { SettingsStorage } from "./settings.storage";

declare const SETTINGS_WEBPACK_ENTRY: string;
declare const SETTINGS_PRELOAD_WEBPACK_ENTRY: string;

export class SettingsService {
    readonly storage = new SettingsStorage(path.join(app.getPath('userData'), "/settings"));
    private readonly browserWindow = new BrowserWindow({
        height: 307,
        width: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: SETTINGS_PRELOAD_WEBPACK_ENTRY,
        },
        resizable: false,
        frame: false,
        show: false
    });
    private onSubmit: (settings: VpnSettings) => any;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            this.browserWindow.loadURL(SETTINGS_WEBPACK_ENTRY + `?${new URLSearchParams({ ...await this.storage.get() })}`);
        } catch (e) {
            this.browserWindow.loadURL(SETTINGS_WEBPACK_ENTRY);
        }
        // this.browserWindow.webContents.openDevTools();
        ipcMain.handle('minimize', () => this.browserWindow.minimize());
        ipcMain.handle('close', () => this.browserWindow.hide());
        ipcMain.handle('choose-cli', () => dialog.showOpenDialogSync({}));
        ipcMain.handle('submit', (e, settings) => {
            this.storage.set(settings);
            this.browserWindow.hide();
            this.onSubmit(settings);
        });
    }

    submit(cb: (settings: VpnSettings) => any) {
        this.onSubmit = cb;
    }

    show() {
        this.browserWindow.show()
    }
}