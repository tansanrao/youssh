import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {PageNotFoundComponent} from './shared/components';

import {HomeRoutingModule} from './home/home-routing.module';
import {DetailRoutingModule} from './detail/detail-routing.module';
import {SettingsRoutingModule} from './settings/settings-routing.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module')
      .then(m => m.HomeModule),
  },
  {
    path: 'detail',
    loadChildren: () => import('./detail/detail.module')
      .then(m => m.DetailModule),
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings/settings.module')
      .then(m => m.SettingsModule),
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'}),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
