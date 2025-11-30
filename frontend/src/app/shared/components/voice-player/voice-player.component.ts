import { Component, Input } from '@angular/core';

/**
 * VoicePlayerComponent
 * 
 * Displays audio and video players for voice messages.
 * Follows Single Responsibility Principle - only handles media playback.
 */
@Component({
  selector: 'app-voice-player',
  templateUrl: './voice-player.component.html',
  styleUrls: ['./voice-player.component.scss'],
})
export class VoicePlayerComponent {
  @Input() audioUrl?: string;
  @Input() videoUrl?: string;
  @Input() script?: string;
  @Input() duration?: number;
  @Input() estimatedCost?: number;

  hasAudio(): boolean {
    return !!this.audioUrl && this.audioUrl.length > 0;
  }

  hasVideo(): boolean {
    return !!this.videoUrl && this.videoUrl.length > 0;
  }

  formatDuration(seconds?: number): string {
    if (!seconds) {
      return 'N/A';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
