import axios from 'axios';
import { apiConfig } from '@/services/api/client';

export interface OfferPayload {
  short_summary: string;
  description: string;
  help_types: string[];
  availability: string[];
  service_radius: number;
  contact_preference: string;
  is_recurring: boolean;
}

export interface OfferApiUser {
  id: number | null;
  name: string | null;
}

export interface OfferApiItem {
  id: number;
  user_id: number;
  short_summary: string;
  description: string;
  help_types: string[];
  availability: string[];
  service_radius: number | null;
  contact_preference: 'in_app' | 'phone';
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  user?: OfferApiUser | null;
}

type GetOffersResponse = {
  message?: string;
  data?: OfferApiItem[];
};

export async function createOffer(payload: OfferPayload, token: string) {
  try {
    const res = await axios.post(
      `${apiConfig.baseURL}/api/offers`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseMessage = error.response?.data?.message;
      throw new Error(responseMessage || error.message || 'Failed to create offer');
    }

    throw error;
  }
}

export async function getOffers() {
  const res = await axios.get<GetOffersResponse>(`${apiConfig.baseURL}/api/offers`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return Array.isArray(res.data?.data) ? res.data.data : [];
}
