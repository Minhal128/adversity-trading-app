/**
 * Legacy compatibility stub.
 * Social auth has moved away from this service.
 */
export const syncClerkUserWithBackend = async () => {
  return {
    success: false,
    error: 'This legacy auth bridge is disabled.',
  };
};
