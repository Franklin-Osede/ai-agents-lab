import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceChaserService } from './invoice-chaser.service';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { Invoice, EscalationLevel } from '../../domain/entities/invoice.entity';
import { Result } from '../../../../core/domain/shared/value-objects/result';

describe('InvoiceChaserService', () => {
  let service: InvoiceChaserService;

  const mockInvoiceRepository = {
    findOverdueInvoices: jest.fn(),
    save: jest.fn(),
  };

  const mockVoiceAgentService = {
    generateVoiceMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceChaserService,
        {
          provide: 'IInvoiceRepository',
          useValue: mockInvoiceRepository,
        },
        {
          provide: VoiceAgentService,
          useValue: mockVoiceAgentService,
        },
      ],
    }).compile();

    service = module.get<InvoiceChaserService>(InvoiceChaserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should escalate invoice from NONE to LEVEL 1 (Reminder)', async () => {
    // Arrange
    const invoice = Invoice.create('inv-1', 'cust-1', 100, new Date()).value;
    invoice.markAsOverdue(); // Escalation 0

    mockInvoiceRepository.findOverdueInvoices.mockResolvedValue([invoice]);

    // Act
    const result = await service.chaseInvoices();

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(invoice.escalationLevel).toBe(EscalationLevel.GENTLE_REMINDER); // 0 -> 1
    // Email is mocked log, so no voice call expected
    expect(mockVoiceAgentService.generateVoiceMessage).not.toHaveBeenCalled();
    expect(mockInvoiceRepository.save).toHaveBeenCalled();
  });

  it('should escalate invoice from LEVEL 1 to LEVEL 2 (Urgent Voice)', async () => {
    // Arrange
    const invoice = Invoice.create('inv-1', 'cust-1', 100, new Date()).value;
    invoice.markAsOverdue();
    invoice.escalationLevel = EscalationLevel.GENTLE_REMINDER; // Currently Level 1

    mockInvoiceRepository.findOverdueInvoices.mockResolvedValue([invoice]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.ok({ audioUrl: 'http://voice.url' }),
    );

    // Act
    await service.chaseInvoices();

    // Assert
    expect(invoice.escalationLevel).toBe(EscalationLevel.URGENT_MESSAGE); // 1 -> 2
    expect(mockVoiceAgentService.generateVoiceMessage).toHaveBeenCalled();
  });
});
