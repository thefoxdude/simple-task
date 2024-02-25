import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from "../environments/environment";
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from './services/AuthenticationService.service';
import { DatabaseService } from './services/DatabaseService.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AngularFireModule } from '@angular/fire/compat';


@NgModule({
   declarations: [
      AppComponent
   ],
   imports: [
      BrowserModule,
      AngularFireModule.initializeApp(environment.firebaseConfig),
      provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
      provideFirestore(() => getFirestore()),
      ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
      FormsModule
   ],
   providers: [
      AuthenticationService,
      DatabaseService
   ],
   bootstrap: [AppComponent]
})
export class AppModule { }
