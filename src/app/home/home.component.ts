import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {ElectronService} from '../core/services';
import {HostsStateService} from '../core/services/hosts-state.service';
import {ProcessManagerService} from '../core/services/process-manager.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private hostsState;

  constructor(
    private router: Router,
    public hostsStateService: HostsStateService,
    public processManagerService: ProcessManagerService,
    private electron: ElectronService
  ) {
    this.hostsState = this.hostsStateService.hostsState;
  }

  ngOnInit(): void {
    if (this.electron.isElectron) {
      this.electron.ipcRenderer.send('requestFrontendInit', null);
    }
  }

  public sshConfigEdit() {
    this.electron.ipcRenderer.send('sshConfigEdit', null);
  }
}
