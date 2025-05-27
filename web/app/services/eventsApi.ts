import { 
  VIPEvent, 
  CreateEventRequest, 
  UpdateEventRequest, 
  EventListResponse, 
  EventAnalytics,
  EventCalendarItem,
  AvailableTargets,
  EventStatus
} from '../types/events';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class EventsApi {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getEvents(status?: EventStatus): Promise<EventListResponse> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    return this.fetchWithAuth(`/events?${params.toString()}`);
  }

  async getEvent(eventId: string): Promise<{ success: boolean; event: VIPEvent }> {
    return this.fetchWithAuth(`/events/${eventId}`);
  }

  async createEvent(event: CreateEventRequest): Promise<{ success: boolean; event: VIPEvent }> {
    return this.fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async updateEvent(eventId: string, updates: UpdateEventRequest): Promise<{ success: boolean; event: VIPEvent }> {
    return this.fetchWithAuth(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    return this.fetchWithAuth(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getEventAnalytics(eventId: string): Promise<{ success: boolean; analytics: EventAnalytics }> {
    return this.fetchWithAuth(`/events/${eventId}/analytics`);
  }

  async getCalendarView(startDate?: Date, endDate?: Date): Promise<{ success: boolean; events: EventCalendarItem[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    
    return this.fetchWithAuth(`/events/calendar/view?${params.toString()}`);
  }

  async getAvailableTargets(): Promise<{ success: boolean; targets: AvailableTargets }> {
    return this.fetchWithAuth('/events/targets/available');
  }
}

export default new EventsApi(); 