<template>
  <div>
    <div v-if="!images || images.length === 0" class="no-images-placeholder">
      <div class="no-image-text">Geen afbeelding beschikbaar</div>
    </div>
    <div v-else>
      <q-carousel
        v-model="slide"
        swipeable
        animated
        navigation
        infinite
        arrows
        control-color="primary"
        height="500px"
        class="rounded-borders"
      >
        <q-carousel-slide
          v-for="(image, index) in images"
          :key="index"
          :name="index"
          :img-src="image"
        />
      </q-carousel>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  images: string[]
  initialSlide?: number
}>()

const slide = ref(props.initialSlide ?? 0)

</script>


