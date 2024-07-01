import path from "path";
import { Menu, Tray } from "electron";
import { VpnState } from "../vpn/vpn.service";

export class TrayService {
    private readonly state: Record<VpnState, { tooltip: string, icon: string }> = {
        connected: { tooltip: 'Connected', icon: '/assets/connected.png' },
        disconnected: { tooltip: 'Disconnected', icon: '/assets/disconnected.png' },
        pending: { tooltip: 'Busy...', icon: '/assets/loading.png' },
    }
    private readonly contextMenu = Menu.buildFromTemplate([
        { label: 'Подключиться', visible: false, click: () => this.events.onConnect() },
        { label: 'Отключиться', visible: false, click: () => this.events.onDisconnect() },
        { label: 'Настройки', click: () => this.events.onSettings() },
        { label: 'Прокси', click: () => this.events.onProxy() },
        { type: 'separator' },
        { label: 'Выход', click: () => this.events.onClose() },
    ]);
    private readonly tray: Tray = new Tray(path.join(__dirname, this.state.pending.icon));

    constructor(private events: {
        onConnect: () => void,
        onDisconnect: () => void,
        onToggle: () => void,
        onClose: () => void
        onSettings: () => void
        onProxy: () => void
    }) {
        this.tray.setContextMenu(this.contextMenu);
        this.tray.addListener('double-click', () => this.events.onToggle());
    }

    update(state: VpnState) {
        this.contextMenu.items[0].visible = state === 'disconnected';
        this.contextMenu.items[1].visible = state === 'connected';
        this.tray.setImage(path.join(__dirname, this.state[state].icon));
        this.tray.setToolTip(this.state[state].tooltip);
    }
}