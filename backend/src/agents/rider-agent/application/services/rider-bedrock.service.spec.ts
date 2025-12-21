import { Test, TestingModule } from '@nestjs/testing';
import { RiderBedrockService } from './rider-bedrock.service';
import { ConfigService } from '@nestjs/config';

// Mock the AWS SDK response structure
const mockSend = jest.fn();

describe('RiderBedrockService', () => {
  let service: RiderBedrockService;

  beforeEach(async () => {
    mockSend.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiderBedrockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('us-east-1'),
          },
        },
      ],
    }).compile();

    service = module.get<RiderBedrockService>(RiderBedrockService);

    // Manual mock injection for the private client property
    // We are mocking the 'send' method of the BedrockClient
    (service as any).client = {
      send: mockSend,
    };
  });

  it('should parse a food delivery request', async () => {
    // 1. Prepare Mock Response Data
    const mockAiResponse = {
      pickup: 'Burger King',
      dropoff: 'Current Location',
      order_items: [{ item: 'Whopper', quantity: 2, notes: 'no onions' }],
      booking_details: {},
      intent: 'delivery_request',
    };

    // 2. Mock the implementation of the send command
    // Bedrock returns a Uint8Array body
    mockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [{ text: JSON.stringify(mockAiResponse) }],
        }),
      ),
    });

    // 3. Act
    const result = await service.extractRideIntent('I want 2 Whoppers from Burger King, no onions');

    // 4. Assert
    expect(result.intent).toBe('delivery_request');
    expect(result.pickup).toBe('Burger King');
    expect(result.order_items).toHaveLength(1);
    expect(result.order_items![0].item).toBe('Whopper');
    expect(result.order_items![0].quantity).toBe(2);
    expect(result.order_items![0].notes).toBe('no onions');
  });

  it('should parse a table booking request', async () => {
    // 1. Prepare Mock Response Data
    const mockAiResponse = {
      pickup: 'Italian Place',
      dropoff: null,
      order_items: [],
      booking_details: [{ partySize: 2, time: '20:00', date: '2023-12-25' }],
      intent: 'booking_request',
    };

    // 2. Mock the implementation
    mockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [{ text: JSON.stringify(mockAiResponse) }],
        }),
      ),
    });

    // 3. Act
    const result = await service.extractRideIntent(
      'Book a table for 2 at Italian Place for 8pm on Christmas',
    );

    // 4. Assert
    expect(result.intent).toBe('booking_request');
    expect(result.booking_details![0].partySize).toBe(2);
    expect(result.booking_details![0].time).toBe('20:00');
  });

  it('should handle invalid JSON from Bedrock gracefully', async () => {
    // 1. Mock a corrupted response
    mockSend.mockResolvedValue({
      body: new TextEncoder().encode(
        JSON.stringify({
          content: [{ text: 'This is not JSON' }],
        }),
      ),
    });

    // 2. Act
    const result = await service.extractRideIntent('Some garbage input');

    // 3. Assert - logic currently catches error and returns unknown
    expect(result.intent).toBe('unknown');
  });
});
