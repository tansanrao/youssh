import { exec } from "child_process";
import { dialog } from "electron";
import * as path from "path";
import { sendToFrontend } from "../main";
import { IRemoteProcess, ProcessManager } from "./ProcessManager";
import { SSHConfigManager } from "./SSHConfigManager";

export interface IHostState {
  hostName: string,
  lastConnectionStatus: string,
  uptime: string,
  defaultPwd: string,
  gpuInfo: string,
  remoteProcesses: IRemoteProcess[]
}

export class HostsStateManager {
  private static ref: HostsStateManager
  public readonly sshEnv;
  private hostsState;

  constructor() {
    if (process.platform == 'darwin') {
      // Mac does not natively have ssh-askpass or have an X11 DISPLAY, so we
      // need to fake it
      this.sshEnv = { ...process.env, "DISPLAY": "1", "SSH_ASKPASS": path.join(__dirname, "askpass.osascript") };

      // Needed to find Homebrew binaries (eg sshfs) when
      // launched from Dock
      if (process.env.PATH === undefined) {
        process.env.PATH = "/usr/local/bin/";
      } else if (process.env.PATH.indexOf('/usr/local/bin') == -1) {
        process.env.PATH = `/usr/local/bin/:${process.env.PATH}`;
      }
    } else {
      this.sshEnv = { ...process.env };
    }

    this.initializeHostsState()
  }

  public static get instance() {
    if (!HostsStateManager.ref) {
      HostsStateManager.ref = new HostsStateManager()
    }
    return HostsStateManager.ref
  }

  public getHostState(hostName) {
    let hostEntry = null;
    for (var i = 0; i < this.hostsState.length; i++) {
      if (this.hostsState[i]['hostName'] == hostName) {
        hostEntry = this.hostsState[i];
      }
    }
    return hostEntry;
  }

  public updateHostState(hostName, opts: Object) {
    for (var i = 0; i < this.hostsState.length; i++) {
      if (this.hostsState[i]['hostName'] == hostName) {
        for (const key in opts) {
          this.hostsState[i][key] = opts[key]
        }
      }
    }
  }

  public pushToFrontend() {
    sendToFrontend('updateHostsState', this.hostsState)
  }

  public getHostsState() {
    return this.hostsState
  }

  public refreshHostsState() {
    const newHostsState = this.hostsStateFromConfig()
    this.hostsState = this.mergeHostsState(newHostsState)
    console.log("HostsStateManager: State Refreshed")
    sendToFrontend('updateHostsState', this.hostsState)
  }

  public getRemotePorts(hostName) {
    const lsofCommand = "lsof -iTCP -P -n -sTCP:LISTEN"
    const netstatCommand = "netstat -anp tcp | grep '^tcp' | grep '\\bLISTEN\\b'"
    const dockerCommand = "docker ps --format 'YOUSSH\\n{{.Ports}}\\n{{.Command}}\\n{{.Names}}'"
    const sshCommand = 'ssh ' + hostName + ' -o NumberOfPasswordPrompts=1 -C "' + lsofCommand + ' ; echo YOUSSH_HOST_STATE_MANAGER ; ' + netstatCommand +
      ' ; echo YOUSSH_HOST_STATE_MANAGER ; uptime ; echo YOUSSH_HOST_STATE_MANAGER ; pwd ; echo YOUSSH_HOST_STATE_MANAGER ; nvidia-smi --query-gpu=name,memory.free --format=csv' +
      ' ; echo YOUSSH_HOST_STATE_MANAGER ; ' + dockerCommand + '"';

    // spawn ssh session
    const spawned = exec(
      sshCommand,
      { "env": this.sshEnv, "timeout": 20000 },
      (err, stdout, stderr) => {
        let output = '' + stdout;
        let code = err ? err.code : 0;

        if (code == 255 || code == null) {
          // Connecting failed (255) or timed out (null status)
          // (don't fail on other exit codes since commands could
          // fail or not exist even if the connection works)
          console.log(`error code ${code}`);
          this.updateHostState(hostName, { "lastConnectionStatus": 'fail' })
          sendToFrontend('updateHostsState', this.hostsState);
          return;
        }

        const parts = output.split('YOUSSH_HOST_STATE_MANAGER')

        const lsofOutput = parts[0];
        const netstatOutput = parts[1];
        const uptime = parts[2].indexOf('up') == -1 ? null : parts[2].trim();
        const pwd = parts[3].trim();
        const gpuInfo = parts[4].indexOf('MiB') == -1 ? null : parts[4].trim();
        const dockerOutput = parts[5].indexOf('YOUSSH') == -1 ? null : parts[5].trim();

        // Parse lsof output
        const rows = lsofOutput.split('\n');
        const processList = [];
        var portsUsed = [];
        for (var i = 1; i < rows.length; i++) {
          const fields = rows[i].split(/ +/);
          if (fields.length < 8) continue;
          const port = fields[8].split(':').pop();

          if (parseInt(port) > 19999) continue; // Skip High Port Numbers
          if (portsUsed.indexOf(port) != -1) continue; // Skip duplicate ports (due to ipv4 and ipv6)
          portsUsed.push(port);

          const entry = {
            "command": fields[0], "title": null, "user": fields[2], "pid": fields[1],
            "remotePort": port, "localPort": null, "sshAgentPid": null,
            "faviconURL": null, "state": "unforwarded"
          };
          processList.push(entry);
        }

        // Parse netstat output
        const ns_rows = netstatOutput.split('\n');
        for (var i = 0; i < ns_rows.length; i++) {
          const fields = ns_rows[i].split(/ +/);
          if (fields.length < 3) continue;
          const port = fields[3].split(/[:\.]+/).pop();
          const portInt = parseInt(port);
          if ((portInt < 1000 || portInt > 9999) && portInt != 80 && portInt != 443) continue; // Skip high/low port numbers except http(s)

          // Skip duplicate ports (due to ipv4 and ipv6) or already
          // found by lsof approach
          if (portsUsed.indexOf(port) != -1) continue;
          portsUsed.push(port);
          const entry = {
            "command": null, "title": null, "user": null, "pid": null,
            "remotePort": port, "localPort": null, "sshAgentPid": null,
            "faviconURL": null, "state": "unforwarded"
          };
          processList.push(entry);
        }

        // Parse Docker Output
        if (dockerOutput) {
          const docker_rows = dockerOutput.split("\n");

          let count = 0
          let ports = null;
          let command = null;
          let name = null;
          for (let row of docker_rows) {
            if (row == 'YOUSSH') {
              ++count;
              continue;
            }
            if (count == 1) {
              ports = row.split(",");
              ++count;
              continue;
            }
            if (count == 2) {
              command = row;
              ++count;
              continue;
            }
            if (count == 3) {
              name = row;
              for (let ele of ports) {
                let port = ele.split("->")[0].split(":").pop()
                if (portsUsed.indexOf(port) != -1) continue;
                portsUsed.push(port)
                const entry = {
                  "command": command, "title": name, "user": null, "pid": null,
                  "remotePort": port, "localPort": null, "sshAgentPid": null,
                  "faviconURL": null, "state": "unforwarded"
                }
                processList.push(entry);
              }
              // Reset state for next iteration
              count = 0
              ports = null;
              command = null;
              name = null;
            }
          }
        }

        // Update hosts state with the remote processes
        let refHost = this.getHostState(hostName)
        let newProcessList;
        if (refHost['remoteProcesses'].length) {
          newProcessList = ProcessManager.instance.mergeProcessLists(refHost['remoteProcesses'], processList);
        } else {
          newProcessList = processList
        }
        this.updateHostState(hostName, {
          remoteProcesses: newProcessList,
          lastConnectionStatus: 'success',
          uptime: uptime,
          gpuInfo: gpuInfo,
          defaultPwd: pwd
        })
        sendToFrontend('updateHostsState', this.hostsState);
      })
  } // End of getRemotePorts()

  private initializeHostsState() {
    this.hostsState = this.hostsStateFromConfig();

    if (this.hostsState.length == 0) {
      dialog.showMessageBox({
        "message": "No hosts found in ssh_config."
      });
    }
  }

  private mergeHostsState(newHostsState) {
    const mergedHostsState = [];

    for (var i = 0; i < newHostsState.length; i++) {
      const matchedHost = this.hostsState == null ? null : this.getHostState(newHostsState[i].hostName);
      if (matchedHost != null) {
        mergedHostsState.push(matchedHost);
      } else {
        mergedHostsState.push(newHostsState[i]);
      }
    }

    return mergedHostsState;
  }

  private hostsStateFromConfig() {
    const hosts = SSHConfigManager.instance.getHosts()
    const tempHostsState = []

    for (var i = 0; i < hosts.length; i++) {
      const state = {
        "hostName": hosts[i],
        "lastConnectionStatus": "never",
        "uptime": null,
        "gpuInfo": null,
        "defaultPwd": null,
        "remoteProcesses": [],
      }
      tempHostsState.push(state);
    }

    return tempHostsState
  }
}
