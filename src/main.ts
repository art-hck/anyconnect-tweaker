import { app, ipcMain } from 'electron';
import { VpnService } from "./vpn/vpn.service";
import { TrayService } from "./tray/tray.service";
import { Settings, SettingsService } from "./settings/settings.service";
import { ProxyService } from "./proxy/proxy.service";

if (require('electron-squirrel-startup')) {
    app.quit();
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit();
} else {
    app.on('ready', async () => {
        const settings = new SettingsService();
        const proxy = new ProxyService();
        const vpn = new VpnService();
        const trayService = new TrayService({
            onConnect: () => vpn.connect(),
            onDisconnect: () => vpn.disconnect(),
            onToggle: () => vpn.toggle(),
            onSettings: () => settings.show(),
            onProxy: () => proxy.show(),
            onClose: () => app.quit(),
        });
        const vpnInit = (settings: Settings) => vpn.init(settings, state => trayService.update(state));

        settings.submit(settings => {
            vpnInit(settings);
            if (app.getLoginItemSettings().openAtLogin !== (settings.autostart === 'on')) {
                app.setLoginItemSettings({
                    openAtLogin: settings.autostart === 'on',
                    path: app.getPath("exe")
                });
            }
        });

        try {
            vpnInit(await settings.storage.get());
        } catch (e) {
            settings.show();
        }

        ipcMain.handle('log', (e, ...args) => console.log(...args));
    });
}
