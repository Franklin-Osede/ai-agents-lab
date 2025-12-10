import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';

interface DaySlot {
  date: Date;
  isCurrentMonth: boolean;
  status: 'none' | 'partial' | 'full' | 'busy'; // Simplified status for the day view
  slots: { time: string; status: 'available' | 'busy' }[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnChanges {
  @Input() currentDate: Date = new Date();
  @Input() availableSlots: string[] = []; // Slots from agent availability check
  @Output() slotSelected = new EventEmitter<string>();
  @Output() checkAvailability = new EventEmitter<Date>();
  @Output() confirm = new EventEmitter<void>(); // New event for button

  calendarDays: DaySlot[] = [];
  selectedDay: DaySlot | null = null;
  calendarData: { selectedSlot: string | null } = { selectedSlot: null };
  
  // Header details
  currentMonthName: string = '';
  currentYear: number = 2024;

  constructor() {}

  ngOnInit(): void {
    this.generateCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentDate']) {
      this.generateCalendar();
    }
    if (changes['availableSlots'] && this.selectedDay) {
      // Update slots when availableSlots change
      this.updateSlotsFromAvailable();
    }
  }
  
  /**
   * Update slots for selected day based on availableSlots from agent
   */
  private updateSlotsFromAvailable(): void {
    if (!this.selectedDay || this.availableSlots.length === 0) {
      return;
    }
    
    // Convert availableSlots (strings like "10:00") to slot format
    this.selectedDay.slots = this.availableSlots.map(time => ({
      time,
      status: 'available' as const,
    }));
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentMonthName = this.currentDate.toLocaleString('default', { month: 'long' });
    this.currentYear = year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    this.calendarDays = [];

    // Padding for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const prevDate = new Date(year, month, -startingDayOfWeek + 1 + i);
        this.calendarDays.push({ 
            date: prevDate, 
            isCurrentMonth: false, 
            status: 'none',
            slots: [] 
        });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const daySlot: DaySlot = {
            date: date,
            isCurrentMonth: true,
            status: 'none',
            slots: []
        };
        
        // Mark as available if it's in the future and not weekend (for demo)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const slotDate = new Date(date);
        slotDate.setHours(0, 0, 0, 0);
        
        // Mark days as available if they're in the future and not weekends
        if (slotDate >= today && date.getDay() !== 0 && date.getDay() !== 6) {
          daySlot.status = 'partial'; // Available day
        }
        
        this.calendarDays.push(daySlot);
    }
    
    // Select the currentDate passed from parent if it's in this view
    const found = this.calendarDays.find(d => this.isSameDate(d.date, this.currentDate));
    if (found) {
        this.selectedDay = found;
        if (this.availableSlots.length > 0) {
          this.updateSlotsFromAvailable();
        } else {
          this.generateMockSlotsForDay(found);
        }
    }
  }
  
  onDayClick(day: DaySlot) {
      this.selectedDay = day;
      
      // If we have availableSlots from agent, use them
      if (this.availableSlots.length > 0 && this.isSameDate(day.date, this.currentDate)) {
        this.updateSlotsFromAvailable();
      } else {
        // Otherwise generate mock slots
        this.generateMockSlotsForDay(day);
      }
  }

  generateMockSlotsForDay(day: DaySlot) {
      // If we already have slots, don't regen to keep consistency during session? 
      // For demo, let's regen or keep if populated.
      if (day.slots.length > 0) return;

      const workingHours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
      const slots = [];
      
      for (const time of workingHours) {
          // Randomly assign busy or available
          // 30% chance of being busy
          const isBusy = Math.random() < 0.3;
          slots.push({
              time,
              status: isBusy ? 'busy' : 'available'
          });
      }
      
      day.slots = slots as any; // Cast for strict typing if needed
  }

  isSameDate(d1: Date, d2: Date): boolean {
      return d1.getDate() === d2.getDate() && 
             d1.getMonth() === d2.getMonth() && 
             d1.getFullYear() === d2.getFullYear();
  }

  isToday(date: Date): boolean {
      return this.isSameDate(date, new Date());
  }

  onSlotClick(time: string, status: string): void {
      if (status === 'busy') return;
      this.calendarData.selectedSlot = time;
  }

  changeMonth(delta: number) {
      this.currentDate = new Date(this.currentDate.setMonth(this.currentDate.getMonth() + delta));
      this.generateCalendar();
  }

  getMorningSlots(slots: any[]) {
      return slots.filter(s => parseInt(s.time.split(':')[0]) < 12);
  }

  getAfternoonSlots(slots: any[]) {
      return slots.filter(s => parseInt(s.time.split(':')[0]) >= 12);
  }

  confirmSelection() {
      if (this.calendarData.selectedSlot) {
          this.slotSelected.emit(this.calendarData.selectedSlot);
          this.confirm.emit();
      }
  }

  triggerCheckAvailability() {
      // Simulate a refresh or just emit
      this.checkAvailability.emit(this.currentDate);
      // For visual effect, let's clear slots of selected day and regen
      if (this.selectedDay) {
          this.selectedDay.slots = [];
          setTimeout(() => {
              if (this.selectedDay) this.generateMockSlotsForDay(this.selectedDay);
          }, 500);
      }
  }
}
