import {Component, OnDestroy, OnInit} from '@angular/core';
import {NbSidebarService, NbMenuService} from '@nebular/theme';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {


  constructor(private sidebarService: NbSidebarService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    return false;
  }
}
