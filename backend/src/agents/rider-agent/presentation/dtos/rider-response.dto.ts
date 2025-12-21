export class OrderItemDto {
  item: string;
  quantity: number;
  notes?: string;
}

export class BookingDetailsDto {
  partySize?: number;
  time?: string;
  date?: string;
}

export enum AiIntent {
  RIDE_REQUEST = 'ride_request',
  DELIVERY_REQUEST = 'delivery_request',
  BOOKING_REQUEST = 'booking_request',
  SEARCH_REQUEST = 'search_request',
  STATUS_CHECK = 'status_check',
  CANCEL_RIDE = 'cancel_ride',
  UNKNOWN = 'unknown',
}

export class AiInterpretationDto {
  pickup?: string;
  dropoff?: string;
  order_items?: OrderItemDto[];
  booking_details?: BookingDetailsDto[];
  search_term?: string;
  intent: AiIntent;
  restaurants?: unknown[]; // Populated for SEARCH_REQUEST
  message?: string; // Agent verbal response text
}

export class RiderResponseDto {
  status: string;
  ai_interpretation: AiInterpretationDto;
  next_step: string;
  orderId?: string;
  price?: number;
}
