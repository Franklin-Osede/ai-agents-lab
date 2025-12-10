import { Test, TestingModule } from '@nestjs/testing';
import { RecoverCartService } from './recover-cart.service';
import { VoiceAgentService } from '../../../voice-agent/application/services/voice-agent.service';
// import { ICartRepository } from '../../domain/interfaces/cart-repository.interface';
import { Cart } from '../../domain/entities/cart.entity';
import { Result } from '../../../../core/domain/shared/value-objects/result';

describe('RecoverCartService', () => {
  let service: RecoverCartService;

  const mockCartRepository = {
    findAbandonedCarts: jest.fn(),
    save: jest.fn(),
  };

  const mockVoiceAgentService = {
    generateVoiceMessage: jest.fn(),
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
      ],
    }).compile();

    service = module.get<RecoverCartService>(RecoverCartService);
    // Service is retrieved, mocks are used directly in tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process abandoned carts correctly', async () => {
    // Arrange
    const cart = Cart.create('cart-1', 'customer-1', ['Item A'], 100).value;
    cart.markAsAbandoned();

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.ok({ audioUrl: 'http://audio.url' }),
    );

    // Act
    const result = await service.processAbandonedCarts(60);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(mockCartRepository.findAbandonedCarts).toHaveBeenCalledWith(60);
    expect(mockVoiceAgentService.generateVoiceMessage).toHaveBeenCalled();
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
    const cart = Cart.create('cart-1', 'cust-1', ['A'], 100).value;
    cart.markAsAbandoned();

    mockCartRepository.findAbandonedCarts.mockResolvedValue([cart]);
    mockVoiceAgentService.generateVoiceMessage.mockResolvedValue(
      Result.fail(new Error('Voice gen failed')),
    );

    // Act
    await service.processAbandonedCarts();

    // Assert
    // Should verify it logged error but didn't crash
    expect(mockCartRepository.save).not.toHaveBeenCalled(); // Should assume it doesn't increment attempts if failed?
    // Wait, implementation:
    // if (voiceResult.isSuccess) { ... save ... } else { log error }
    // So save should NOT be called. Correct.
  });
});
