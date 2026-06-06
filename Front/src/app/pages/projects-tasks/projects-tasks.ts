import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { Project, Task } from '../../models';
import type { ProjectsTasksData } from '../../resolvers/data.resolver';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './projects-tasks.html'
})
export class ProjectsTasksPage implements OnInit, OnDestroy {
  tab: 'projets' | 'taches' = 'projets';

  projects: Project[] = [];
  tasks: Task[] = [];

  showProjectForm = false;
  projectForm: Partial<Project> = { name: '', description: '', budget: 0, spent: 0, startDate: '', endDate: '', color: '#6366f1' };

  showTaskForm = false;
  taskForm: Partial<Task> = { title: '', priority: 'medium', description: '', dueDate: '', category: '' };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { projectsTasks?: ProjectsTasksData };
    if (resolved?.projectsTasks) {
      this.projects = resolved.projectsTasks.projects;
      this.tasks = resolved.projectsTasks.tasks;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        const d = res['projectsTasks'] as ProjectsTasksData;
        this.projects = d.projects;
        this.tasks = d.tasks;
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  loadProjects() { this.api.getProjects().then(d => this.projects = d); }
  loadTasks() { this.api.getTasks().then(d => this.tasks = d); }

  createProject() {
    this.api.createProject(this.projectForm as any).then(() => {
      this.loadProjects(); this.showProjectForm = false;
      this.projectForm = { name: '', description: '', budget: 0, spent: 0, startDate: '', endDate: '', color: '#6366f1' };
    });
  }

  deleteProject(id: number) {
    if (confirm('Supprimer ?')) this.api.deleteProject(id).then(() => this.loadProjects());
  }

  toggleTask(t: Task) {
    this.api.updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' }).then(() => this.loadTasks());
  }

  createTask() {
    this.api.createTask(this.taskForm as any).then(() => {
      this.loadTasks(); this.showTaskForm = false;
      this.taskForm = { title: '', priority: 'medium', description: '', dueDate: '', category: '' };
    });
  }

  deleteTask(id: number) {
    if (confirm('Supprimer ?')) this.api.deleteTask(id).then(() => this.loadTasks());
  }

  format = formatCFA;
}
