export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Bundle {
  id: string;
  name: string;
  diamonds: number;
  price: number;
  currency: string;
  category: 'diamonds' | 'weekly' | 'monthly';
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  playerId: string;
  bundleId: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: string;
  transactionId?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt: any;
}
