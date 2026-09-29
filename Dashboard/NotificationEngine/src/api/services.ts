import type { ServiceFormData, ServiceResponse, ServicesResponse, ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * API client for services CRUD operations
 */
export class ServicesAPI {
  private static baseURL = BASE_URL;

  /**
   * Get authorization headers with access token
   * @param accessToken - JWT access token
   * @returns Headers object
   */
  private static getAuthHeaders(accessToken: string): HeadersInit {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a new service
   * @param serviceData - Service data
   * @param accessToken - JWT access token
   * @returns Promise<ServiceResponse>
   */
  static async createService(serviceData: ServiceFormData, accessToken: string): Promise<ServiceResponse> {
    const response = await fetch(`${this.baseURL}/services/`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(serviceData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || 'Failed to create service');
    }

    return data;
  }

  /**
   * Get all services
   * @param accessToken - JWT access token
   * @returns Promise<ServicesResponse>
   */
  static async getServices(accessToken: string): Promise<ServicesResponse> {
    const response = await fetch(`${this.baseURL}/services/`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || 'Failed to fetch services');
    }

    return data;
  }

  /**
   * Get a single service by ID
   * @param serviceId - Service ID
   * @param accessToken - JWT access token
   * @returns Promise<ServiceResponse>
   */
  static async getService(serviceId: string, accessToken: string): Promise<ServiceResponse> {
    const response = await fetch(`${this.baseURL}/services/${serviceId}/`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || 'Failed to fetch service');
    }

    return data;
  }

  /**
   * Update a service
   * @param serviceId - Service ID
   * @param serviceData - Updated service data
   * @param accessToken - JWT access token
   * @returns Promise<ServiceResponse>
   */
  static async updateService(
    serviceId: string, 
    serviceData: Partial<ServiceFormData>, 
    accessToken: string
  ): Promise<ServiceResponse> {
    const response = await fetch(`${this.baseURL}/services/${serviceId}/`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(serviceData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = data;
      throw new Error(error.message || 'Failed to update service');
    }

    return data;
  }

  /**
   * Delete a service
   * @param serviceId - Service ID
   * @param accessToken - JWT access token
   * @returns Promise<void>
   */
  static async deleteService(serviceId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/services/${serviceId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    });

    if (!response.ok) {
      const data = await response.json();
      const error: ApiError = data;
      throw new Error(error.message || 'Failed to delete service');
    }
  }
}
