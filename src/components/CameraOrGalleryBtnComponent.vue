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
        overlay.style.background = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999';

        // Container voor video
        const videoContainer = document.createElement('div');
        videoContainer.style.position = 'relative';
        videoContainer.style.width = '90vw';
        videoContainer.style.maxWidth = '600px';
        videoContainer.style.height = 'auto';
        videoContainer.style.maxHeight = '80vh';
        videoContainer.style.borderRadius = '12px';
        videoContainer.style.overflow = 'hidden';
        videoContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';

        // Videoview
        const video = document.createElement('video');
        video.autoplay = true;
        video.srcObject = stream;
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.display = 'block';
        videoContainer.appendChild(video);

        // Capture knop (styled as icon button)
        const captureBtn = document.createElement('button');
        captureBtn.innerHTML = '📷';
        captureBtn.style.position = 'absolute';
        captureBtn.style.bottom = '20px';
        captureBtn.style.left = '50%';
        captureBtn.style.transform = 'translateX(-50%)';
        captureBtn.style.width = '70px';
        captureBtn.style.height = '70px';
        captureBtn.style.borderRadius = '50%';
        captureBtn.style.border = '4px solid white';
        captureBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        captureBtn.style.fontSize = '32px';
        captureBtn.style.cursor = 'pointer';
        captureBtn.style.display = 'flex';
        captureBtn.style.alignItems = 'center';
        captureBtn.style.justifyContent = 'center';
        captureBtn.style.backdropFilter = 'blur(10px)';

        // Sluit knop (styled as icon button)
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '20px';
        closeBtn.style.width = '50px';
        closeBtn.style.height = '50px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.border = 'none';
        closeBtn.style.background = 'rgba(0, 0, 0, 0.5)';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.backdropFilter = 'blur(10px)';

        videoContainer.appendChild(captureBtn);
        videoContainer.appendChild(closeBtn);
        overlay.appendChild(videoContainer);
        document.body.appendChild(overlay);

        // Voorkom dat clicks binnen de video container de overlay sluiten
        videoContainer.onclick = (e) => {
          e.stopPropagation();
        };

        // Sluit bij click op overlay (buiten de video)
        overlay.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(overlay);
        };

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
