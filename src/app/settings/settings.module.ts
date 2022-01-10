import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { NbCardModule, NbSelectModule } from '@nebular/theme';

@NgModule({
  declarations: [
    AppSettingsComponent
  ],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    NbCardModule,
    NbSelectModule
  ]
})
export class SettingsModule { }
