import { create } from 'zustand';
import type { Service, ServiceFormData } from '../types';
import { ServicesAPI } from '../api/services';

interface ServicesState {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  selectedService: Service | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface ServicesActions {
  // CRUD operations
  createService: (serviceData: ServiceFormData, accessToken: string) => Promise<Service | null>;
  fetchServices: (accessToken: string) => Promise<void>;
  fetchService: (serviceId: string, accessToken: string) => Promise<Service | null>;
  updateService: (serviceId: string, serviceData: Partial<ServiceFormData>, accessToken: string) => Promise<Service | null>;
  deleteService: (serviceId: string, accessToken: string) => Promise<boolean>;
  
  // State management
  setSelectedService: (service: Service | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearServices: () => void;
}

type ServicesStore = ServicesState & ServicesActions;

/**
 * Services store using Zustand for state management
 * Handles all CRUD operations for services
 */
export const useServicesStore = create<ServicesStore>()((set) => ({
  // Initial state
  services: [],
  isLoading: false,
  error: null,
  selectedService: null,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  /**
   * Create a new service
   * @param serviceData - Service data
   * @param accessToken - JWT access token
   * @returns Promise<Service | null>
   */
  createService: async (serviceData: ServiceFormData, accessToken: string): Promise<Service | null> => {
    set({ isCreating: true, error: null });
    
    try {
      const response = await ServicesAPI.createService(serviceData, accessToken);
      
      if (response.success && response.data) {
        const newService = response.data;
        
        set(state => ({
          services: [...state.services, newService],
          isCreating: false,
          error: null
        }));
        
        return newService;
      }
      
      set({ isCreating: false, error: 'Failed to create service' });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create service';
      set({ isCreating: false, error: errorMessage });
      return null;
    }
  },

  /**
   * Fetch all services
   * @param accessToken - JWT access token
   */
  fetchServices: async (accessToken: string): Promise<void> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await ServicesAPI.getServices(accessToken);
      
      if (response.success && response.data) {
        set({
          services: response.data,
          isLoading: false,
          error: null
        });
      } else {
        set({ isLoading: false, error: 'Failed to fetch services' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch services';
      set({ isLoading: false, error: errorMessage });
    }
  },

  /**
   * Fetch a single service by ID
   * @param serviceId - Service ID
   * @param accessToken - JWT access token
   * @returns Promise<Service | null>
   */
  fetchService: async (serviceId: string, accessToken: string): Promise<Service | null> => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await ServicesAPI.getService(serviceId, accessToken);
      
      if (response.success && response.data) {
        set({ isLoading: false, error: null });
        return response.data;
      }
      
      set({ isLoading: false, error: 'Failed to fetch service' });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch service';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },

  /**
   * Update a service
   * @param serviceId - Service ID
   * @param serviceData - Updated service data
   * @param accessToken - JWT access token
   * @returns Promise<Service | null>
   */
  updateService: async (
    serviceId: string, 
    serviceData: Partial<ServiceFormData>, 
    accessToken: string
  ): Promise<Service | null> => {
    set({ isUpdating: true, error: null });
    
    try {
      const response = await ServicesAPI.updateService(serviceId, serviceData, accessToken);
      
      if (response.success && response.data) {
        const updatedService = response.data;
        
        set(state => ({
          services: state.services.map(service => 
            service.id === serviceId ? updatedService : service
          ),
          selectedService: state.selectedService?.id === serviceId ? updatedService : state.selectedService,
          isUpdating: false,
          error: null
        }));
        
        return updatedService;
      }
      
      set({ isUpdating: false, error: 'Failed to update service' });
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update service';
      set({ isUpdating: false, error: errorMessage });
      return null;
    }
  },

  /**
   * Delete a service
   * @param serviceId - Service ID
   * @param accessToken - JWT access token
   * @returns Promise<boolean>
   */
  deleteService: async (serviceId: string, accessToken: string): Promise<boolean> => {
    set({ isDeleting: true, error: null });
    
    try {
      await ServicesAPI.deleteService(serviceId, accessToken);
      
      set(state => ({
        services: state.services.filter(service => service.id !== serviceId),
        selectedService: state.selectedService?.id === serviceId ? null : state.selectedService,
        isDeleting: false,
        error: null
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
      set({ isDeleting: false, error: errorMessage });
      return false;
    }
  },

  /**
   * Set selected service
   * @param service - Service to select
   */
  setSelectedService: (service: Service | null) => {
    set({ selectedService: service });
  },

  /**
   * Set loading state
   * @param loading - Loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set error message
   * @param error - Error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Clear all services
   */
  clearServices: () => {
    set({ 
      services: [], 
      selectedService: null, 
      error: null 
    });
  }
}));
