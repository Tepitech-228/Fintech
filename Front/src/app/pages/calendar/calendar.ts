import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { CalendarData } from '../../resolvers/data.resolver';

interface DayEvent {
  title: string;
  type: 'finance' | 'task' | 'project';
  amount?: number;
}

interface DayCell {
  num: number;
  otherMonth: boolean;
  isToday: boolean;
  events: DayEvent[];
  fullDate: string;
}

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class CalendarPage implements OnInit, OnDestroy {
  year: number;
  month: number;
  eventsByDay: Record<number, DayEvent[]> = {};
  selectedDay: DayCell | null = null;
  selectedDayEvents: DayEvent[] = [];
  showAddForm = false;

  newEvent = { title: '', date: '', type: 'Finance', amount: null as number | null };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {
    const d = new Date();
    this.year = d.getFullYear();
    this.month = d.getMonth();
    this.newEvent.date = d.toISOString().slice(0, 10);
  }

  ngOnInit() {
    const resolved = this.route.snapshot.data as { calendar?: CalendarData };
    if (resolved?.calendar) {
      this.buildEvents(resolved.calendar);
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.buildEvents(res['calendar']);
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  private buildEvents(data: CalendarData) {
    this.eventsByDay = {};
    data.transactions.forEach((t: any) => {
      const d = new Date(t.date).getDate();
      if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
      const catName = t.Category?.name || '';
      this.eventsByDay[d].push({
        title: `${catName}: ${formatCFA(t.amount)}`,
        type: 'finance',
        amount: parseFloat(t.amount)
      });
    });
    (data.tasks || []).forEach((t: any) => {
      if (!t.dueDate) return;
      const dt = new Date(t.dueDate);
      if (dt.getMonth() !== this.month || dt.getFullYear() !== this.year) return;
      const d = dt.getDate();
      if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
      this.eventsByDay[d].push({ title: `✅ ${t.title}`, type: 'task' });
    });
    (data.projects || []).forEach((p: any) => {
      if (!p.endDate) return;
      const dt = new Date(p.endDate);
      if (dt.getMonth() !== this.month || dt.getFullYear() !== this.year) return;
      const d = dt.getDate();
      if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
      this.eventsByDay[d].push({ title: `📁 ${p.name}`, type: 'project' });
    });
  }

  loadData() {
    this.eventsByDay = {};
    const [y, m] = [this.year, this.month + 1];
    const padMonth = String(m).padStart(2, '0');

    this.api.getMonthlyTransactions(String(y), padMonth).then(res => {
      const txns = (res as any)?.transactions || [];
      txns.forEach((t: any) => {
        const d = new Date(t.date).getDate();
        if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
        const catName = t.Category?.name || '';
        this.eventsByDay[d].push({
          title: `${catName}: ${formatCFA(t.amount)}`,
          type: 'finance',
          amount: parseFloat(t.amount)
        });
      });
    });

    this.api.getTasks().then((tasks: any) => {
      (tasks || []).forEach((t: any) => {
        if (!t.dueDate) return;
        const dt = new Date(t.dueDate);
        if (dt.getMonth() !== this.month || dt.getFullYear() !== this.year) return;
        const d = dt.getDate();
        if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
        this.eventsByDay[d].push({ title: `✅ ${t.title}`, type: 'task' });
      });
    });

    this.api.getProjects().then((projects: any) => {
      (projects || []).forEach((p: any) => {
        if (!p.endDate) return;
        const dt = new Date(p.endDate);
        if (dt.getMonth() !== this.month || dt.getFullYear() !== this.year) return;
        const d = dt.getDate();
        if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
        this.eventsByDay[d].push({ title: `📁 ${p.name}`, type: 'project' });
      });
    });
  }

  get monthYear() {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[this.month]} ${this.year}`;
  }

  get calendarDays(): DayCell[] {
    const firstDay = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const daysInPrev = new Date(this.year, this.month, 0).getDate();
    const today = new Date();
    const cells: DayCell[] = [];
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      cells.push({ num: d, otherMonth: true, isToday: false, events: [], fullDate: '' });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && this.month === today.getMonth() && this.year === today.getFullYear();
      const evts = this.eventsByDay[d] || [];
      const fullDate = `${this.year}-${String(this.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ num: d, otherMonth: false, isToday, events: evts.slice(0, 3), fullDate });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ num: d, otherMonth: true, isToday: false, events: [], fullDate: '' });
    }
    return cells;
  }

  onDayClick(day: DayCell) {
    if (day.otherMonth) return;
    this.selectedDay = day;
    this.selectedDayEvents = this.eventsByDay[day.num] || [];
  }

  prevMonth() {
    if (this.month === 0) { this.month = 11; this.year--; }
    else this.month--;
    this.loadData();
  }

  nextMonth() {
    if (this.month === 11) { this.month = 0; this.year++; }
    else this.month++;
    this.loadData();
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }

  addEvent() {
    const title = this.newEvent.title || 'Événement';
    const amount = this.newEvent.amount;
    const amountStr = amount ? `: ${formatCFA(amount)}` : '';
    const dt = new Date(this.newEvent.date);
    const d = dt.getDate();
    if (!this.eventsByDay[d]) this.eventsByDay[d] = [];
    this.eventsByDay[d].push({
      title: `${title}${amountStr}`,
      type: this.newEvent.type === 'Finance' ? 'finance' : this.newEvent.type === 'Tâche' ? 'task' : 'project',
      amount: amount || undefined
    });
    this.newEvent = { title: '', date: new Date().toISOString().slice(0, 10), type: 'Finance', amount: null };
    this.showAddForm = false;
  }

  getEventIcon(type: string) {
    switch (type) {
      case 'finance': return '💰';
      case 'task': return '✅';
      case 'project': return '📁';
      default: return '📌';
    }
  }

  getTotalEvents() {
    return Object.values(this.eventsByDay).reduce((s, arr) => s + arr.length, 0);
  }

  fmtCFA(v: number) { return formatCFA(v); }
}
