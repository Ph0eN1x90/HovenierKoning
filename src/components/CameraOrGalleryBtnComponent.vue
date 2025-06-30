<template>
    <q-btn
      color="primary"
      icon="camera_alt"
      size="small"
      flat
      round
      @click="openCameraOrGallery"
    />
    <q-separator />
    <q-btn
      color="secondary"
      icon="photo_library"
      size="small"
      flat
      round
      @click="openGallery"
    />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';

const $q = useQuasar();

const openCameraOrGallery = () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg');
          // doe hier iets met de afbeelding
          console.log(dataURL);
          // Stop de stream na het nemen van de foto
          stream.getTracks().forEach(track => track.stop());
        });
      })
      .catch((error) => {
        console.error('Er ging iets mis:', error);
        $q.notify({
          message: 'Camera openen is mislukt.',
          color: 'negative',
          icon: 'warning',
        });
        openGallery();
      });
  } else {
    openGallery();
  }
};

const openGallery = () => {
  // Maak een verborgen input element aan voor het selecteren van een bestand
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result;
        // doe hier iets met de afbeelding
        console.log(dataURL);
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};
</script>
