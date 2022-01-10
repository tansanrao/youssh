"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSHConfigManager = void 0;
const path = require("path");
const fs = require("fs");
const SSHConfig = require("ssh-config");
const electron_1 = require("electron");
const HostsStateManager_1 = require("./HostsStateManager");
const child_process_1 = require("child_process");
class SSHConfigManager {
    constructor() {
        this.watchingSSHConfig = false;
        this.sshConfigPath = path.join(process.env.HOME, '.ssh/config');
        this.sshConfigDir = path.join(process.env.HOME, '.ssh');
        this.loadSSHConfig();
    }
    static get instance() {
        if (!SSHConfigManager.ref) {
            SSHConfigManager.ref = new SSHConfigManager();
        }
        return SSHConfigManager.ref;
    }
    loadSSHConfig() {
        if (!fs.existsSync(this.sshConfigPath)) {
            electron_1.dialog.showMessageBox({
                "message": "SSH Config file (" + this.sshConfigPath +
                    ") not found. You must put the hosts you want to connect to in this file."
            });
            return;
        }
        this.sshConfig = SSHConfig.parse(fs.readFileSync(this.sshConfigPath, 'utf8'));
        if (!this.watchingSSHConfig)
            this.watchSSHConfig();
    }
    getSSHConfig() {
        if (!this.sshConfig) {
            this.loadSSHConfig();
        }
        return this.sshConfig;
    }
    getHosts() {
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
    watchSSHConfig() {
        if (!this.watchingSSHConfig && fs.existsSync(this.sshConfigPath)) {
            fs.watchFile(this.sshConfigPath, (curr, prev) => {
                console.log("SSHConfigManager: SSH Config Changed");
                this.loadSSHConfig();
                HostsStateManager_1.HostsStateManager.instance.refreshHostsState();
            });
            this.watchingSSHConfig = true;
        }
    }
    editSSHConfig() {
        if (!fs.existsSync(this.sshConfigDir)) {
            fs.mkdirSync(this.sshConfigDir);
        }
        if (!fs.existsSync(this.sshConfigPath)) {
            fs.closeSync(fs.openSync(this.sshConfigPath, 'w'));
        }
        // TODO: Replace with intelligent system scan based decision
        (0, child_process_1.execSync)(`(xdg-open ~/.ssh/config || open ~/.ssh/config) &`);
    }
}
exports.SSHConfigManager = SSHConfigManager;
//# sourceMappingURL=SSHConfigManager.js.map