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
        <div class="q-pa-sm">
          <q-list style="max-width: 400px">
            <template v-slot:default>
                <q-item
                  v-for="(field, idx) in [
                    { label: 'Huisnummer', value: props.address?.housenumber },
                    { label: 'Straatnaam', value: props.address?.streetname },
                    { label: 'Stad', value: props.address?.city },
                    { label: 'Postcode', value: props.address?.zipcode }
                  ]"
                  :key="idx"
                  dense
                >
                <q-item-section>
                  <div class="border-bottom-row ">
                    <span class="text-weight-medium">{{ field.label }}:</span>
                    <span>{{ field.value }}</span>
                  </div>
                </q-item-section>
                </q-item>
            </template>
          </q-list>
        </div>
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
            <q-list style="max-width: 600px">
              <q-item clickable v-ripple :active="active" v-for="(tree, index) in rawData" :key="index" class="border-bottom-row">

                <q-item-section class="flex-width-30">
                    <TinyGalleryBtnComponent v-if="tree.treeimage" :treeImages="tree.treeimage" />
                </q-item-section>

                <q-item-section class="q-pb-md">
                  <q-item-label>
                    <div class="text-h6">{{ tree.treetype }}</div>
                    <div class="text-weight-small">Boomnummer: {{ tree.treenumber }}</div>
                  </q-item-label>
                  <q-item-label caption lines="1">
                    <div>Hoogte: {{ tree.height }} m</div>
                    <div>Diameter: {{ tree.diameter }} cm</div>
                    <div>Opmerking: {{ tree.comment }}</div>
                  </q-item-label>
                </q-item-section>

                <q-item-section class="flex-width-10">
                  <div class="text-grey-8 q-gutter-md ">
                    <q-btn size="12px" flat dense round icon="edit" @click="editTree(tree)"/>
                    <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="deleteTree(Number(tree.id))" />
                    <!-- <q-btn class="gt-xs" size="12px" flat dense round icon="done" /> -->
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
import TinyGalleryBtnComponent from './TinyGalleryBtnComponent.vue';
import EditTreeDialogComponent from './EditTreeDialogComponent.vue';

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
const rawData = ref<Tree[]>([])
const loading = ref(false)
const active = ref(true)
const props = defineProps<{
  address: Address
}>()
defineEmits([
...useDialogPluginComponent.emits
])

getTreesByID()

const deleteTree = (id: number) => {
api.delete(`/api/trees/${id}`).then(function (response) {
      if (response.status === 200) {
        console.log('Deleted tree with ID:', id);
        rawData.value = rawData.value.filter(tree => tree.id !== id)
      } else {
        console.error('Error deleting tree with ID:', id);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

const editTree = (tree: Tree) => {

  Dialog.create({
    title: 'Bestaand Boom wijzigen' ,
    component: EditTreeDialogComponent,
    componentProps: {
      address: props.address,
      tree: tree
    }
  })
}

function openNewTreeDialog() {
  // Open a dialog to add a new tree
  Dialog.create({
    component: CreateTreeDialogComponent,
      title: 'Nieuw Boom Toevoegen',
    componentProps: {
      address: props.address,
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
  }).onDismiss(() => {
    getTreesByID();
  });
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
