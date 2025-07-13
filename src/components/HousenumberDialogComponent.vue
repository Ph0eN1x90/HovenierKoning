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
          Huisnummer: {{ props.address?.housenumber }}<br>
          Straatnaam: {{ props.address?.streetname }}<br>
          Stad: {{ props.address?.city }}<br>
          Postcode: {{ props.address?.zipcode }}<br>
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
              @click="openNewTreeDialog"
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

              <q-item clickable v-ripple :active="active" v-for="(tree, index) in rawData" :key="index" class="q-px-md q-py-sm">

              <q-item>
                <q-item-section avatar top>
                  <!-- <TinyGalleryBtnComponent />
                  <CameraOrGalleryBtnComponent @created-image="createdImage" /> -->
                </q-item-section>
              </q-item>

                <q-item-section top>
                  <q-item-label lines="1">
                    <span class="text-weight-medium">{{ tree.treetype }}</span>
                    <span class="text-grey-8"> - Boomsoort</span>
                  </q-item-label>
                  <q-item-label caption lines="1">
                    Hoogte: {{ tree.height }} m, Diameter: {{ tree.diameter }} cm
                  </q-item-label>
                </q-item-section>

                <q-item-section top side>
                  <div class="text-grey-8 q-gutter-xs">
                    <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="deleteTree(Number(tree.id))" />
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
import { ref } from 'vue';
import type { Address } from 'src/models/Address'
import type { Tree } from 'src/models/Tree';
import CreateTreeDialogComponent from 'src/components/CreateTreeDialogComponent.vue'
import CameraOrGalleryBtnComponent from './CameraOrGalleryBtnComponent.vue';
import TinyGalleryBtnComponent from './TinyGalleryBtnComponent.vue';

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const rawData = ref<Tree[]>([])
const loading = ref(false)
const active = ref(true)
const props = defineProps<{
  address: Address
}>()
// defineEmits([
// ...useDialogPluginComponent.emits
// ])

getTreesByID()

const createdImage = (data: string) => {
  // Handle the created image from CameraOrGalleryBtnComponent
  console.log('Created image:', data);
  return data; // Return the image data URL
}

const deleteTree = (id: number) => {
api.delete(`/api/trees/${id}`).then(function (response) {
      if (response.status === 200) {
        console.log('Deleted tree with ID:', id);
        rawData.value = rawData.value.filter(tree => tree.id !== id)
        getTreesByID();
      } else {
        console.error('Error deleting tree with ID:', id);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
  getTreesByID();
}

function openNewTreeDialog() {
  // Open a dialog to add a new tree
  Dialog.create({
    title: 'Nieuwe Boom Toevoegen',
    message: 'Hier kun je een nieuwe boom toevoegen.',
    component: CreateTreeDialogComponent,
    componentProps: {
      address: props.address,
      // Zoek het eerstvolgende ontbrekende boomnummer, anders hoogste + 1
      lastTreeNumber: (() => {
      const nummers = rawData.value.map(b => b.treenumber).sort((a, b) => a - b);
      for (let i = 1; i <= nummers.length + 1; i++) {
        if (!nummers.includes(i)) {
          return i;
        }
      }
      return 1;
      })()
    },

  }).onCancel(() => {
    getTreesByID();
  })
}

function getTreesByID() {
  // Fetch all trees for the given address
  api.get('/api/trees/all/' + props.address.id).then(
  function (response) {
    loading.value = true;
    rawData.value = response.data;
  }).finally(() => {
    loading.value = false
  })
  .catch(error => {
    console.log(error)
  });
}

</script>
