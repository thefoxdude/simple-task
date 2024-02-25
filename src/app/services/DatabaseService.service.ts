import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, collection, docData, doc, addDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from '../objects/task';
import { User } from '../objects/user';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  firestore: Firestore = inject(Firestore);
  tasks: Task[];
  currentUser: User;

  constructor(private db: Firestore) {
    this.tasks = [];
    this.currentUser = new User();
  }


  getTasks(userId: string): Observable<Task[]> {
    console.log(userId);
    
    return collectionData(collection(this.firestore, 'tasks'), {idField: 'userID'}) as Observable<Task[]>;;
  }

  getUser(userId: string): Observable<User[]> {
    console.log(userId);
    return collectionData(collection(this.firestore, 'users'), {idField: 'userID'}) as Observable<User[]>;
  }

  async saveNewTask(task: Task) {
    await addDoc(collection(this.firestore, 'tasks'), task)
    // let result = await this.db.collection('tasks').add({
    //     taskName: task.taskName,
    //     createdDate: task.createdDate,
    //     details: task.details,
    //     userID: task.userId,
    //     completed: task.completed,
    //     column: task.column
    // });
    console.log('Added document with ID: ', task.id);
  }

  async saveNewUser(userID: string, username: string) {
    let result = await addDoc(collection(this.firestore, 'users'), {
      userId: userID,
      username: username
    });
    console.log('Added user with username: ', result.id);
  }

  async saveToDatabase(currentTask: Task) {
    console.log(currentTask);
    if (this.currentUser?.userID) {
        if (currentTask.id == null) {
          currentTask.createdDate = new Date();
          currentTask.userId = this.currentUser?.userID;
          this.saveNewTask(currentTask);
        } else {
          console.log("updated");
          this.updateTask(currentTask);
        }
    } else {
        console.log('You are not logged in');
    }
    
  }

  async updateTask(task: Task) {
    console.log('updated');
    task.updatedDate = new Date();
    // await updateDoc(doc(this.firestore, 'tasks${task.id}'), {
    //     taskName: task.taskName,
    //     details: task.details,
    //     updatedDate: task.updatedDate,
    //     completed: task.completed,
    //     column: task.column
    // }, {merge: true});
  }

  async deleteTask(task: Task) {
    // this.db.collection('tasks').doc(task.id).delete();
    // console.log("deleted");
  }
  
}
