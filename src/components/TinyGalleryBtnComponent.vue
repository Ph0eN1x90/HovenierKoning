<template>
    <div ref="galleryRef" class="gallery-thumbnails" :images="images.slice(0, 3)">
      <div v-for="(image, index) in props.treeImages.slice(0, 3)" :key="index" class="thumbnail">
        <span>
          <img :src="image.imageurl" @click="openGallery(index)">
          <q-tooltip :delay="500" :offset="[10, 10]">Foto {{ index + 1 }}</q-tooltip>
        </span>
      </div>
    </div>
</template>

<script setup lang="ts">
import type { TreeImage } from 'src/models/TreeImage';
import { ref } from 'vue';

const images = ref<string[]>([]);
const galleryRef = ref();
const openGallery = (index: number) => {
  const gallery = galleryRef.value;
  if (gallery) {
    const thumbnails = gallery.querySelectorAll('.thumbnail');
    if (thumbnails[index]) {
      thumbnails[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};
const props = defineProps<{
  treeImages: TreeImage[];
}>();

</script>

<style scoped>
.gallery-thumbnails {
  display: flex;
  flex-wrap: nowrap;
  justify-content:flex-start;
}

.thumbnail {
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
}

.thumbnail>span>img {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}
</style>
