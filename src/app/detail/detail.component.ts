import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {HostsStateService} from '../core/services/hosts-state.service';
import {ElectronService} from '../core/services';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, OnDestroy {
  public hostName;
  public hostState;
  private hostsStateSub;

  constructor(
    public route: ActivatedRoute,
    private electron: ElectronService,
    private ngZone: NgZone,
    public hostStateService: HostsStateService
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.hostName = params.hostName;
    });
    this.hostStateService.requestRemotePorts(this.hostName);
    this.hostsStateSub = this.hostStateService.onUpdate$.subscribe(event => {
      this.ngZone.run(() => {
        this.hostState = this.hostStateService.getHostState(this.hostName);
      });
    });
    this.hostState = this.hostStateService.getHostState(this.hostName);
  }

  ngOnDestroy() {
    this.hostsStateSub.unsubscribe();
  }
}
