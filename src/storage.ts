import { safeStorage } from "electron";
import fs from "fs/promises";

export class Storage<T> {

    constructor(private path: string) {
    }

    async set(payload: T) {
        const encryptString = safeStorage.encryptString(JSON.stringify(payload))
        return await fs.writeFile(this.path, encryptString);
    }

    async get(): Promise<T> {
        const decryptString = safeStorage.decryptString(await fs.readFile(this.path))
        return JSON.parse(decryptString);
    }
}