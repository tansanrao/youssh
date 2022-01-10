import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppSettingsComponent } from './app-settings/app-settings.component';

const routes: Routes = [
  {
    path: 'app',
    component: AppSettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
