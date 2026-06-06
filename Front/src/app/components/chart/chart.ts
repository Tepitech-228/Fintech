import { Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import {
  Chart, ChartConfiguration, ArcElement, LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
  BarController, LineController, DoughnutController
} from 'chart.js';

Chart.register(
  ArcElement, LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
  BarController, LineController, DoughnutController
);

@Component({
  standalone: true,
  selector: 'app-chart',
  template: `<div class="chart-container" [style.height.px]="height"><canvas #canvas></canvas></div>`,
  styles: [
    ':host { display: block; width: 100%; }',
    '.chart-container { position: relative; width: 100%; }',
    'canvas { max-width: 100%; max-height: 100%; display:block; }'
  ]
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() height = 250;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private destroyed = false;
  private _config?: ChartConfiguration;

  @Input() set config(c: ChartConfiguration | undefined) {
    this._config = c;
    if (c && !this.destroyed) this.scheduleCreate();
  }
  get config(): ChartConfiguration | undefined { return this._config; }

  ngAfterViewInit() {
    if (this._config && !this.destroyed) this.scheduleCreate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && !this.destroyed) this.scheduleCreate();
  }

  private scheduleCreate() {
    const el = this.canvas?.nativeElement;
    if (el?.isConnected) {
      this.doCreate();
    } else {
      Promise.resolve().then(() => {
        if (!this.destroyed && this.canvas?.nativeElement?.isConnected) {
          this.doCreate();
        }
      });
    }
  }

  private doCreate() {
    if (this.destroyed || !this._config) return;
    try {
      this.chart?.destroy();
      this.chart = new Chart(this.canvas.nativeElement, this._config);
    } catch (e) {
      console.error('Chart error:', e);
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.chart?.destroy();
  }
}
