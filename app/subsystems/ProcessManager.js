"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManager = void 0;
const child_process_1 = require("child_process");
const HostsStateManager_1 = require("./HostsStateManager");
const main_1 = require("../main");
class ProcessManager {
    constructor() {
        this.subProcesses = [];
        this.setListeners();
    }
    static get instance() {
        if (!ProcessManager.ref) {
            ProcessManager.ref = new ProcessManager();
        }
        return ProcessManager.ref;
    }
    pushToFrontend() {
        (0, main_1.sendToFrontend)('updateSubProcesses', this.subProcesses);
    }
    mergeProcessLists(oldProcessList, newProcessList) {
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
    getProcessFromList(processList, remotePort) {
        let processEntry = null;
        for (let j = 0; j < processList.length; j++) {
            if (processList[j]['remotePort'] == remotePort) {
                processEntry = processList[j];
            }
        }
        return processEntry;
    }
    forwardPort(hostName, remotePort, localPort) {
        //  Test if localPort in use
        try {
            if (process.platform == 'darwin') {
                // Mac may need the -G option, which is
                // unavailable on Linux
                // https://stackoverflow.com/a/60918924
                const command = '/usr/local/bin/nc -z -G5 -w5 localhost ' + localPort;
                console.log(command);
                (0, child_process_1.execSync)(command);
            }
            else {
                (0, child_process_1.execSync)('nc -z -w5 localhost ' + localPort);
            }
            // Success means port is in use
            //TODO send a ToastMessage to Frontend on Fail.
            console.log("netcat fail");
            return;
            localPort += 1;
        }
        catch (err) {
        }
        const fwd = '' + localPort + ':localhost:' + remotePort;
        const spawned = (0, child_process_1.spawn)('ssh', ['-L', fwd, hostName, '-N'], { "env": HostsStateManager_1.HostsStateManager.instance.sshEnv });
        const getProcessFromList = this.getProcessFromList;
        spawned.on('exit', function (errCode) {
            const ref = HostsStateManager_1.HostsStateManager.instance.getHostState(hostName);
            let procInfo = getProcessFromList(ref.remoteProcesses, remotePort);
            if (procInfo) {
                let procInfoIndex = ref.remoteProcesses.indexOf(procInfo);
                procInfo.state = "dead";
                ref.remoteProcesses[procInfoIndex]['state'] = "dead";
                HostsStateManager_1.HostsStateManager.instance.updateHostState(hostName, ref);
            }
            try {
                HostsStateManager_1.HostsStateManager.instance.pushToFrontend();
            }
            catch (err) {
                // Will fail if app is exiting
            }
        });
        this.subProcesses.push(spawned);
        this.waitForTunnel(spawned, hostName, remotePort, localPort);
    }
    stopForwardedPort(hostName, remotePort) {
        const ref = HostsStateManager_1.HostsStateManager.instance.getHostState(hostName);
        const proc = this.getProcessFromList(ref.remoteProcesses, remotePort);
        if (proc != null && proc.sshAgentPid != null) {
            (0, child_process_1.execSync)("kill " + proc.sshAgentPid);
        }
        const newProcessList = ref.remoteProcesses.filter(function (el) {
            return el.sshAgentPid != proc.sshAgentPid;
        });
        HostsStateManager_1.HostsStateManager.instance.updateHostState(hostName, Object.assign(Object.assign({}, ref), { remoteProcesses: newProcessList }));
        HostsStateManager_1.HostsStateManager.instance.pushToFrontend();
    }
    waitForTunnel(spawnedProc, hostName, remotePort, localPort) {
        return __awaiter(this, void 0, void 0, function* () {
            // Wait for the SSH tunnel to be established by repeatedly calling
            // lsof until the connection is shown (with a 1s sleep between calls),
            // timing out after 10 attempts
            const tries = 10;
            const pid = spawnedProc.pid;
            const re = new RegExp('' + pid, "g");
            let success = false;
            for (let i = 0; i < tries; i++) {
                const sshProcs = '' + (0, child_process_1.execSync)("lsof -P -i -n | grep '^ssh' | awk '{print $2}'");
                const count = (sshProcs.match(re) || []).length;
                // When the tunnel is established, lsof will show over two connections
                // made by the ssh process (for remote TCP port 22, local TCP on local port,
                // and possible duplicates for ipv6)
                if (count >= 2) {
                    success = true;
                    break;
                }
                // Sleep 1s
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
            if (success) {
                console.log('Tunnel established');
                const forwardedURL = 'http://localhost:' + remotePort;
                let hostState = HostsStateManager_1.HostsStateManager.instance.getHostState(hostName);
                let processEntry = this.getProcessFromList(hostState.remoteProcesses, remotePort);
                let processEntryIndex = hostState.remoteProcesses.indexOf(processEntry);
                const title = hostName;
                let faviconURL = null;
                if (processEntry != null && processEntry['command'] != null) {
                    if (processEntry['command'].startsWith('python')) {
                        faviconURL = 'https://www.python.org/favicon.ico';
                    }
                    else if (processEntry['command'].startsWith('node')) {
                        faviconURL = 'https://nodejs.org/favicon.ico';
                    }
                    else if (processEntry['command'].startsWith('ruby')) {
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
                HostsStateManager_1.HostsStateManager.instance.updateHostState(hostName, hostState);
                HostsStateManager_1.HostsStateManager.instance.pushToFrontend();
            }
        });
    }
    setListeners() {
        let subProcesses = this.subProcesses;
        process.on('exit', function () {
            for (let proc of subProcesses) {
                try {
                    proc.kill();
                }
                catch (err) {
                }
            }
        });
    }
}
exports.ProcessManager = ProcessManager;
//# sourceMappingURL=ProcessManager.js.map