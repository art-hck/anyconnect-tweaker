import md5 from "md5";
import child_process, { ChildProcessWithoutNullStreams } from "child_process";
import { authenticator } from "otplib";
import { Settings } from "../settings/settings.service";
import { Notification } from "electron";


export type VpnState = 'connected' | 'disconnected' | 'pending';


export type OnSetState = (state: VpnState) => void;

export class VpnService implements Settings {
    private child?: ChildProcessWithoutNullStreams;
    private status?: VpnState;
    private onSetState: OnSetState;
    cli: string;
    group?: string;
    host: string;
    password: string;
    pin?: string;
    secret: string;
    user: string;
    algorithm: 'md5' | 'sha1';

    async init(settings: Settings, onSetState: OnSetState) {
        Object.assign(this, settings);
        this.onSetState = onSetState
        this.setState(await this.state() ? 'connected' : 'disconnected');
    }

    connect(): void {
        let errorMessage: string;
        this.setState('pending');
        if (this.child) this.child.kill();

        this.child = child_process.spawn(this.cli, ['-s']);

        this.child.stderr.on("data", data => console.error(`${data}`.trim()));
        this.child.stdout.on('data', data => console.log(`${data}`.trim()));

        /**
         * Handle connection errors
         */
        this.child.stdout.on('data', data => {
            if (`${data}`.includes('error')) {
                errorMessage = data.toString().replace(/(\r\n|\n|\r)/g, ' ').replace(/.*error: (.+)VPN>.*$/, "$1").trim();
                this.child.kill();
            }

            if (`${data}`.includes('Login failed')) {
                errorMessage = 'Wrong credentials';
                this.child.kill();
            }
        });

        this.child.addListener('close', () => {
            if (errorMessage) new Notification({ title: 'Connection error', body: errorMessage}).show();
            this.setState(errorMessage ? 'disconnected' : 'connected')
        });

        const payload = [`connect ${this.host}`];
        if (this.group) {
            payload.push(this.group);
        }
        payload.push(this.user, this.password);
        if (this.algorithm === 'md5') {
            payload.push(md5(`${+new Date()}`.slice(0, 9) + this.secret + this.pin).slice(0, 6))
        }

        if (this.algorithm === 'sha1') {
            payload.push(authenticator.generate(this.secret))
        }

        this.child.stdin.write(payload.join("\n") + "\n");
        this.child.stdin.end();
    }

    disconnect(): void {
        this.setState('pending');

        if (this.child) {
            this.child.kill();
        }

        this.child = child_process.spawn(this.cli, ['disconnect']);
        this.child.stderr.on("data", data => console.error(`${data}`.trim()));
        this.child.stdout.on('data', data => console.log(`${data}`.trim()));
        this.child.addListener('close', () => this.setState('disconnected'));
    }

    toggle(): void {
        this.status === 'connected' ? this.disconnect() : this.status === 'disconnected' ? this.connect() : null;
    }

    private state(): Promise<boolean> {
        return new Promise((resolve) => {
            this.child = child_process.spawn(this.cli, ['state']);
            this.child.stdout.on('data', (data) => {
                if (/state: Disconnected/.test(data)) resolve(false);
                if (/state: Connected/.test(data)) resolve(true);
            });
        })
    }

    // groups(cli, host) {
    //     return new Promise((resolve) => {
    //         this.child = child_process.spawn(cli, ['-s']);
    //         this.child.stdin.write(`connect ${host}`);
    //         this.child.stdout.on('data', (data) => {
    //             if (/Group:/.test(data)) {
    //                 this.child.kill();
    //                 resolve([...data.toString().matchAll(/\d\) (.*)/g)].map(([, s]) => s));
    //             }
    //         });
    //     });
    // }

    private setState(state: VpnState) {
        this.status = state;
        this.onSetState?.(state);
    }
}