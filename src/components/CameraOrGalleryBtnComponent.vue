<template>
  <div class="flex-row">
    <q-btn
      url="https://cdn.quasar.dev/img/avatar2.jpg"
      color="primary"
      icon="camera_alt"
      size="small"
      flat
      round
      @click="openCameraOrGallery"
    />

    <q-separator vertical />

    <q-btn
      color="secondary"
      icon="photo_library"
      size="small"
      flat
      round
      @click="openGallery"
    />
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

const $q = useQuasar();
const dataURL = ref<string>('');
const emit = defineEmits<{
  (emitCreatedImage: 'createdImage', image: string): void
}>();

const emitCreatedImage = () => {
  emit('createdImage', dataURL.value);
};

const openCameraOrGallery = () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        // Maak een overlay aan voor de camera preview
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        // Videoview
        const video = document.createElement('video');
        video.autoplay = true;
        video.srcObject = stream;
        video.style.maxWidth = '90vw';
        video.style.maxHeight = '70vh';
        overlay.appendChild(video);

        // Capture knop
        const captureBtn = document.createElement('button');
        captureBtn.innerText = 'Neem foto';
        captureBtn.style.marginTop = '20px';
        captureBtn.style.padding = '10px 20px';
        captureBtn.style.fontSize = '16px';
        captureBtn.style.cursor = 'pointer';

        // Sluit knop
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Sluiten';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.padding = '10px 20px';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.cursor = 'pointer';

        const btnWrapper = document.createElement('div');
        btnWrapper.style.display = 'flex';
        btnWrapper.style.justifyContent = 'center';
        btnWrapper.appendChild(captureBtn);
        btnWrapper.appendChild(closeBtn);
        overlay.appendChild(btnWrapper);

        document.body.appendChild(overlay);

        captureBtn.onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          dataURL.value = canvas.toDataURL('image/jpeg');
          // doe hier iets met de afbeelding
          emitCreatedImage();
          // Stop de stream en sluit overlay
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(overlay);
        };

        closeBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(overlay);
        };
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
        dataURL.value = typeof e.target?.result === 'string' ? e.target.result : '';
        // doe hier iets met de afbeelding
        emitCreatedImage();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
};

</script>
