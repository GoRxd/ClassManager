import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { StatisticsService } from '../../data/statistics.service';
import { AppHeaderComponent } from '../../../../core/components/app-header/app-header.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { TranslationService } from '../../../../core/services/translation.service';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  standalone: true,
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    AppHeaderComponent, TranslatePipe
  ]
})
export class StatisticsPage implements OnInit {
  private service = inject(StatisticsService);
  private translationService = inject(TranslationService);

  @ViewChild('lineCanvas') lineCanvas: ElementRef | undefined;
  @ViewChild('pieCanvas') pieCanvas: ElementRef | undefined;

  lineChart: any;
  pieChart: any;

  constructor() { }

  async ngOnInit() {
    // Wait for view init? actually ionViewDidEnter is safer for canvas
  }

  async ionViewDidEnter() {
    await this.loadCharts();
  }

  async loadCharts() {
    if (this.lineChart) this.lineChart.destroy();
    if (this.pieChart) this.pieChart.destroy();

    const cashFlow = await this.service.getCashFlowData();
    const expenseStruct = await this.service.getExpenseStructureData();

    this.createLineChart(cashFlow);
    this.createPieChart(expenseStruct);
  }

  createLineChart(data: any) {
    if (!this.lineCanvas) return;
    
    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'bar', // Changed to bar for better comparison
      data: {
        labels: data.labels,
        datasets: [
          {
            label: this.translationService.translate('STATISTICS.INCOME'),
            data: data.income,
            backgroundColor: 'rgba(45, 211, 111, 0.7)', // Higher opacity for bars
            borderColor: '#2dd36f',
            borderWidth: 1
          },
          {
            label: this.translationService.translate('STATISTICS.EXPENSES'),
            data: data.expenses,
            backgroundColor: 'rgba(235, 68, 90, 0.7)',
            borderColor: '#eb445a',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createPieChart(data: any) {
    if (!this.pieCanvas) return;

    // Generate colors
    const bgColors = [
      '#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#5260ff', 
      '#92949c', '#f4f5f8', '#222428'
    ];

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: bgColors.slice(0, data.data.length),
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
      }
    });
  }
}
