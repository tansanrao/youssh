import {ipcMain} from "electron";
import {HostsStateManager} from "./HostsStateManager";
import {sendToFrontend} from "../main"
import {hostname} from "os";
import {ProcessManager} from "./ProcessManager";
import * as Process from "process";
import {SSHConfigManager} from "./SSHConfigManager";

export class IPCMainListener {
  private static ref: IPCMainListener

  constructor() {
    console.log("IPCMainListener: Ready")
    this.setListeners()
  }

  public static get instance() {
    if (!IPCMainListener.ref) {
      IPCMainListener.ref = new IPCMainListener()
    }
    return IPCMainListener.ref
  }

  private setListeners() {
    ipcMain.on("requestFrontendInit", () => {
      console.log("IPCMainListener: requestFrontendInit Received")
      HostsStateManager.instance.pushToFrontend()
    })

    ipcMain.on('requestRemotePorts', (event, hostName) => {
      console.log("IPCMainListener: requestRemotePorts for " + hostName)
      HostsStateManager.instance.getRemotePorts(hostName)
    });

    ipcMain.on('forwardPort', (event, hostName, remotePort) => {
      const localPort = 20000 + parseInt(remotePort)
      console.log("IPCMainListener: forwardPort for " + hostName + " " + remotePort + " -> localhost:" + localPort)
      ProcessManager.instance.forwardPort(hostName, remotePort, localPort)
    })

    ipcMain.on('stopForwardedPort', (event, hostName, remotePort) => {
      const localPort = 20000 + parseInt(remotePort)
      console.log("IPCMainListener: stop forwarding for " + hostName + " " + remotePort + " -> localhost:" + localPort)
      ProcessManager.instance.stopForwardedPort(hostName, remotePort)
    })

    ipcMain.on('sshConfigEdit', () => {
      SSHConfigManager.instance.editSSHConfig()
    })
  }
}
