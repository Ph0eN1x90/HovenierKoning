<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-primary glossy text-white">
        <q-toolbar-title class="text-center cursor-pointer" @click="$router.push('/')">
          <q-avatar class="text-center">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          <span v-if="$q.screen.gt.xs">Klus4Me</span>
        </q-toolbar-title>

        <q-btn
          flat
          round
          dense
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          @click="toggleDarkMode"
        >
          <q-tooltip>{{ $q.dark.isActive ? 'Licht thema' : 'Donker thema' }}</q-tooltip>
        </q-btn>

        <!-- Offline Queue Badge -->
        <q-btn
          v-if="pendingCount > 0"
          flat
          round
          dense
          icon="cloud_queue"
          @click="showPendingDialog = true"
        >
          <q-badge color="orange" floating>{{ pendingCount }}</q-badge>
          <q-tooltip>{{ pendingCount }} offline wijziging(en) in wachtrij</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Pending Requests Dialog -->
    <q-dialog
      v-model="showPendingDialog"
      transition-show="slide-up"
      transition-hide="slide-down"
      :maximized="$q.screen.xs"
    >
      <q-card :style="$q.screen.xs ? 'width: 100vw; max-width: 100vw;' : 'min-width: 400px; max-width: 90vw;'">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Offline Wachtrij</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="pendingRequests.length === 0" class="text-center text-grey-6">
            Geen wijzigingen in wachtrij
          </div>
          <q-list v-else separator>
            <q-item v-for="request in pendingRequests" :key="request.id">
              <q-item-section avatar>
                <q-icon
                  :name="request.method === 'POST' ? 'add' : request.method === 'PUT' ? 'edit' : 'delete'"
                  :color="request.method === 'DELETE' ? 'negative' : 'primary'"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ request.description }}</q-item-label>
                <q-item-label caption>{{ request.method }} {{ request.url }}</q-item-label>
                <q-item-label caption class="text-grey-6">
                  {{ new Date(request.timestamp).toLocaleString('nl-NL') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="pendingRequests.length > 0"
            flat
            label="Nu verzenden"
            color="primary"
            :disable="!isOnline"
            @click="syncNow"
          />
          <q-btn flat label="Sluiten" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useOfflineQueue } from 'src/composables/useOfflineQueue';
import { useUiPreferences } from 'src/composables/useUiPreferences';
import type { QueuedRequest } from 'src/models/QueuedRequest';

const { getQueue, getQueueCount, processPendingRequests } = useOfflineQueue();
const { getThemeModePreference, setThemeModePreference } = useUiPreferences();
const $q = useQuasar();

const showPendingDialog = ref(false);
const pendingRequests = ref<QueuedRequest[]>([]);
const pendingCount = ref(0);
const onlineStatus = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
const isOnline = computed(() => onlineStatus.value);
let pendingCountInterval: number | undefined;

const handleOnline = () => {
  onlineStatus.value = true;
  void updatePendingCount();
};
const handleOffline = () => {
  onlineStatus.value = false;
  void updatePendingCount();
};

function toggleDarkMode() {
  const nextMode = !$q.dark.isActive;
  $q.dark.set(nextMode);
  void setThemeModePreference(nextMode ? 'dark' : 'light');
}

async function updatePendingCount() {
  pendingCount.value = await getQueueCount();
  pendingRequests.value = await getQueue();
}

async function syncNow() {
  await processPendingRequests();
  await updatePendingCount();
  showPendingDialog.value = false;
}

onMounted(async () => {
  const savedThemeMode = await getThemeModePreference();
  if (savedThemeMode === 'dark') {
    $q.dark.set(true);
  } else if (savedThemeMode === 'light') {
    $q.dark.set(false);
  }

  // Update count on mount
  void updatePendingCount();

  // Update count periodically
  pendingCountInterval = window.setInterval(() => void updatePendingCount(), 5000);

  // Update count when online status changes
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  if (pendingCountInterval !== undefined) {
    clearInterval(pendingCountInterval);
  }

  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});
</script>
