import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {DetailRoutingModule} from './detail-routing.module';

import {DetailComponent} from './detail.component';
import {SharedModule} from '../shared/shared.module';
import {NbButtonModule, NbCardModule, NbIconModule} from '@nebular/theme';

@NgModule({
  declarations: [DetailComponent],
  imports: [CommonModule, SharedModule, DetailRoutingModule, NbCardModule, NbIconModule, NbButtonModule]
})
export class DetailModule {
}
