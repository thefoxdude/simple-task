import { Component, AfterViewInit } from '@angular/core';
import { Task, Columns } from './objects/task';
import { Observable } from 'rxjs';
import { AuthenticationService } from './services/AuthenticationService.service';
// import * as clone from 'clone';
import { DatabaseService } from './services/DatabaseService.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'simple-task';
  tasks: Task[] = [];
  objects$: Observable<Task[]> = new Observable<Task[]>;
  email?: string;
  password?: string;
  userId: string;
  username?: string;
  signingUp: boolean;
  currentTask: Task;
  columns = Columns;
  todayTasks: Task[] = [];
  totalTodayTasks: Task[] = [];
  tomorrowTasks: Task[] = [];
  totalTomorrowTasks: Task[] = [];
  thisWeekTasks: Task[] = [];
  totalThisWeekTasks: Task[] = [];
  direction = "";
  originalTask?: Task;
  xDown = null;
  yDown = null;
  showCompleted: boolean;
  touchStartCompleted: boolean = false;
  buildNo: number;
  item: any;
  timerID: any;
  counter: any;
  errorMessages: string[];

  pressHoldEvent: any;
  pressHoldDuration: any;
  
  

  constructor(private authenticationService: AuthenticationService, private dbService: DatabaseService) {
    this.currentTask = new Task();
    this.showCompleted = true;
    this.signingUp = false;
    if (this.authenticationService.isLoggedIn()) {
        let user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log(user);
        this.userId = user.uid;
        this.getUsername(this.userId);
        this.username = user.username;
        this.getTasks();
    } else {
        this.userId = '';
    }
    this.buildNo = 7;
    this.errorMessages = [];
  }

  ngAfterViewInit() {
    if (this.userId == null) {
        (<HTMLElement> document.getElementById("loginModal")).style.display = 'block';
    }
    this.item = document.querySelector("#item");
    this.counter = 0;

    this.pressHoldEvent = new CustomEvent("pressHold");

  // Increase or decreae value to adjust how long
  // one should keep pressing down before the pressHold
  // event fires
    this.pressHoldDuration = 50;
    // this.item.addEventListener("mousedown", this.pressingDown, false);
    // this.item.addEventListener("mouseup", this.notPressingDown, false);
    // this.item.addEventListener("mouseleave", this.notPressingDown, false);

    // this.item.addEventListener("touchstart", this.pressingDown, false);
    // this.item.addEventListener("touchend", this.notPressingDown, false);

    // // Listening for our custom pressHold event
    // this.item.addEventListener("pressHold", this.doSomething, false);
  }

  getUsername(userId: string) {
    this.dbService.getUser(userId).subscribe(username => {
        console.log("Username object: " + username);
        if (username.length > 0) {
          this.username = username[0].username;
        }
    });
  }

  signUp() {
    this.authenticationService.SignUp(this.email!, this.password!, this.username!).then(userId => {
        this.userId = <string> userId;
        this.getUsername(this.userId);
        this.getTasks();
    }, error => {
        console.log("We didn't make it: ", error);
    });
  }
    
  signIn() {
    this.authenticationService.SignIn(this.email!, this.password!).then(userId => {
        this.userId = <string> userId;
        this.getUsername(this.userId);
        this.getTasks();
    }, error => {
        this.showError(error);
        console.log("We didn't make it: ", error);
    });
  }

  showError(error: Error) {
    let email = <HTMLInputElement> document.getElementById('email');
    let password = <HTMLInputElement> document.getElementById('password');
    if (this.email == null || this.password == null) {
        this.flashItem(email);
        this.errorMessages.push('Email is required\n');
        if (this.password == null) {
          this.flashItem(password);
          this.errorMessages.push('Password is required\n');
        }
    } else {
        if (error.toString().includes('email')) {
          this.flashItem(email);
          this.errorMessages.push('Email is incorrect\n');
        } else if (error.toString().includes('password')) {
          this.flashItem(password);
          this.errorMessages.push('Password is incorrect\n');
        }
    }
  }
    
  signOut() {
    this.authenticationService.SignOut();
  }

  showSignUp() {
    this.signingUp = !this.signingUp;
  }

  getTasks() {
    this.objects$ = this.dbService.getTasks(this.userId);
    this.objects$.subscribe(tasks => {
        // console.log(tasks);
        this.tasks = tasks;
        this.updateTasks();
        console.log(this.tasks);
        this.totalTomorrowTasks = this.tasks.filter(x => x.column == Columns.Tomorrow);
        this.totalTodayTasks = this.tasks.filter(x => x.column == Columns.Today).sort(a => {return a.createdDate ? -1 : 1});
        this.totalThisWeekTasks = this.tasks.filter(x => x.column == Columns.ThisWeek).sort(a => {return a.createdDate ? -1 : 1});
        if (!this.showCompleted) {
          this.tomorrowTasks = this.totalTomorrowTasks.filter(x => !x.completed);
          this.todayTasks = this.totalTodayTasks.filter(x => !x.completed);
          this.thisWeekTasks = this.totalThisWeekTasks.filter(x => !x.completed);
        } else {
          this.tomorrowTasks = this.totalTomorrowTasks;
          this.todayTasks = this.totalTodayTasks;
          this.thisWeekTasks = this.totalThisWeekTasks;
        }
        this.tomorrowTasks = this.tomorrowTasks.sort(a => {return a.createdDate ? -1 : 1});
        this.todayTasks = this.todayTasks.sort((a, b) => {return b.createdDate.seconds - a.createdDate.seconds});
        this.thisWeekTasks = this.thisWeekTasks.sort(a => {return a.createdDate ? -1 : 1});
    });
  }

  updateTasks() {
    let today = new Date();
    for (let task of this.tasks) {
        let taskDate = task.createdDate.toDate();
        if (task.updatedDate != null) {
          taskDate = task.updatedDate.toDate();
        }
        let diff = today.valueOf() - taskDate.valueOf();
        let diffDays = Math.floor(diff / (1000 * 3600 * 24)); 
        // console.log(diffDays);
        // console.log(task.taskName + ' ' + task.column);
        if (diffDays > 0) {
          if (task.column == "Tomorrow") {
              task.column = "Today";
              task.updatedDate = today;
              this.dbService.updateTask(task);
          } else if (task.column == "Today") {
              // console.log('Here: ' + task.taskName);
              task.bgColor = '#FFDC7C';
              task.color = 'black';
              if (diffDays > 1) {
                task.bgColor = '#DA674A';
                task.color = 'white';
              }
          } else if (task.column = "This Week") {
              if (diffDays > 2) {
                task.bgColor = '#FFDC7C';
                task.color = 'black';
              }
              if (diffDays > 5) {
                task.bgColor = '#DA674A';
                task.color = 'white';
              }
          }
        }
        if (task.completed) {
          task.bgColor = '#39998E';
          task.color = 'white';
        }
    }
  }

  selectTask(taskId: string) {
    console.log(taskId);
    this.currentTask = this.tasks.find(x => x.id == taskId)!;
    if (!this.currentTask.selected) {
        // this.originalTask = clone<Task>(this.currentTask);
        console.log(this.currentTask);
        this.openModal('taskModal', '');
    }
  }

  createcurrentTask() {
    this.currentTask.createdDate = new Date();
    this.currentTask.userId = this.userId;
    this.tasks.push(this.currentTask);
    this.currentTask = new Task();
    this.closeModal('taskModal');
  }

  

  stopBubble(event: Event) {
    event.stopPropagation();
  }

  openModal(modalName: string, column: string) {
    if (modalName == "taskModal" && this.currentTask.id == null) {
        this.currentTask.column = column;
    }
    (<HTMLElement> document.getElementById(modalName)).style.display = 'block';
  }

  closeModal(modalName: string) {
    this.currentTask = new Task();
    (<HTMLElement> document.getElementById(modalName)).style.display = 'none';
    this.hideHelp();
  }

  getTouches(evt: any) {
    return evt.touches ||             // browser API
            evt.originalEvent.touches; // jQuery
  } 

  handleTouchStart(evt: any, task: Task) {
    const firstTouch = this.getTouches(evt)[0];
    this.xDown = firstTouch.clientX;
    this.yDown = firstTouch.clientY;
    this.touchStartCompleted =  task.completed;
    this.stopBubble(evt);
  };

  handleTouchMove(evt: any, task: Task) {
    if (task.id != null) {
        this.stopBubble(evt);

        let xUp = evt.touches[0].clientX;
        let yUp = evt.touches[0].clientY;
  
        let xDiff = this.xDown! - xUp;
        let yDiff = this.yDown! - yUp;
        console.log(xDiff);
        if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
          if ( xDiff < 0) {
              /* right swipe */
              evt.target.parentNode.style.left = ((-1 * xDiff) - 50) + 'px';
              if (xDiff < -50) {
                if (!task.completed && !this.touchStartCompleted) {
                  //  evt.target.parentNode.previousSibling.firstChild.classList = 'fa fa-check w3-left fox-check';
                    evt.target.parentNode.previousSibling.firstChild.style.display = 'block';
                } else if (task.completed && !evt.target.parentNode.previousSibling.firstChild.classList.contains('fox-delete') && this.touchStartCompleted) {
                    evt.target.parentNode.previousSibling.firstChild.classList = 'fa fa-times-circle w3-left fox-delete';
                }
                evt.target.parentNode.previousSibling.style.display = 'block';
                evt.target.parentNode.previousSibling.style.opacity = -.01 * xDiff;
              }
              if (xDiff < -100) {
                if (!evt.target.parentNode.classList.contains('fox-green') && !this.touchStartCompleted) {
                    this.completeTask(task, evt, true);
                }
              }
              if (xDiff < - 150) {
                if (!evt.target.parentNode.classList.contains('fox-delete') && this.touchStartCompleted) {
                    evt.target.parentNode.classList = 'w3-container draggable-card w3-rest fox-red';
                    task.toDelete = true;
                }
              }
          }
        }
    }
  };

  handleTouchEnd(evt: any, task: Task) {
    if (task.id != null) {
        console.log("ended");
        evt.target.parentNode.style.left = '-50px';
        if (!task.completed) {
          evt.target.parentNode.previousSibling.firstChild.style.display = 'none';
        } else if (task.completed && !this.touchStartCompleted) {
          task.bgColor = '#39998E';
          task.color = 'white';
          this.dbService.updateTask(task);
        } else if (task.completed && this.touchStartCompleted && task.toDelete) {
          task.bgColor = '#b9300e';
          task.color = 'white';
          evt.target.parentNode.previousSibling.firstChild.style.display = 'none';
          evt.target.parentNode.parentNode.classList += ' hidden';
          this.timeout(1500).then(() => {
              this.dbService.deleteTask(task);
          });
        } else if (task.completed && this.touchStartCompleted) {
          evt.target.parentNode.previousSibling.firstChild.classList = 'fa fa-check w3-left fox-check';
        }
        this.xDown = null;
        this.yDown = null;
    }
  }

  timeout(ms: number): Promise<unknown> { //pass a time in milliseconds to this function
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clickCheck(task: Task, evt: any) {
    if (!task.completed) {
        this.completeTask(task, evt, false);
    } else {
        this.uncompleteTask(task, evt.target);
    }
  }

  completeTask(task: Task, evt: any, mobile: boolean) {
    task.completed = true;
    if (mobile) {
        evt.target.parentNode.className += ' fox-green';
    } else {
        evt.target.parentNode.parentNode.className += ' fox-green';
        this.dbService.updateTask(task);
    }
  }

  clickDelete(task: Task, evt: any) {
    task.bgColor = '#b9300e';
    task.color = 'white';
    // evt.target.parentNode.previousSibling.style.display = 'none';
    evt.target.parentNode.parentNode.classList += ' hidden';
    this.timeout(1500).then(() => {
        this.dbService.deleteTask(task);
    });
  }

  uncompleteTask(task: Task, targetCheck: any) {
    task.completed = false;
    task.bgColor = '#e4e1d8';
    task.color = 'black';
    task.updatedDate = new Date();
    this.dbService.updateTask(task);
    targetCheck.parentNode.style.display = 'none';
    targetCheck.parentNode.nextSibling.classList = 'w3-container draggable-card w3-rest';
  }

  changeShow() {
    console.log(this.showCompleted);
    if (!this.showCompleted) {
        this.todayTasks = this.totalTodayTasks;
        this.tomorrowTasks = this.totalTomorrowTasks;
        this.thisWeekTasks = this.totalThisWeekTasks;
    } else {
        this.tomorrowTasks = this.totalTomorrowTasks.filter(x => !x.completed);
        this.todayTasks = this.totalTodayTasks.filter(x => !x.completed);
        this.thisWeekTasks = this.totalThisWeekTasks.filter(x => !x.completed);
    }
  }

  logout() {
    console.log("logout");
    this.authenticationService.SignOut();
    this.tasks = [];
    this.userId = '';
  }

  pressingDown(e: Event, task: Task) {
    // Start the timer
    this.startTimer(e, task);
    e.preventDefault();

    console.log("Pressing!");
  }

  notPressingDown(e: Event) {
    // Stop the timer
    cancelAnimationFrame(this.timerID);
    this.counter = 0;

    console.log("Not pressing!");
  }

  //
  // Runs at 60fps when you are pressing down
  //
  startTimer(e: any, task: Task) {
    console.log("Timer tick!");

    const handler = () => {
        if (this.counter < this.pressHoldDuration) {
          this.timerID = window.requestAnimationFrame(handler);
          this.counter++;
          console.log("inside loop");
        } else {
          console.log("Press threshold reached!");
          e.target.parentNode.parentNode.classList += ' wiggle';
          task.selected = true;
          this.item.dispatchEvent(this.pressHoldEvent);
        }
    }
    window.requestAnimationFrame(handler);
  }

  doSomething(e: Event) {
    console.log("pressHold event fired!");
  }

  async flashItem(item: HTMLInputElement) {
    item.className = 'w3-input w3-border w3-margin-bottom';
    setTimeout(function() {
        item.className += ' fox-flash-red';
    }, 1);
    await this.delay(2000);
    this.errorMessages = [];
  }

  // installPwa(): void {
  //    Pwa.promptEvent.prompt();
  // }

  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

  showHelp() {
    console.log("here");
    this.openModal('helpModal', '');
    let helpContent = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("help-content");
    let helpContent2 = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("help-content2");
    let headers = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("fox-column-header");
    for (let i = 0; i < helpContent.length; i++) {
        helpContent[i].style.display = 'block';
        if (i < helpContent2.length) {
          helpContent2[i].style.display = 'block';
        }
        if (i < headers.length) {
          headers[i].style.zIndex = '6';
        }
    }
  }

  hideHelp() {
    console.log("here");
    let helpContent = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("help-content");
    let helpContent2 = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("help-content2");
    let headers = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("fox-column-header");
    for (let i = 0; i < helpContent.length; i++) {
        helpContent[i].style.display = 'none';
        if (i < helpContent2.length) {
          helpContent2[i].style.display = 'none';
        }
        if (i < headers.length) {
          headers[i].style.zIndex = '1';
        }
    }
  }

  saveRef() {
    this.dbService.saveNewTask(this.currentTask);
  }

  updateTaskRef() {
    this.dbService.updateTask(this.currentTask);
  }
}
