import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { NbButtonModule, NbCardModule, NbIconModule, NbListModule } from '@nebular/theme';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    SharedModule,
    HomeRoutingModule,
    NbCardModule,
    NbListModule,
    NbButtonModule,
    NbIconModule
  ]
})
export class HomeModule {}
