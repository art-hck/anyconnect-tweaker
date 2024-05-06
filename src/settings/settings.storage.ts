import { safeStorage } from "electron";
import fs from "fs/promises";
import { Settings } from "./settings.service";

export class SettingsStorage {

    constructor(private path: string) {
    }

    async set(settings: Settings) {
        const encryptString = safeStorage.encryptString(JSON.stringify(settings))
        return await fs.writeFile(this.path, encryptString);
    }

    async get(): Promise<Settings> {
        const decryptString = safeStorage.decryptString(await fs.readFile(this.path))
        return JSON.parse(decryptString);
    }
}