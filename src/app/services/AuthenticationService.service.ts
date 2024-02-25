import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { DatabaseService } from './DatabaseService.service';

@Injectable({
providedIn: 'root'
})

export class AuthenticationService {
   userData: any;

   constructor(private angularFireAuth: AngularFireAuth, private dbSerivce: DatabaseService) {
      this.userData = angularFireAuth.authState;
      this.angularFireAuth.authState.subscribe(user => {
         if (user) {
            this.userData = user;
            localStorage.setItem('user', JSON.stringify(this.userData));
            //JSON.parse(localStorage.getItem('user'));
         } else {
            localStorage.setItem('user', '');
            //JSON.parse(localStorage.getItem('user'));
         }
         
      });
   }

   /* Sign up */
   SignUp(email: string, password: string, username: string): Promise<unknown> {
      let promise = new Promise((resolve, reject) => {
         this.angularFireAuth
         .createUserWithEmailAndPassword(email, password)
         .then(res => {
            console.log('You are Successfully signed up!', res);
            this.angularFireAuth.currentUser.then(user => {
              if (user) {
                console.log(user.uid);
                this.dbSerivce.saveNewUser(user.uid, username);
                resolve(user.uid);
              }
            });
         })
         .catch(err => {
            console.log('Something is wrong:',err.message);
            reject(err.message);
         });
      });
      return promise;
   }

   /* Sign in */
   SignIn(email: string, password: string): Promise<unknown> {
      let promise = new Promise((resolve, reject) => {
         this.angularFireAuth
         .signInWithEmailAndPassword(email, password)
         .then(res => {
            console.log('You are Successfully logged in!');
            this.angularFireAuth.currentUser.then(user => {
               this.userData = user;
               localStorage.setItem('user', JSON.stringify(this.userData));
               //JSON.parse(localStorage.getItem('user'));
               resolve(user?.uid);
               // console.log(user.uid);
            });
         })
         .catch(err => {
            console.log('Something is wrong:',err.message);
            reject(err.message);
         });
      });
      return promise;
   }

   isLoggedIn(): boolean {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user !== '{}' ? true : false;
   }

   /* Sign out */
   SignOut() {
      this.angularFireAuth.signOut().then(() => {
         localStorage.removeItem('user');
      });
   }

}