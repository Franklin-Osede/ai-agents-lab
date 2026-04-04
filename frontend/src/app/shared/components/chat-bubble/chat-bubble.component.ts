import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceService } from '../../../core/services/voice.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  showTranscript?: boolean;
  isPlaying?: boolean;
  progressPercent?: number;
  currentTime?: string;
  totalTime?: string;
}

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-bubble.component.html',
  styleUrls: ['./chat-bubble.component.scss']
})
export class ChatBubbleComponent implements OnInit {
  private voiceService = inject(VoiceService);
  private translate = inject(TranslateService);
  isChatActive = signal(false);
  isPlaying = signal(false);
  showChips = signal(false);
  private msgIdCounter = 0;
  
  // Chat History
  messages = signal<ChatMessage[]>([]);

  currentChipView = signal<'main' | 'faqs'>('main');
  clickedChips = signal<Set<string>>(new Set());

  private selectedVoiceId = "Lucia"; 

  ngOnInit() {
    this.translate.onLangChange.subscribe(() => {
      this.initGreeting();
    });
    this.initGreeting();
  }

  initGreeting() {
    const display = this.translate.instant('CHAT_BUBBLE.GREETING_DISPLAY');
    const speak = this.translate.instant('CHAT_BUBBLE.GREETING_SPEAK');
    
    // reset if not actively chatting
    if (!this.isChatActive()) {
       this.messages.set([
         { 
           id: this.msgIdCounter++, 
           role: 'assistant', 
           content: display,
           showTranscript: false,
           progressPercent: 0,
           currentTime: '0:00',
           totalTime: '0:00',
           isPlaying: false
         }
       ]);
       this.voiceService.preload(speak, this.selectedVoiceId);
    }
  }

  startChat() {
    this.isChatActive.set(true);
    this.playGreeting();
  }

  playGreeting() {
    this.isPlaying.set(true);
    this.showChips.set(false);
    const speak = this.translate.instant('CHAT_BUBBLE.GREETING_SPEAK');
    this.playVoiceResponse(speak, this.messages()[0].id); 
  }

  toggleTranscript(msgId: number) {
    this.messages.update(msgs => msgs.map(m => m.id === msgId ? { ...m, showTranscript: !m.showTranscript } : m));
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  handleChipClick(chipKey: string) {
    const chipText = this.translate.instant(`CHAT_BUBBLE.${chipKey}`);
    this.addMessage('user', chipText);
    this.showChips.set(false); 
    
    this.clickedChips.update(set => {
      const newSet = new Set(set);
      newSet.add(chipKey);
      return newSet;
    });

    let displayKey = "RES_DEFAULT_DISPLAY";
    let speakKey = "RES_DEFAULT_SPEAK";
    let nextView: 'main' | 'faqs' = this.currentChipView();

    if (chipKey === "CHIP_OPERATIVE_DOUBTS") {
      nextView = 'faqs';
      displayKey = "RES_OP_DOUBTS_DISPLAY";
      speakKey = "RES_OP_DOUBTS_SPEAK";
    } else if (chipKey === "CHIP_BACK_TO_OPTIONS") {
      nextView = 'main';
      displayKey = "RES_BACK_DISPLAY";
      speakKey = "RES_BACK_SPEAK";
    } else if (chipKey === "CHIP_HOW_EVALUATED") {
       displayKey = "RES_EVAL_DISPLAY";
       speakKey = "RES_EVAL_SPEAK";
    } else if (chipKey === "CHIP_HOW_ADAPTED") {
       displayKey = "RES_ADAPT_DISPLAY";
       speakKey = "RES_ADAPT_SPEAK";
    } else if (chipKey === "CHIP_ROI") {
       displayKey = "RES_ROI_DISPLAY";
       speakKey = "RES_ROI_SPEAK";
    } else if (chipKey === "CHIP_TECH") {
       displayKey = "RES_TECH_DISPLAY";
       speakKey = "RES_TECH_SPEAK";
    } else if (chipKey === "CHIP_FILTERING") {
       displayKey = "RES_FILTERING_DISPLAY";
       speakKey = "RES_FILTERING_SPEAK";
    } else if (chipKey === "CHIP_AUDIT") {
       displayKey = "RES_AUDIT_DISPLAY";
       speakKey = "RES_AUDIT_SPEAK";
       setTimeout(() => {
         window.open('https://calendly.com/agentminds', '_blank');
       }, 2000);
    }

    const responseDisplay = this.translate.instant(`CHAT_BUBBLE.${displayKey}`);
    const responseSpeak = this.translate.instant(`CHAT_BUBBLE.${speakKey}`);

    if (responseDisplay) {
      setTimeout(() => {
        this.currentChipView.set(nextView);
        const newMsgId = this.addMessage('assistant', responseDisplay);
        this.playVoiceResponse(responseSpeak, newMsgId);
      }, 500);
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string): number {
    const id = this.msgIdCounter++;
    this.messages.update(msgs => [...msgs, { 
      id, role, content, showTranscript: false, 
      progressPercent: 0, currentTime: '0:00', totalTime: '0:00', isPlaying: false 
    }]);
    this.scrollToBottom();
    return id;
  }

  private updateMessageState(msgId: number, changes: Partial<ChatMessage>) {
    this.messages.update(msgs => msgs.map(m => m.id === msgId ? { ...m, ...changes } : m));
  }

  private playVoiceResponse(text: string, msgId: number) {
    this.isPlaying.set(true);
    this.updateMessageState(msgId, { isPlaying: true, progressPercent: 0, currentTime: '0:00' });

    this.voiceService.speak(text, this.selectedVoiceId).subscribe({
      next: url => {
        if (url) {
          const audio = new Audio(url);
          
          audio.addEventListener('loadedmetadata', () => {
             if (audio.duration && isFinite(audio.duration)) {
                this.updateMessageState(msgId, { totalTime: this.formatTime(audio.duration) });
             }
          });

          audio.addEventListener('timeupdate', () => {
             const duration = audio.duration && isFinite(audio.duration) ? audio.duration : Math.max(audio.currentTime, 1);
             const progress = (audio.currentTime / duration) * 100;
             this.updateMessageState(msgId, {
                currentTime: this.formatTime(audio.currentTime),
                progressPercent: Math.min(progress, 100)
             });
             
             if (audio.duration && isFinite(audio.duration)) {
                this.updateMessageState(msgId, { totalTime: this.formatTime(audio.duration) });
             }
          });

          audio.onended = () => {
             this.isPlaying.set(false);
             this.showChips.set(true);
             this.updateMessageState(msgId, { isPlaying: false, progressPercent: 100 });
          };
          
          audio.play().catch(e => {
            this.isPlaying.set(false);
            this.showChips.set(true);
            this.updateMessageState(msgId, { isPlaying: false, progressPercent: 100 });
          });
        } else {
          this.isPlaying.set(false);
          this.showChips.set(true);
          this.updateMessageState(msgId, { isPlaying: false });
        }
      },
      error: () => {
        this.isPlaying.set(false);
        this.showChips.set(true);
        this.updateMessageState(msgId, { isPlaying: false });
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
       const el = document.getElementById('chat-messages-container');
       if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  }

  closeChat() {
    this.isChatActive.set(false);
  }
}
