import { app, ipcMain } from 'electron';
import { VpnService, VpnSettings } from "./vpn/vpn.service";
import { TrayService } from "./tray/tray.service";
import { SettingsService } from "./settings/settings.service";

if (require('electron-squirrel-startup')) {
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
} else {
    app.on('ready', async () => {
        const settings = new SettingsService();
        const vpn = new VpnService();
        const trayService = new TrayService({
            onConnect: () => vpn.connect(),
            onDisconnect: () => vpn.disconnect(),
            onToggle: () => vpn.toggle(),
            onSettings: () => settings.show(),
            onClose: () => app.quit(),
        });
        const vpnInit = (settings: VpnSettings) => vpn.init(settings, state => trayService.update(state));

        settings.submit(settings => vpnInit(settings));

        try {
            vpnInit(await settings.storage.get());
        } catch (e) {
            settings.show();
        }

        ipcMain.handle('log', (e, ...args) => console.log(...args));
    });
}
