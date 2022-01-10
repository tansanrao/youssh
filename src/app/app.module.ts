import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule, HttpClient} from '@angular/common/http';
import {CoreModule} from './core/core.module';
import {SharedModule} from './shared/shared.module';

import {AppRoutingModule} from './app-routing.module';

// NG Translate
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

import {HomeModule} from './home/home.module';
import {DetailModule} from './detail/detail.module';

import {AppComponent} from './app.component';
import {NbEvaIconsModule} from '@nebular/eva-icons';
import {
  NbThemeModule,
  NbSidebarModule,
  NbMenuModule,
  NbDatepickerModule,
  NbIconModule,
  NbSelectModule,
  NbUserModule,
  NbActionsModule,
  NbContextMenuModule,
  NbSearchModule,
  NbLayoutModule,
  NbButtonModule,
  NbCardModule
} from '@nebular/theme';
import {HeaderComponent} from './partials/header/header.component';
import {FooterComponent} from './partials/footer/footer.component';
import {HostsStateService} from './core/services/hosts-state.service';
import {ProcessManagerService} from './core/services/process-manager.service';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader => new TranslateHttpLoader(http, './assets/i18n/', '.json');

@NgModule({
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    HomeModule,
    DetailModule,
    AppRoutingModule,
    NbThemeModule.forRoot({name: 'default'}),
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbIconModule,
    NbSelectModule,
    NbUserModule,
    NbActionsModule,
    NbContextMenuModule,
    NbSearchModule,
    NbLayoutModule,
    NbEvaIconsModule,
    NbButtonModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [HostsStateService, ProcessManagerService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
