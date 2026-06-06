import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { SavingGoal } from '../../models';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './savings.html',
  styles: ['.goal-dot { width:12px; height:12px; border-radius:50%; }']
})
export class SavingsPage implements OnInit, OnDestroy {
  goals: SavingGoal[] = [];
  showForm = false;
  form: Partial<SavingGoal> = { name: '', targetAmount: 0, currentAmount: 0, deadline: '', color: '#10b981' };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { savings?: SavingGoal[] };
    if (resolved?.savings) {
      this.goals = resolved.savings;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.goals = res['savings'] || [];
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  load() { this.api.getSavings().then(d => { this.goals = d; }); }

  format = formatCFA;

  create() {
    this.api.createSavingGoal(this.form as any).then(() => {
      this.load();
      this.showForm = false;
    });
  }

  deleteGoal(id: number) {
    if (confirm('Supprimer ?')) this.api.deleteSavingGoal(id).then(() => this.load());
  }
}
