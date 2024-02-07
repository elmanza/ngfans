import { CommonModule } from '@angular/common';
import { Component, Injector, Signal, computed, effect, inject, signal } from '@angular/core';
import { Task } from '../../../models/Taks.model';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';


enum Filters  {
  all = "all",
  completed = "completed",
  pending = "pending"
}

@Component({
  selector: 'app-todolist',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './todolist.component.html',
  styleUrl: './todolist.component.css'
})
export class TodolistComponent {
  private _tasks = signal<Task[]>([]);
  selectedList = signal<Filters>(Filters.all);
  selectedListObject: any = {
    completed: true,
    pending: false
  }
  colorCtrl = new FormControl();
  newTaskCtrl = new FormControl("",{
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.min(3),
      Validators.pattern('^\\S.*$'),
    ]
  });
  private sub: Subscription | null = null;

  filters = Filters;

  injector = inject(Injector);

  constructor(){
    this.sub = this.colorCtrl.valueChanges.subscribe(value => {console.log(value)});
  }

  ngOnInit(){
    const storage = localStorage.getItem("tasks");
    if(storage){
      const tasks = JSON.parse(storage);
      this._tasks.set(tasks);
    }
    this.tasksTracking();
  }

  filterTask = computed(()=>{
    const tasks = this.tasks;
    const filterOption = this.selectedList();

    console.log("****", filterOption);

    const filterMap: any = {
      [Filters.all]: () => tasks,
      [Filters.completed]: ()=> tasks.filter(task => task.completed),
      [Filters.pending]: ()=> tasks.filter(task => !task.completed),
    }
    return filterMap[filterOption]();
  });

  tasksTracking(){
    effect(()=>{
      const tasks = this.tasks;
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }, { injector: this.injector })
  }

  updateOptionTab(filter: Filters){
    this.selectedList.set(filter);
  }

  get tasks() {
    return this._tasks();
  }

  ngOnDestroy(): void {
    if (this.sub !== null) {
      this.sub.unsubscribe();
    }
  }

  private generateUniqueId() {
    const uniqueId = 'xxxxxxxxxx'.replace(/x/g, () => {
      const randomDigit = Math.floor(Math.random() * 16);
      return randomDigit.toString(16);
    });
    return `${uniqueId}`;
  }

  addTask(event: Event){
    // const input = event.target as HTMLInputElement;
    if(this.newTaskCtrl.errors){
      return;
    }
    const newTaks = this.newTaskCtrl.value;
    if(newTaks.length < 2) return;
    this._tasks.update(tasks => [
      ...tasks,
      {
        id: this.generateUniqueId(),
        task: newTaks.trim(),
        completed: false,
        editing: false
      }
    ]);
    this.newTaskCtrl.setValue("");
  }

  removeTask(id: string){
    this._tasks.update(tasks => tasks.filter((task:any) => task.id !== id));
  }

  toggleCompletedTask(id: string, i: number){
    this._tasks.update(tasks => {
      if(tasks[i].id === id) tasks[i].completed = !tasks[i].completed;
      return tasks;
    });
    this.tasksTracking();
  }

  editTasktState(id: string, i: number){
    this._tasks.update(tasks => {
      if(tasks[i].id === id && !tasks[i].completed && !tasks[i].editing) tasks[i].editing = !tasks[i].editing;
      return tasks;
    });
  }

  updateTask(id: string, i: number, title: string){
    this._tasks.update(tasks => {
      if(tasks[i].id === id) {
        tasks[i].task = title;
        tasks[i].editing = false;
      }
      return tasks;
    })
  }

}
