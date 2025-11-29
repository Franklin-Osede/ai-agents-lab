import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoicePlayerComponent } from './voice-player.component';

describe('VoicePlayerComponent', () => {
  let component: VoicePlayerComponent;
  let fixture: ComponentFixture<VoicePlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VoicePlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VoicePlayerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasAudio', () => {
    it('should return true when audioUrl exists', () => {
      // Arrange
      component.audioUrl = 'https://example.com/audio.mp3';

      // Act & Assert
      expect(component.hasAudio()).toBe(true);
    });

    it('should return false when audioUrl is empty', () => {
      // Arrange
      component.audioUrl = '';

      // Act & Assert
      expect(component.hasAudio()).toBe(false);
    });
  });

  describe('hasVideo', () => {
    it('should return true when videoUrl exists', () => {
      // Arrange
      component.videoUrl = 'https://example.com/video.mp4';

      // Act & Assert
      expect(component.hasVideo()).toBe(true);
    });

    it('should return false when videoUrl is empty', () => {
      // Arrange
      component.videoUrl = '';

      // Act & Assert
      expect(component.hasVideo()).toBe(false);
    });
  });

  describe('display', () => {
    it('should display audio player when audioUrl exists', () => {
      // Arrange
      component.audioUrl = 'https://example.com/audio.mp3';
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const audioPlayer = compiled.querySelector('audio');

      // Assert
      expect(audioPlayer).toBeTruthy();
    });

    it('should display video player when videoUrl exists', () => {
      // Arrange
      component.videoUrl = 'https://example.com/video.mp4';
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const videoPlayer = compiled.querySelector('video');

      // Assert
      expect(videoPlayer).toBeTruthy();
    });
  });
});
