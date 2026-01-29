<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin tree-details-card width-800px">

      <!-- Header with close button -->
      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6 primary-color"> {{ address.streetname + " " + address.housenumber }} </div>
        <q-btn class="flex-row-title-btn" size="sm" icon="close" flat round @click="onDialogCancel">
          <q-tooltip>Sluiten</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section v-if="tree">
        <!-- Tree Header -->
        <div class="tree-header">
          <div class="text-h6 primary-color">{{ tree.treetype }}</div>
          <div class="text-subtitle2 ">Boomnummer: {{ tree.treenumber }}</div>
        </div>

        <!-- Image Carousel Component -->
        <CarouselComponent
          v-if="tree.treeimage && tree.treeimage.length > 0"
          :images="tree.treeimage.map(img => img.imageurl)"
        />
        <div v-else class="no-image">Geen afbeelding beschikbaar</div>

        <!-- Tree Details -->
        <div class="tree-info">
          <div class="info-section">
            <h2 class="text-h6">Algemene Informatie</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Boomnummer:</span>
                <span class="value">{{ tree.treenumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Hoogte:</span>
                <span class="value">{{ tree.height ? `${tree.height} m` : 'Niet opgegeven' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Diameter:</span>
                <span class="value">{{ tree.diameter ? `${tree.diameter} cm` : 'Niet opgegeven' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Afgerond:</span>
                <span class="value">{{ tree.finished ? 'Ja' : 'Nee' }}</span>
              </div>
              <div class="info-item" v-if="tree.date_finished">
                <span class="label">Afgerond op:</span>
                <span class="value">{{ tree.date_finished }}</span>
              </div>
            </div>
          </div>

          <div class="info-section" v-if="tree.comment">
            <h2 class="text-h6">Opmerking</h2>
            <p>{{ tree.comment }}</p>
          </div>
        </div>
      </q-card-section>

    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import type { Tree } from 'src/models/Tree';
import type { Address } from 'src/models/Address';
import CarouselComponent from './CarouselComponent.vue';

defineProps<{
  tree: Tree
  address: Address
}>();

defineEmits([
  ...useDialogPluginComponent.emits
]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();

</script>
