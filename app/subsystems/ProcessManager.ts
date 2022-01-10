import {execSync, spawn} from "child_process";
import {HostsStateManager} from "./HostsStateManager";
import {sendToFrontend} from "../main";

export interface IRemoteProcess {
  command: string,
  title: string,
  user: string,
  pid: number,
  remotePort: string,
  state: string,
  sshAgentPid: number,
  localPort: number,
  iconUrl: string
}

export class ProcessManager {
  private static ref: ProcessManager;
  private subProcesses = [];

  constructor() {
    this.setListeners()
  }

  public static get instance() {
    if (!ProcessManager.ref) {
      ProcessManager.ref = new ProcessManager()
    }
    return ProcessManager.ref
  }

  public pushToFrontend() {
    sendToFrontend('updateSubProcesses', this.subProcesses)
  }

  public mergeProcessLists(oldProcessList, newProcessList) {
    // * Add any currently-being-forwarded process info
    //   from oldProcessList to the new newProcessList
    let mergedList = [];
    let remotePortsMerged = [];
    for (let i = 0; i < newProcessList.length; i++) {
      let mergedInfo = {};
      Object.assign(mergedInfo, newProcessList[i]);

      let oldInfo = this.getProcessFromList(oldProcessList, mergedInfo["remotePort"]);

      if (oldInfo && oldInfo["state"] == "forwarded") {
        mergedInfo["title"] = oldInfo["title"];
        mergedInfo["state"] = oldInfo["state"];
        mergedInfo["sshAgentPid"] = oldInfo["sshAgentPid"];
        mergedInfo["localPort"] = oldInfo["localPort"];
        mergedInfo["faviconURL"] = oldInfo["faviconURL"];
      }

      mergedList.push(mergedInfo);
      remotePortsMerged.push(mergedInfo["remotePort"]);
    }

    for (let j = 0; j < oldProcessList.length; j++) {
      let oldPort = oldProcessList[j]["remotePort"];

      if (remotePortsMerged.indexOf(oldPort) == -1 && oldProcessList[j]["state"] != "dead") {
        // A process we used to be showing no longer exists
        let mergedInfo = {};
        Object.assign(mergedInfo, oldProcessList[j]);
        mergedInfo["state"] = "dead";

        mergedList.push(mergedInfo);
        //remotePortsMerged.push(mergedInfo["remotePort"]);
      }
    }
    return mergedList;
  }

  public getProcessFromList(processList, remotePort) {
    let processEntry = null;
    for (let j = 0; j < processList.length; j++) {
      if (processList[j]['remotePort'] == remotePort) {
        processEntry = processList[j];
      }
    }
    return processEntry;
  }

  public forwardPort(hostName, remotePort, localPort) {
    //  Test if localPort in use
    try {
      if (process.platform == 'darwin') {
        // Mac may need the -G option, which is
        // unavailable on Linux
        // https://stackoverflow.com/a/60918924
        const command = '/usr/local/bin/nc -z -G5 -w5 localhost ' + localPort
        console.log(command)
        execSync(command);
      } else {
        execSync('nc -z -w5 localhost ' + localPort);
      }
      // Success means port is in use
      //TODO send a ToastMessage to Frontend on Fail.
      console.log("netcat fail")
      return
      localPort += 1;
    } catch (err) {
    }

    const fwd = '' + localPort + ':localhost:' + remotePort;
    const spawned = spawn('ssh', ['-L', fwd, hostName, '-N'], {"env": HostsStateManager.instance.sshEnv});
    const getProcessFromList = this.getProcessFromList
    spawned.on('exit', function (errCode) {
      const ref = HostsStateManager.instance.getHostState(hostName)
      let procInfo = getProcessFromList(ref.remoteProcesses, remotePort);
      if (procInfo) {
        let procInfoIndex = ref.remoteProcesses.indexOf(procInfo)
        procInfo.state = "dead";
        ref.remoteProcesses[procInfoIndex]['state'] = "dead"
        HostsStateManager.instance.updateHostState(hostName, ref)
      }
      try {

        HostsStateManager.instance.pushToFrontend()
      } catch (err) {
        // Will fail if app is exiting
      }
    });
    this.subProcesses.push(spawned);

    this.waitForTunnel(spawned, hostName, remotePort, localPort)
  }

  public stopForwardedPort(hostName, remotePort) {
    const ref = HostsStateManager.instance.getHostState(hostName)
    const proc = this.getProcessFromList(ref.remoteProcesses, remotePort);

    if (proc != null && proc.sshAgentPid != null) {
      execSync("kill " + proc.sshAgentPid);
    }
    const newProcessList = ref.remoteProcesses.filter(function (el) {
      return el.sshAgentPid != proc.sshAgentPid;
    });

    HostsStateManager.instance.updateHostState(hostName, {...ref, remoteProcesses: newProcessList})
    HostsStateManager.instance.pushToFrontend()
  }

  private async waitForTunnel(spawnedProc, hostName, remotePort, localPort) {
    // Wait for the SSH tunnel to be established by repeatedly calling
    // lsof until the connection is shown (with a 1s sleep between calls),
    // timing out after 10 attempts
    const tries = 10;
    const pid = spawnedProc.pid;
    const re = new RegExp('' + pid, "g");
    let success = false;

    for (let i = 0; i < tries; i++) {

      const sshProcs = '' + execSync("lsof -P -i -n | grep '^ssh' | awk '{print $2}'");
      const count = (sshProcs.match(re) || []).length;

      // When the tunnel is established, lsof will show over two connections
      // made by the ssh process (for remote TCP port 22, local TCP on local port,
      // and possible duplicates for ipv6)
      if (count >= 2) {
        success = true;
        break;
      }

      // Sleep 1s
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (success) {
      console.log('Tunnel established')
      const forwardedURL = 'http://localhost:' + remotePort;
      let hostState = HostsStateManager.instance.getHostState(hostName);
      let processEntry = this.getProcessFromList(hostState.remoteProcesses, remotePort);
      let processEntryIndex = hostState.remoteProcesses.indexOf(processEntry)
      const title = hostName;
      let faviconURL = null
      if (processEntry != null && processEntry['command'] != null) {
        if (processEntry['command'].startsWith('python')) {
          faviconURL = 'https://www.python.org/favicon.ico';
        } else if (processEntry['command'].startsWith('node')) {
          faviconURL = 'https://nodejs.org/favicon.ico';
        } else if (processEntry['command'].startsWith('ruby')) {
          faviconURL = 'https://www.ruby-lang.org/favicon.ico';
        }
      }

      if (processEntry != null) {
        processEntry['sshAgentPid'] = pid;
        processEntry['localPort'] = localPort;
        processEntry['iconUrl'] = faviconURL;
        if (title) {
          processEntry['title'] = title;
        }
        processEntry["state"] = "forwarded";
      }

      hostState.remoteProcesses[processEntryIndex] = processEntry;
      HostsStateManager.instance.updateHostState(hostName, hostState)
      HostsStateManager.instance.pushToFrontend()
    }
  }

  private setListeners() {
    let subProcesses = this.subProcesses
    process.on('exit', function () {
      for (let proc of subProcesses) {
        try {
          proc.kill();
        } catch (err) {

        }
      }
    });
  }
}

