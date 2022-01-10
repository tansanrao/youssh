import {Injectable, NgZone} from '@angular/core';
import {ElectronService} from '.';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HostsStateService {
  public hostsState;
  private updateSubject = new BehaviorSubject<number>(0);
  public onUpdate$ = this.updateSubject.asObservable();

  constructor(private electron: ElectronService, private ngZone: NgZone) {
    if (electron.isElectron) {
      this.setListeners();
    }
  }

  public getHostsState() {
    return this.hostsState;
  }

  public getHostState(hostName) {
    return this.hostsState.find(x => x.hostName === hostName);
  }

  public requestRemotePorts(hostName) {
    this.electron.ipcRenderer.send('requestRemotePorts', hostName);
  }

  public forwardPort(hostName, remotePort) {
    this.electron.ipcRenderer.send('forwardPort', hostName, remotePort);
  }

  public stopForwardedPort(hostName, remotePort) {
    this.electron.ipcRenderer.send('stopForwardedPort', hostName, remotePort);
  }

  private setListeners() {
    this.electron.ipcRenderer.on('updateHostsState', (event, hostsState) => {
      this.ngZone.run(() => {
        this.hostsState = hostsState;
      });
      this.updateSubject.next(this.updateSubject.getValue() + 1);
      console.log('HostsStateService: Updated');
    });

  }
}
