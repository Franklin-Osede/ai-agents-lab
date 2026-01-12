import { TestBed } from '@angular/core/testing';
import { IntentRegistryService } from './intent-registry.service';

describe('IntentRegistryService', () => {
  let service: IntentRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntentRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return General presets for unknown niche', () => {
    const presets = service.getPresets('unknown');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some((p: any) => p.name === 'Agendar')).toBeTrue();
    expect(presets.some((p: any) => p.name === 'Cancelar')).toBeTrue();
  });

  it('should return Dental presets for dental niche', () => {
    const presets = service.getPresets('dental');
    expect(presets.some((p: any) => p.name === 'Urgencia')).toBeTrue();
    expect(presets.some((p: any) => p.keywords.includes('muela'))).toBeTrue();
  });

  it('should return Physio presets for physio niche', () => {
    const presets = service.getPresets('physio');
    expect(presets.some((p: any) => p.name === 'Dolor Espalda')).toBeTrue();
  });

  it('should return correct keywords for Agendar', () => {
    const presets = service.getPresets('general');
    const agendar = presets.find((p: any) => p.name === 'Agendar');
    expect(agendar).toBeDefined();
    expect(agendar?.keywords).toContain('cita');
    expect(agendar?.keywords).toContain('reservar');
  });
});
