<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">

      <q-card-section class="flex-row-title-btn-container text-h6">
        <!-- title -->
        Huisnummer details
        <q-btn class="flex-row-title-btn" size="sm" icon="close" flat round @click="onDialogCancel">
          <q-tooltip>Sluiten</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section>
        <p>
          Huisnummer: {{ props.adres?.huisnummer }}<br>
          Straatnaam: {{ props.adres?.straatnaam }}<br>
          Stad: {{ props.adres?.stad }}<br>
          Postcode: {{ props.adres?.postcode }}<br>
        </p>
      </q-card-section>

      <q-card-section class="text-h6 flex-add-new-tree-container">
        <!-- title -->
        Boom details
          <span v-if="!loading" class="flex-add-new-tree-btn">
            <q-btn
              icon="add"
              size="lg"
              flat
              round
              @click="openNieuweBoomDialog"
            />
          </span>
      </q-card-section>

      <q-card-section>
          <q-spinner v-if="loading" color="primary" size="20px" />

          <span class="text" v-else-if="rawData.length === 0">Er zijn geen bomen gevonden.</span>

          <span class="list-of-trees-housenumer-dialog" v-else>
            <span>
              <q-inner-loading
              :showing="loading"
              color="primary"
              />
            </span>

            <!-- list of trees -->
            <q-list bordered class="rounded-borders" style="max-width: 600px">

              <q-item clickable v-ripple :active="active" v-for="(boom, index) in rawData" :key="index" class="q-px-md q-py-sm">

              <q-item>
                <q-item-section avatar top>
                  <!-- <TinyGalleryBtnComponent /> -->
                  <CameraOrGalleryBtnComponent />
                </q-item-section>
              </q-item>

                <q-item-section top>
                  <q-item-label lines="1">
                    <span class="text-weight-medium">{{ boom.boomtype }}</span>
                    <span class="text-grey-8"> - Boomsoort</span>
                  </q-item-label>
                  <q-item-label caption lines="1">
                    Hoogte: {{ boom.hoogte }} m, Diameter: {{ boom.diameter }} cm
                  </q-item-label>
                </q-item-section>

                <q-item-section top side>
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn class="gt-xs" size="12px" flat dense round icon="delete" />
                    <q-btn class="gt-xs" size="12px" flat dense round icon="done" />
                    <q-btn size="12px" flat dense round icon="more_vert" />
                  </div>
                </q-item-section>
              </q-item>

              <q-separator spaced />

            </q-list>
          </span>
      </q-card-section>

    </q-card>
  </q-dialog>

</template>

<script setup lang="ts">

import { Dialog, useDialogPluginComponent } from 'quasar'
import { api } from 'src/boot/axios';
import type { Adres } from 'src/models/Adres'
import type { Boom } from 'src/models/Boom';
import { ref } from 'vue';
import NieuweBoomDialogComponent from 'src/components/NieuweBoomDialogComponent.vue'
import CameraOrGalleryBtnComponent from './CameraOrGalleryBtnComponent.vue';
import TinyGalleryBtnComponent from './TinyGalleryBtnComponent.vue';

const rawData = ref<Boom[]>([])
const loading = ref(false)
const active = ref(true)
const props = defineProps<{
  adres: Adres
}>()

defineEmits([
...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()


function openNieuweBoomDialog() {

  // Open a dialog to add a new tree
  Dialog.create({
    title: 'Nieuwe Boom Toevoegen',
    message: 'Hier kun je een nieuwe boom toevoegen.',
    component: NieuweBoomDialogComponent,
    persistent: true,
    componentProps: {
      adres: props.adres,
      // Bepaal het hoogste boomnummer uit de huidige lijst
      lastBoomNummer: Math.max(0, ...rawData.value.map(b => b.boomnummer + 1 || 0))},
    ok: {
      label: 'Toevoegen',
      color: 'primary'
    },
    cancel: {
      label: 'Annuleren',
      color: 'secondary'
    }
  }).onOk(() => {
    console.log('Nieuwe boom toegevoegd');
  }).onCancel(() => {
    console.log('Nieuwe boom toevoegen geannuleerd');
  });
  console.log('Nieuwe boom toevoegen dialog geopend');
}

api.get('/api/bomen/all/' + props.adres.id).then(
function (response) {
  loading.value = true;
  console.log(response.data);
  rawData.value = response.data;

  console.log(rawData.value);

}).finally(() => {
  loading.value = false
})
.catch(error => {
  console.log(error)
});

</script>
