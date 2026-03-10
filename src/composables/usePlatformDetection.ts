import { computed } from 'vue';
import { useQuasar } from 'quasar';

export type CaptureStrategy = 'browser-camera' | 'native-container-fallback' | 'gallery-only';

export function usePlatformDetection() {
  const $q = useQuasar();

  const isCapacitor = computed(() => $q.platform.is.capacitor === true);
  const isCordova = computed(() => $q.platform.is.cordova === true);
  const isNativeContainer = computed(() => isCapacitor.value || isCordova.value);

  const isAndroid = computed(() => $q.platform.is.android === true);
  const isIos = computed(() => $q.platform.is.ios === true);
  const isMobileDevice = computed(() => isAndroid.value || isIos.value || $q.platform.is.mobile === true);

  const isSecureRuntime = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.isSecureContext === true;
  });

  const supportsGetUserMedia = computed(() => {
    if (typeof navigator === 'undefined') return false;
    return typeof navigator.mediaDevices?.getUserMedia === 'function';
  });

  const canUseBrowserCamera = computed(() => supportsGetUserMedia.value && isSecureRuntime.value);

  const captureStrategy = computed<CaptureStrategy>(() => {
    if (canUseBrowserCamera.value) return 'browser-camera';
    if (isNativeContainer.value) return 'native-container-fallback';
    return 'gallery-only';
  });

  const runtimeLabel = computed(() => {
    if (isCapacitor.value) return 'capacitor';
    if (isCordova.value) return 'cordova';
    return 'web';
  });

  const cameraFailureCaption = computed(() => {
    if (isNativeContainer.value) {
      return 'Controleer camera-permissies in app-instellingen; Galerij blijft beschikbaar.';
    }

    if (!isSecureRuntime.value) {
      return 'Camera vereist een beveiligde context (https of localhost). Galerij wordt geopend.';
    }

    return 'Controleer camerarechten in je browser en probeer opnieuw, of kies Galerij.';
  });

  return {
    isCapacitor,
    isCordova,
    isNativeContainer,
    isAndroid,
    isIos,
    isMobileDevice,
    isSecureRuntime,
    supportsGetUserMedia,
    canUseBrowserCamera,
    captureStrategy,
    runtimeLabel,
    cameraFailureCaption,
  };
}
