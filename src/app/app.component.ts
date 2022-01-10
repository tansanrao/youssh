import {Component, OnInit} from '@angular/core';
import {ElectronService} from './core/services';
import {TranslateService} from '@ngx-translate/core';
import {APP_CONFIG} from '../environments/environment';
import {NbMenuItem} from '@nebular/theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public menu: NbMenuItem[] = [
    {
      title: 'Home',
      link: '/home',
      icon: 'home-outline',
    },
    {
      title: 'Settings',
      link: '/settings/app',
      icon: 'settings-outline',
    }
  ];

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang('en');
    if (this.electronService.isElectron) {
      console.log('Running in electron');
    } else {
      console.log('Running in browser');
    }
  }
}
