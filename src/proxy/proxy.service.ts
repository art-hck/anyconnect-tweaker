import { app, BrowserWindow, ipcMain, Notification } from "electron";
import path from "path";
import fs from "fs";
import { createServer } from "node:https";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Server } from "https";
import { Storage } from "../storage";

declare const PROXY_WEBPACK_ENTRY: string;
declare const PROXY_PRELOAD_WEBPACK_ENTRY: string;

export type Hosts = Array<{
    name: string,
    url: string,
    active?: boolean
}>

export class ProxyService {
    readonly storage = new Storage<Hosts>(path.join(app.getPath('userData'), "/hosts"));
    private server: Server;

    private readonly browserWindow = new BrowserWindow({
        height: 400,
        width: 750,
        autoHideMenuBar: true,
        webPreferences: {
            preload: PROXY_PRELOAD_WEBPACK_ENTRY,
        },
        frame: false,
        show: false
    });

    constructor() {
        this.init();
    }

    private async init() {
        this.browserWindow.loadURL(PROXY_WEBPACK_ENTRY);
        // this.browserWindow.webContents.openDevTools();

        ipcMain.handle('proxy-minimize', () => this.browserWindow.minimize());
        ipcMain.handle('proxy-close', () => this.browserWindow.hide());
        ipcMain.handle('proxy-write-storage', (_, hosts: Hosts) => this.storage.set(hosts))
        ipcMain.handle('proxy-read-storage', () => this.storage.get())
        ipcMain.handle('proxy-disconnect', () => new Promise<void>(resolve => this.server?.close(() => resolve()) || resolve()))
        ipcMain.handle('proxy-connect', (_, host) => new Promise<void>((resolve, reject) => {
            const connect = () => {
                const express = require("express")();
                const wsProxy = createProxyMiddleware({ ws: true, target: host.replace(/^http/, 'ws'), changeOrigin: true, secure: false });
                express.use('/', createProxyMiddleware({ target: host, secure: false, changeOrigin: true }))
                express.use(wsProxy);
                this.server = createServer({
                    key: fs.readFileSync(path.join(__dirname, '/assets/ssl/key.pem'), "utf8"),
                    cert: fs.readFileSync(path.join(__dirname, '/assets/ssl/cert.pem'), "utf8")
                }, express);

                this.server.listen(8443, () => resolve());
                this.server.on('upgrade', wsProxy.upgrade);
                this.server.once("error", (e) => {
                    new Notification({ title: 'Connection error', body: e.message }).show();
                    reject(e);
                });
            }
            this.server?.close(() => connect()) || connect();
        }));
    }

    show() {
        this.browserWindow.show()
    }
}