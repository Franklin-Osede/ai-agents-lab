/**
 * Cart Models
 * 
 * TypeScript interfaces and types for abandoned cart domain
 */

export enum CartStatus {
  OPEN = 'OPEN',
  ABANDONED = 'ABANDONED',
  RECOVERED = 'RECOVERED',
  LOST = 'LOST',
}

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  company?: string;
  totalOrders?: number;
  totalSpent?: number;
  isVip?: boolean;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  customer?: Customer;
  items: CartItem[];
  totalValue: number;
  status: CartStatus;
  createdAt: Date;
  lastModifiedAt: Date;
  recoveryAttempts: number;
  orderId?: string;
  recoveryProbability?: number;
}

export interface CartMetrics {
  abandonedToday: number;
  totalValue: number;
  recoveryRate: number;
  recoveredRevenue: number;
  abandonedTodayChange?: number;
  totalValueChange?: number;
  recoveryRateChange?: number;
  recoveredRevenueChange?: number;
}

export interface RecoveryStrategy {
  channel: 'WHATSAPP' | 'EMAIL' | 'SMS';
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue?: number;
  discountCode?: string;
  expirationHours?: number;
  message?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  audience: {
    type: string;
    count: number;
  };
  message: {
    type: string;
    content: string;
  };
  offer?: {
    type: string;
    value: number;
    code?: string;
    expirationHours?: number;
  };
  sentAt?: Date;
  results?: CampaignResults;
}

export interface CampaignResults {
  totalSent: number;
  totalOpened: number;
  totalRecovered: number;
  totalValue: number;
  roi: number;
  recoveryRate: number;
  details: CampaignResultDetail[];
}

export interface CampaignResultDetail {
  customerId: string;
  customerName: string;
  status: 'RECOVERED' | 'PENDING' | 'SENT' | 'IGNORED';
  value: number;
  timestamp: Date;
}

export interface EmailPreview {
  html: string;
  text: string;
  subject: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isEnabled: boolean;
}

