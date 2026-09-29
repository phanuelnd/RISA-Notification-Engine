import type { LoginResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * API client for authentication endpoints
 */
export class AuthAPI {
  private static baseURL = BASE_URL;

  /**
   * Login user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Promise<LoginResponse>
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/signin/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - Refresh token
   * @returns Promise<LoginResponse>
   */
  static async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    return data;
  }

  /**
   * Logout user (invalidate tokens)
   * @param refreshToken - Refresh token to invalidate
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${this.baseURL}/auth/signout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch (error) {
      // Logout should not fail the user experience
      console.warn('Logout request failed:', error);
    }
  }
}

