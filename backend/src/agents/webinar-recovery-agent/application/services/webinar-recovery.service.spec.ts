import { Test, TestingModule } from '@nestjs/testing';
import { WebinarRecoveryService } from './webinar-recovery.service';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { WebinarLead } from '../../domain/entities/webinar-lead.entity';
import { Result } from '../../../../core/domain/shared/value-objects/result';

describe('WebinarRecoveryService', () => {
  let service: WebinarRecoveryService;
  // Mock repository and service would be initialized here if needed for deeper tests

  const mockWebinarRepository = {
    findMissedAttendees: jest.fn(),
    save: jest.fn(),
  };

  const mockVoiceAgentService = {
    generateVoiceMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebinarRecoveryService,
        {
          provide: 'IWebinarRepository',
          useValue: mockWebinarRepository,
        },
        {
          provide: VoiceAgentService,
          useValue: mockVoiceAgentService,
        },
      ],
    }).compile();

    service = module.get<WebinarRecoveryService>(WebinarRecoveryService);
    // Service is retrieved, mocks are used directly in tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process webinar recovery correctly', async () => {
    // Arrange
    const lead = WebinarLead.create(
      'lead-1',
      'John Doe',
      'john@example.com',
      'webinar-123',
      false,
      'Test Topic',
    ).value;

    mockWebinarRepository.findMissedAttendees.mockResolvedValue([lead]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.ok({ audioUrl: 'http://video.url' }),
    );

    // Act
    const result = await service.processRecovery('webinar-123');

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockWebinarRepository.findMissedAttendees).toHaveBeenCalledWith('webinar-123');
    expect(mockVoiceAgentService.generateVoiceMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        includeVideo: true, // Crucial for this agent
      }),
    );
    expect(mockWebinarRepository.save).toHaveBeenCalled();
  });

  it('should return message when no leads found', async () => {
    // Arrange
    mockWebinarRepository.findMissedAttendees.mockResolvedValue([]);

    // Act
    const result = await service.processRecovery('webinar-123');

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.value).toContain('No pending recovery leads');
    expect(mockVoiceAgentService.generateVoiceMessage).not.toHaveBeenCalled();
  });
});
