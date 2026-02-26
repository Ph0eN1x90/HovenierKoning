<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOfflineQueue } from './composables/useOfflineQueue';

const { initializeOfflineQueue } = useOfflineQueue();

// Initialize offline queue system when app starts
onMounted(() => {
  initializeOfflineQueue();
});
</script>
