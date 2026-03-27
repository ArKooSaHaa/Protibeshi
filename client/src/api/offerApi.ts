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

export async function createOffer(payload: OfferPayload, token: string) {
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
}
