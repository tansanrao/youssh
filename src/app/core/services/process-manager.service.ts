import {Injectable, NgZone} from '@angular/core';
import {ElectronService} from './electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessManagerService {
  public subProcesses;

  constructor(private electron: ElectronService, private ngZone: NgZone) {
    this.setListeners();
  }

  private setListeners() {
    this.electron.ipcRenderer.on('updateSubProcesses', (event, subProcesses) => {
      this.ngZone.run(() => {
        this.subProcesses = subProcesses;
      });
      console.log('HostsStateService: Update Received');
    });
  }
}
