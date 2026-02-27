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

  // currently, only fetches 1 session greater than current time
  async getSession() {
    try {
      const response = await this.client.get('/api/session');
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createSession(name: string, duration: number, username: string, password: string) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }
      const response = await this.client.post('/api/session', { name, duration, username, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateSession(session_id: number, active: boolean, username: string, password: string) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }

      const response = await this.client.put('/api/session', { session_id, active, username, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async submitAttendance(roll: number) {
    try {
      const response = await this.client.post('/api/attendance', { roll });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async viewSessions(username: string, password: string) {
    try {
      if (!username || !password) {
        toast.error('Credentials are required');
        return;
      }
      const response = await this.client.post('/api/sessions', { username, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Handle common errors
  handleError(error: any) {
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error(`API Error: ${error.response.status} - ${error.response.data.message}`);
    } else if (error.request) {
      // Request was made, but no response was received
      console.error('API Error: No response received', error.request);
    } else {
      // Something went wrong while setting up the request
      console.error('API Error:', error.message);
    }

    toast.error(error.message || 'Something went wrong');
  }
}

export default ApiClient;
