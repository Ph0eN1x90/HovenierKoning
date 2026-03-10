import { defineBoot } from '#q-app/wrappers';
import { useOfflineQueue } from 'src/composables/useOfflineQueue';

export default defineBoot(() => {
  const { initializeOfflineQueue } = useOfflineQueue();
  initializeOfflineQueue();
});
