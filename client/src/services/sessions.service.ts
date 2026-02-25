import axios, { AxiosInstance } from 'axios';
import { secrets } from './secrets';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: secrets.backendEndpoint,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Fetch next session
  async getSession() {
    try {
      const response = await this.client.get('/api/session');
      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async createSession(
    name: string,
    duration: number,
    username: string,
    password: string
  ) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }

      const response = await this.client.post('/api/session', {
        name,
        duration,
        username,
        password,
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async updateSession(
    session_id: number,
    active: boolean,
    username: string,
    password: string
  ) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }

      const response = await this.client.put('/api/session', {
        session_id,
        active,
        username,
        password,
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  async viewSessions(username: string, password: string) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }

      const response = await this.client.post('/api/sessions', {
        username,
        password,
      });

      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
    }
  }

  // Centralized error handler
  private handleError(error: unknown) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string })?.message ||
        error.message ||
        'An unexpected error occurred';

      toast.error(message);

      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      toast.error('Unexpected application error');
      console.error('Unknown Error:', error);
    }
  }
}

export default ApiClient;