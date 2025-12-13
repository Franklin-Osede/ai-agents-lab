import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  suffix?: string;
  prefix?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface ChannelPerformance {
  channel: 'WhatsApp' | 'Email' | 'SMS';
  sent: number;
  recovered: number;
  rate: number;
  revenue: number;
}

@Component({
  selector: 'app-recovery-performance',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe],
  template: `
    <div class="relative flex h-full min-h-screen w-full flex-col overflow-y-auto pb-20 bg-gray-50 dark:bg-background-dark">
      <!-- Header -->
      <header class="sticky top-0 z-50 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
        <a routerLink="/abandoned-cart" class="icon-btn p-2 text-gray-500 hover:text-primary transition-colors">
          <span class="material-symbols-outlined">arrow_back_ios_new</span>
        </a>
        <h1 class="text-lg font-bold text-gray-900 dark:text-white">Rendimiento de Recuperación</h1>
      </header>

      <!-- Main Metrics Grid -->
      <section class="p-4 grid grid-cols-2 gap-3">
        @for (metric of metrics(); track metric.label) {
          <div class="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{{ metric.label }}</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ metric.prefix }}{{ metric.value | number:'1.0-0' }}{{ metric.suffix }}
            </p>
            <div class="flex items-center gap-1 mt-2">
              <span class="text-xs font-semibold px-1.5 py-0.5 rounded"
                [class.bg-green-50]="metric.change > 0"
                [class.text-green-600]="metric.change > 0"
                [class.bg-red-50]="metric.change < 0"
                [class.text-red-600]="metric.change < 0">
                {{ metric.change > 0 ? '+' : '' }}{{ metric.change }}%
              </span>
              <span class="text-[10px] text-gray-400">vs mes anterior</span>
            </div>
          </div>
        }
      </section>

      <!-- Funnel Chart Mock -->
      <section class="px-4 py-2">
        <div class="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Embudo de Conversión</h3>
          
          <div class="space-y-4">
            <!-- Step 1 -->
            <div class="relative">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">Carritos Abandonados</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ funnelData().abandoned | number }}</span>
              </div>
              <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" style="width: 100%"></div>
              </div>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center -my-1">
              <span class="material-symbols-outlined text-gray-300">arrow_downward</span>
            </div>

            <!-- Step 2 -->
            <div class="relative">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">Mensajes Enviados</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ funnelData().sent | number }}</span>
              </div>
              <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-primary/80 rounded-full" [style.width.%]="(funnelData().sent / funnelData().abandoned) * 100"></div>
              </div>
              <p class="text-[10px] text-right text-gray-400 mt-0.5">95% Tasa de Envío</p>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center -my-1">
              <span class="material-symbols-outlined text-gray-300">arrow_downward</span>
            </div>

            <!-- Step 3 -->
            <div class="relative">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-gray-700 dark:text-gray-300">Clicks / Interacción</span>
                <span class="font-bold text-gray-900 dark:text-white">{{ funnelData().clicked | number }}</span>
              </div>
              <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-primary/60 rounded-full" [style.width.%]="(funnelData().clicked / funnelData().abandoned) * 100"></div>
              </div>
              <p class="text-[10px] text-right text-gray-400 mt-0.5">45% CTR</p>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center -my-1">
              <span class="material-symbols-outlined text-gray-300">arrow_downward</span>
            </div>

            <!-- Step 4 -->
            <div class="relative">
              <div class="flex justify-between text-xs mb-1">
                <span class="font-medium text-emerald-600">Recuperados</span>
                <span class="font-bold text-emerald-600">{{ funnelData().recovered | number }}</span>
              </div>
              <div class="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="(funnelData().recovered / funnelData().abandoned) * 100"></div>
              </div>
              <p class="text-[10px] text-right text-emerald-600 font-medium mt-0.5">{{ funnelData().rate }}% Tasa Global</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Channel Performance -->
      <section class="px-4 py-2">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 px-1">Rendimiento por Canal</h3>
        <div class="space-y-3">
          @for (channel of channelData(); track channel.channel) {
            <div class="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-full flex items-center justify-center"
                  [class.bg-green-100]="channel.channel === 'WhatsApp'"
                  [class.text-green-600]="channel.channel === 'WhatsApp'"
                  [class.bg-blue-100]="channel.channel === 'Email'"
                  [class.text-blue-600]="channel.channel === 'Email'"
                  [class.bg-purple-100]="channel.channel === 'SMS'"
                  [class.text-purple-600]="channel.channel === 'SMS'">
                  <span class="material-symbols-outlined">
                    {{ channel.channel === 'WhatsApp' ? 'chat' : channel.channel === 'Email' ? 'mail' : 'sms' }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ channel.channel }}</p>
                  <p class="text-xs text-gray-500">{{ channel.sent }} envíos</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-gray-900 dark:text-white">\${{ channel.revenue | number:'1.0-0' }}</p>
                <div class="flex items-center justify-end gap-1">
                  <span class="text-xs font-medium" 
                    [class.text-emerald-600]="channel.rate >= 20"
                    [class.text-orange-500]="channel.rate < 20">
                    {{ channel.rate }}% conv.
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </section>
      
      <div class="h-8"></div>
    </div>
  `
})
export class RecoveryPerformanceComponent implements OnInit {
  metrics = signal<PerformanceMetric[]>([]);
  funnelData = signal<any>({});
  channelData = signal<ChannelPerformance[]>([]);

  ngOnInit() {
    this.generateRandomData();
  }

  generateRandomData() {
    // Randomize base values for "live" feel
    const baseRevenue = 15000 + Math.random() * 5000;
    const baseRecovered = 3500 + Math.random() * 1000;
    
    this.metrics.set([
      {
        label: 'Ingresos Totales',
        value: baseRevenue,
        change: 12.5,
        prefix: '$',
        color: 'green'
      },
      {
        label: 'Recuperados',
        value: baseRecovered,
        change: 8.2,
        prefix: '$',
        color: 'blue'
      },
      {
        label: 'Tasa Global',
        value: (baseRecovered / baseRevenue) * 100, // Approx percentage
        change: 2.1,
        suffix: '%',
        color: 'purple'
      },
      {
        label: 'ROI',
        value: 1450, // 14.5x
        change: 5.4,
        suffix: '%',
        color: 'orange'
      }
    ]);

    this.funnelData.set({
      abandoned: 1250 + Math.floor(Math.random() * 100),
      sent: 1180 + Math.floor(Math.random() * 50),
      clicked: 540 + Math.floor(Math.random() * 30),
      recovered: 210 + Math.floor(Math.random() * 20),
      rate: 18.2
    });

    this.channelData.set([
      {
        channel: 'WhatsApp',
        sent: 450,
        recovered: 120,
        rate: 26.5,
        revenue: 18500
      },
      {
        channel: 'Email',
        sent: 680,
        recovered: 85,
        rate: 12.5,
        revenue: 9200
      },
      {
        channel: 'SMS',
        sent: 50,
        recovered: 5,
        rate: 10.0,
        revenue: 450
      }
    ]);
  }
}
