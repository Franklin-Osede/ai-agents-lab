export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  features: string[];
  endpoint: string;
  color: string;
}

export interface BookingEntities {
  dates: string[];
  times: string[];
  services: string[];
  location?: string;
  people?: number;
}

export interface AgentResponse {
  success: boolean;
  message?: string;
  response?: string;
  suggestedTimes?: string[];
  bookingId?: string;
  intent?: {
    type: string;
    confidence: number;
  };
  entities?: BookingEntities;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedNextSteps?: string[];
  toolCalls?: { name: string; args: any }[];
  // Voice agent specific fields
  script?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  estimatedCost?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  intent?: {
    type: string;
    confidence: number;
  };
  isSystem?: boolean;
  // Audio message properties (WhatsApp-style)
  isAudioMessage?: boolean;
  audioPlaying?: boolean;
  audioDuration?: number;
  showTranscript?: boolean;
}

