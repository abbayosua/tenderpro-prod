/**
 * Hook to track project views
 * Increments the view count on the server when called
 */

export function useProjectViews() {
  const trackView = async (projectId: string) => {
    try {
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          action: 'increment_view' 
        }),
      });
    } catch (error) {
      console.error('Failed to track project view:', error);
    }
  };

  return { trackView };
}
