import { VpnSettings } from "../vpn/vpn.service";
import { safeStorage } from "electron";
import fs from "fs/promises";

export class SettingsStorage {

    constructor(private path: string) {
    }

    async set(settings: VpnSettings) {
        const encryptString = safeStorage.encryptString(JSON.stringify(settings))
        return await fs.writeFile(this.path, encryptString);
    }

    async get(): Promise<VpnSettings> {
        const decryptString = safeStorage.decryptString(await fs.readFile(this.path))
        return JSON.parse(decryptString);
    }
}