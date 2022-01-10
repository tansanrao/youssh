"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCMainListener = void 0;
const electron_1 = require("electron");
const HostsStateManager_1 = require("./HostsStateManager");
const ProcessManager_1 = require("./ProcessManager");
const SSHConfigManager_1 = require("./SSHConfigManager");
class IPCMainListener {
    constructor() {
        console.log("IPCMainListener: Ready");
        this.setListeners();
    }
    static get instance() {
        if (!IPCMainListener.ref) {
            IPCMainListener.ref = new IPCMainListener();
        }
        return IPCMainListener.ref;
    }
    setListeners() {
        electron_1.ipcMain.on("requestFrontendInit", () => {
            console.log("IPCMainListener: requestFrontendInit Received");
            HostsStateManager_1.HostsStateManager.instance.pushToFrontend();
        });
        electron_1.ipcMain.on('requestRemotePorts', (event, hostName) => {
            console.log("IPCMainListener: requestRemotePorts for " + hostName);
            HostsStateManager_1.HostsStateManager.instance.getRemotePorts(hostName);
        });
        electron_1.ipcMain.on('forwardPort', (event, hostName, remotePort) => {
            const localPort = 20000 + parseInt(remotePort);
            console.log("IPCMainListener: forwardPort for " + hostName + " " + remotePort + " -> localhost:" + localPort);
            ProcessManager_1.ProcessManager.instance.forwardPort(hostName, remotePort, localPort);
        });
        electron_1.ipcMain.on('stopForwardedPort', (event, hostName, remotePort) => {
            const localPort = 20000 + parseInt(remotePort);
            console.log("IPCMainListener: stop forwarding for " + hostName + " " + remotePort + " -> localhost:" + localPort);
            ProcessManager_1.ProcessManager.instance.stopForwardedPort(hostName, remotePort);
        });
        electron_1.ipcMain.on('sshConfigEdit', () => {
            SSHConfigManager_1.SSHConfigManager.instance.editSSHConfig();
        });
    }
}
exports.IPCMainListener = IPCMainListener;
//# sourceMappingURL=IPCMainListener.js.map