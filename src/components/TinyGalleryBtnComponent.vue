<template>
  <div>
    <q-gallery ref="galleryRef" class="gallery-thumbnails" :images="images">
      <div v-for="(image, index) in images" :key="index" class="thumbnail">
        <div v-if="index <= 3" class="q-pa-xs">
          <img :src="image.src" @click="openGallery(index)">
          <q-tooltip :delay="500" :offset="[10, 10]">Foto {{ index + 1 }}</q-tooltip>
        </div>
      </div>
    </q-gallery>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const images = ref([
  { src: 'https://picsum.photos/200/300', title: 'Beeld 1' },
  { src: 'https://picsum.photos/200/301', title: 'Beeld 2' },
  { src: 'https://picsum.photos/200/302', title: 'Beeld 3' },
  { src: 'https://picsum.photos/200/303', title: 'Beeld 4' },
  { src: 'https://picsum.photos/200/304', title: 'Beeld 5' },
]);

const galleryRef = ref();
const openGallery = (index: number) => {
  galleryRef.value?.open(index);
};
</script>

<style scoped>
.gallery-thumbnails {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.thumbnail {
  margin: 10px;
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}

.thumbnail>div>img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}
</style>
