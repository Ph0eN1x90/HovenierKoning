<template>
  <div>
    <div v-if="!images || images.length === 0" class="no-images-placeholder">
      <div class="no-image-text">Geen afbeelding beschikbaar</div>
    </div>
    <div v-else class="carousel-container">
      <!-- Main Image Display -->
      <div class="main-image-container" :class="{ 'fullscreen': isFullscreen }">
        <q-img
          :src="images[currentIndex]"
          :ratio="16/9"
          fit="contain"
          class="main-image"
          :style="{ transform: `scale(${zoomLevel})`, cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in' }"
          @click="toggleZoom"
        >
          <!-- Loading spinner -->
          <template v-slot:loading>
            <q-spinner-hourglass color="primary" size="50px" />
          </template>

          <!-- Error state -->
          <template v-slot:error>
            <div class="absolute-full flex flex-center bg-negative text-white">
              Foto kan niet geladen worden
            </div>
          </template>
        </q-img>

        <!-- Navigation Arrows -->
        <q-btn
          v-if="images.length > 1"
          round
          dense
          flat
          icon="chevron_left"
          class="carousel-nav-btn carousel-nav-left"
          color="white"
          @click="previousImage"
        />
        <q-btn
          v-if="images.length > 1"
          round
          dense
          flat
          icon="chevron_right"
          class="carousel-nav-btn carousel-nav-right"
          color="white"
          @click="nextImage"
        />

        <!-- Top Controls Bar -->
        <div class="carousel-controls-top">
          <div class="image-counter">
            {{ currentIndex + 1 }} / {{ images.length }}
          </div>
          <div class="control-buttons">
            <q-btn
              round
              dense
              flat
              :icon="zoomLevel > 1 ? 'zoom_out' : 'zoom_in'"
              color="white"
              @click="toggleZoom"
            >
              <q-tooltip>{{ zoomLevel > 1 ? 'Zoom uit' : 'Zoom in' }}</q-tooltip>
            </q-btn>
            <q-btn
              round
              dense
              flat
              :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
              color="white"
              @click="toggleFullscreen"
            >
              <q-tooltip>{{ isFullscreen ? 'Volledig scherm uit' : 'Volledig scherm' }}</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Thumbnail Navigation (bottom) -->
        <div v-if="images.length > 1" class="thumbnail-strip">
          <div
            v-for="(image, index) in images"
            :key="index"
            class="thumbnail"
            :class="{ active: index === currentIndex }"
            @click="currentIndex = index"
          >
            <q-img :src="image" :ratio="1" fit="cover" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps<{
  images: string[]
  initialSlide?: number
}>()

const currentIndex = ref(props.initialSlide ?? 0)
const zoomLevel = ref(1)
const isFullscreen = ref(false)
const $q = useQuasar()

const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % props.images.length
  zoomLevel.value = 1 // Reset zoom when changing images
}

const previousImage = () => {
  currentIndex.value = currentIndex.value === 0 ? props.images.length - 1 : currentIndex.value - 1
  zoomLevel.value = 1 // Reset zoom when changing images
}

const toggleZoom = () => {
  zoomLevel.value = zoomLevel.value === 1 ? 2 : 1
}

const syncFullscreenState = () => {
  isFullscreen.value = $q.fullscreen.isActive
}

const toggleFullscreen = () => {
  void $q.fullscreen.toggle()
}

// Keyboard navigation
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'ArrowLeft') {
    previousImage()
  } else if (event.key === 'ArrowRight') {
    nextImage()
  } else if (event.key === 'Escape' && isFullscreen.value) {
    void $q.fullscreen.exit()
  } else if (event.key === '+' || event.key === '=') {
    zoomLevel.value = Math.min(zoomLevel.value + 0.5, 3)
  } else if (event.key === '-') {
    zoomLevel.value = Math.max(zoomLevel.value - 0.5, 1)
  }
}

onMounted(() => {
  syncFullscreenState()
  window.addEventListener('keydown', handleKeyPress)
  window.addEventListener('fullscreenchange', syncFullscreenState)
})

onUnmounted(() => {
  if ($q.fullscreen.isActive) {
    void $q.fullscreen.exit()
  }
  window.removeEventListener('keydown', handleKeyPress)
  window.removeEventListener('fullscreenchange', syncFullscreenState)
})

</script>

<style scoped>
.carousel-container {
  width: 100%;
  height: 100%;
}

.main-image-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.main-image-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  border-radius: 0;
}

.main-image {
  transition: transform 0.3s ease;
}

.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 2;
}

.carousel-nav-left {
  left: 16px;
}

.carousel-nav-right {
  right: 16px;
}

.carousel-controls-top {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  z-index: 2;
}

.image-counter {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-buttons .q-btn {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.thumbnail-strip {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  max-width: 90%;
  overflow-x: auto;
  z-index: 2;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s, transform 0.2s;
  border: 2px solid transparent;
  flex-shrink: 0;
}

.thumbnail:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

.thumbnail.active {
  opacity: 1;
  border-color: white;
}

.no-images-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  background: #f5f5f5;
  border-radius: 8px;
}

.no-image-text {
  color: #999;
  font-size: 16px;
}
</style>


