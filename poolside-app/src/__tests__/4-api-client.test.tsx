/**
 * TEST 4: API Client Diagnostics
 * Tests if API client and services can be initialized without crashes
 */

describe('API Client Diagnostics', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('4.1 - API client module can be imported', () => {
    expect(() => {
      const client = require('../api/client');
      expect(client.apiClient).toBeDefined();
      expect(client.tokenStorage).toBeDefined();
    }).not.toThrow();
  });

  test('4.2 - Events service can be imported', () => {
    expect(() => {
      const { eventsService } = require('../api/services/events');
      expect(eventsService).toBeDefined();
      expect(eventsService.getEvents).toBeDefined();
      expect(eventsService.createEvent).toBeDefined();
    }).not.toThrow();
  });

  test('4.3 - API client has correct base configuration', () => {
    const { apiClient } = require('../api/client');
    expect(apiClient.defaults.baseURL).toContain('/v1');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  test('4.4 - Token storage methods exist', () => {
    const { tokenStorage } = require('../api/client');
    expect(typeof tokenStorage.getAccessToken).toBe('function');
    expect(typeof tokenStorage.getRefreshToken).toBe('function');
    expect(typeof tokenStorage.setTokens).toBe('function');
    expect(typeof tokenStorage.clearTokens).toBe('function');
  });

  test('4.5 - API index exports all required services', () => {
    expect(() => {
      const api = require('../api');
      expect(api.authService).toBeDefined();
      expect(api.usersService).toBeDefined();
      expect(api.tokenStorage).toBeDefined();
    }).not.toThrow();
  });
});
