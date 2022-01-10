import * as path from 'path';
import * as fs from 'fs';
import * as SSHConfig from 'ssh-config'
import { dialog } from 'electron';
import { HostsStateManager } from './HostsStateManager';
import { execSync } from 'child_process';

export class SSHConfigManager {
    private static ref: SSHConfigManager
    private sshConfigPath: string;
    private sshConfigDir: string;
    private sshConfig;
    private watchingSSHConfig = false;

    constructor() {
        this.sshConfigPath = path.join(process.env.HOME, '.ssh/config');
        this.sshConfigDir = path.join(process.env.HOME, '.ssh');

        this.loadSSHConfig()
    }

    public static get instance() {
        if (!SSHConfigManager.ref) {
            SSHConfigManager.ref = new SSHConfigManager()
        }
        return SSHConfigManager.ref
    }

    private loadSSHConfig() {
        if (!fs.existsSync(this.sshConfigPath)) {
            dialog.showMessageBox({
                "message": "SSH Config file (" + this.sshConfigPath +
                    ") not found. You must put the hosts you want to connect to in this file."
            });
            return
        }
        this.sshConfig = SSHConfig.parse(fs.readFileSync(this.sshConfigPath, 'utf8'));
        if (!this.watchingSSHConfig) this.watchSSHConfig()
    }

    public getSSHConfig() {
        if (!this.sshConfig) {
            this.loadSSHConfig()
        }
        return this.sshConfig
    }

    public getHosts() {
        const hosts = [];

        for (var i = 0; i < this.sshConfig.length; i++) {
            const entry = this.sshConfig[i];

            if (entry.param == "Host" && entry.value) {
                const entryParts = Array.isArray(entry.value) ? entry.value : [entry.value];

                for (var j = 0; j < entryParts.length; j++) {
                    const pattern = entryParts[j];

                    if (pattern.trim() != "" && pattern.indexOf('*') == -1 && pattern.indexOf('?') == -1) {
                        hosts.push(pattern);
                    }
                }
            }
        }
        return hosts;
    }

    private watchSSHConfig() {
        if (!this.watchingSSHConfig && fs.existsSync(this.sshConfigPath)) {
            fs.watchFile(this.sshConfigPath, (curr, prev) => {
                console.log("SSHConfigManager: SSH Config Changed")
                this.loadSSHConfig()
                HostsStateManager.instance.refreshHostsState()
            })
            this.watchingSSHConfig = true
        }
    }

    public editSSHConfig() {
        if (!fs.existsSync(this.sshConfigDir)) {
            fs.mkdirSync(this.sshConfigDir);
        }

        if (!fs.existsSync(this.sshConfigPath)) {
            fs.closeSync(fs.openSync(this.sshConfigPath, 'w'));
        }

        // TODO: Replace with intelligent system scan based decision
        execSync(`(xdg-open ~/.ssh/config || open ~/.ssh/config) &`);
    }
}