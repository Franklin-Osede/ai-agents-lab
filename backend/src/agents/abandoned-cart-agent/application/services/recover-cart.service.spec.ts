import { Test, TestingModule } from '@nestjs/testing';
import { RecoverCartService } from './recover-cart.service';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
import { WhatsAppService } from '../../../../core/integrations/whatsapp.service';
import { EmailPreviewService } from '../../../../core/integrations/email-preview.service';
import { Cart } from '../../domain/entities/cart.entity';
import { CartItem } from '../../domain/value-objects/cart-item.vo';
import { Result } from '../../../../core/domain/shared/value-objects/result';

describe('RecoverCartService', () => {
  let service: RecoverCartService;

  const mockCartRepository = {
    findAbandonedCarts: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
  };

  const mockVoiceAgentService = {
    generateVoiceMessage: jest.fn(),
  };

  const mockWhatsAppService = {
    sendMediaMessage: jest.fn(),
    sendTextMessage: jest.fn(),
    isServiceEnabled: jest.fn(),
  };

  const mockEmailPreviewService = {
    generateCartRecoveryEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecoverCartService,
        {
          provide: 'ICartRepository',
          useValue: mockCartRepository,
        },
        {
          provide: VoiceAgentService,
          useValue: mockVoiceAgentService,
        },
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
        {
          provide: EmailPreviewService,
          useValue: mockEmailPreviewService,
        },
      ],
    }).compile();

    service = module.get<RecoverCartService>(RecoverCartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process abandoned carts correctly', async () => {
    // Arrange
    const item = CartItem.create('prod-1', 'Item A', 1, 100.0).value;
    const cart = Cart.create('cart-1', 'customer-1', [item]).value;
    cart.markAsAbandoned();

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.ok({
        audioUrl: 'http://audio.url',
        script: 'Test script',
        duration: 10,
        channel: 'WHATSAPP',
      }),
    );
    mockWhatsAppService.sendMediaMessage.mockResolvedValue({
      success: true,
      messageId: 'msg-123',
    });

    // Act
    const result = await service.processAbandonedCarts(60);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockCartRepository.findAbandonedCarts).toHaveBeenCalledWith(60);
    expect(mockVoiceAgentService.generateVoiceMessage).toHaveBeenCalled();
    expect(mockWhatsAppService.sendMediaMessage).toHaveBeenCalled();
    expect(cart.recoveryAttempts).toBe(1);
    expect(mockCartRepository.save).toHaveBeenCalledWith(cart);
  });

  it('should return message when no carts found', async () => {
    // Arrange
    mockCartRepository.findAbandonedCarts.mockResolvedValue([]);

    // Act
    const result = await service.processAbandonedCarts();

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.value).toContain('No abandoned carts');
    expect(mockVoiceAgentService.generateVoiceMessage).not.toHaveBeenCalled();
  });

  it('should handle voice generation failure gracefully', async () => {
    // Arrange
    const item = CartItem.create('prod-1', 'Item A', 1, 100.0).value;
    const cart = Cart.create('cart-1', 'cust-1', [item]).value;
    cart.markAsAbandoned();

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.fail(new Error('Voice gen failed')),
    );

    // Act
    await service.processAbandonedCarts();

    // Assert
    expect(mockCartRepository.save).not.toHaveBeenCalled();
    expect(mockWhatsAppService.sendMediaMessage).not.toHaveBeenCalled();
  });

  it('should not recover cart if it cannot be recovered', async () => {
    // Arrange
    const item = CartItem.create('prod-1', 'Item A', 1, 100.0).value;
    const cart = Cart.create('cart-1', 'cust-1', [item]).value;
    cart.markAsAbandoned();
    cart.incrementRecoveryAttempts();
    cart.incrementRecoveryAttempts();
    cart.incrementRecoveryAttempts(); // 3 attempts - cannot be recovered

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);

    // Act
    await service.processAbandonedCarts();

    // Assert
    expect(mockVoiceAgentService.generateVoiceMessage).not.toHaveBeenCalled();
    expect(mockWhatsAppService.sendMediaMessage).not.toHaveBeenCalled();
  });

  it('should handle WhatsApp send failure gracefully', async () => {
    // Arrange
    const item = CartItem.create('prod-1', 'Item A', 1, 100.0).value;
    const cart = Cart.create('cart-1', 'customer-1', [item]).value;
    cart.markAsAbandoned();

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.ok({
        audioUrl: 'http://audio.url',
        script: 'Test',
        duration: 10,
        channel: 'WHATSAPP',
      }),
    );
    mockWhatsAppService.sendMediaMessage.mockResolvedValue({
      success: false,
      error: 'WhatsApp send failed',
    });

    // Act
    await service.processAbandonedCarts();

    // Assert
    expect(mockWhatsAppService.sendMediaMessage).toHaveBeenCalled();
    expect(mockCartRepository.save).not.toHaveBeenCalled(); // Should not save if WhatsApp failed
  });
});
