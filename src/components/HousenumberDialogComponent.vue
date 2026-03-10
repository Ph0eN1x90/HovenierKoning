<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    transition-show="slide-up"
    transition-hide="slide-down"
    :maximized="isMobile"
  >
    <q-card class="q-dialog-plugin width-600px">

      <q-card-section class="flex-row-title-btn-container text-h6 primary-color">
        <!-- title -->
        Huisnummer details
        <q-btn class="flex-row-title-btn" size="sm" icon="close" flat round @click="onDialogCancel">
          <q-tooltip>Sluiten</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section>
        <div class="q-pa-sm">
          <q-list>
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

    <q-card-section class="text-h6 primary-color flex-add-new-tree-container">
      <!-- title -->
      Boom details
      <span class="flex-add-new-tree-btn">
        <q-btn
        icon="add"
        size="lg"
        flat
        round
        :disable="loading"
        @click="openNewTreeDialog"
        />
      </span>
    </q-card-section>

    <q-card-section>
      <span class="text" v-if="rawData.length === 0">Er zijn geen bomen gevonden.</span>

      <span class="list-of-trees-housenumer-dialog" v-else>
        <!-- list of trees -->
        <q-list>
          <transition-group name="tree-list" tag="div">
            <q-item :class="tree.finished ? 'finished-row-item' : 'unfinished-row-item'" clickable v-ripple :active="active" v-for="(tree, index) in rawData" :key="index" class="border-bottom-row row-item" @click="openTreeDetailsDialog(index)">

            <q-item-section class="flex-width-30 card-thumbnail-section">
              <div class="card-thumbnail-middle absolute-full overlay-center flex-center"> </div>
              <q-img
              class="card-thumbnail rounded-borders"
              :style="!tree.treeimage.length ? 'opacity: 0.5' : ''"
              :src="tree.treeimage[0]?.imageurl || placeholderUrl"
              >
              <div class="text-caption text-center card-thumbnail-text">{{ tree.treeimage?.length }} fotos</div>
            </q-img>

            </q-item-section>

          <q-item-section class="q-pb-md">
            <q-item-label style="overflow: auto;">
              <div class="text-h5">{{ tree.treetype }}</div>
              <div class="text-subtitle2 text-weight-light">Boomnummer: {{ tree.treenumber }}</div>
            </q-item-label>
            <q-item-label caption lines="1">
              <div>Hoogte: {{ tree.height }} m</div>
              <div>Diameter: {{ tree.diameter }} cm</div>
              <div>Opmerking: {{ tree.comment }}</div>
            </q-item-label>
          </q-item-section>

          <q-item-section class="flex-width-10">
            <div class="text-grey-8 q-gutter-md ">
              <q-btn size="12px" flat dense round icon="edit" @click.stop="editTree(tree)"/>
              <q-btn size="12px" flat dense round icon="delete" @click.stop="deleteTree(Number(tree.id))" />
            </div>
          </q-item-section>

        </q-item>
          </transition-group>

        <q-separator spaced />

      </q-list>
    </span>
  </q-card-section>

</q-card>
</q-dialog>

</template>

<script setup lang="ts">

  import { Dialog, useDialogPluginComponent, useQuasar } from 'quasar'
  import { computed, ref } from 'vue';
  import type { Address } from 'src/models/Address'
  import type { Tree } from 'src/models/Tree';
  import TreeFormDialogComponent from 'src/components/TreeFormDialogComponent.vue'
  import TreeDetailsDialogComponent from './TreeDetailsDialogComponent.vue';
  import { useApi } from '../composables/useApi';

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const $q = useQuasar();
  const placeholderUrl = new URL('../assets/images/thumbnail-placeholder.png', import.meta.url).href
  const { loading, fetchData, deleteData } = useApi();
  const rawData = ref<Tree[]>([])
  const active = ref(true)
  const isMobile = computed(() => $q.screen.lt.md);
  const props = defineProps<{
    address: Address
  }>()
  defineEmits([
  ...useDialogPluginComponent.emits
  ])

  void loadTrees();

  const deleteTree = async (id: number) => {
    const treeToDelete = rawData.value.find(tree => tree.id === id);
    const description = treeToDelete
      ? `Boom ${treeToDelete.treetype} (#${treeToDelete.treenumber}) verwijderen`
      : 'Boom verwijderen';

    const response = await deleteData(`/api/trees/${id}`, 'Boom verwijderd', description, treeToDelete);
    if (response) {
      rawData.value = rawData.value.filter(tree => tree.id !== id);
    }
  }

  const editTree = (tree: Tree) => {
    Dialog.create({
      component: TreeFormDialogComponent,
      componentProps: {
        address: props.address,
        tree: tree
      }
    }).onOk(() => {
      void loadTrees();
    });
  }

  function openNewTreeDialog() {
    // Open a dialog to add a new tree
    Dialog.create({
      component: TreeFormDialogComponent,
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

    }).onOk(() => {
      void loadTrees();
    });
  }

  async function loadTrees() {
    // Always load trees through API composable.
    // Online: network + cache update
    // Offline: IndexedDB fallback with hydrated treeimage data
    const data = await fetchData<Tree[]>(`/api/trees/all/${props.address.id}`);
    if (data) {
      rawData.value = data;
      return;
    }

    // Last fallback for legacy cached addresses without tree hydration
    if (!navigator.onLine && props.address.trees && props.address.trees.length > 0) {
      rawData.value = props.address.trees;
    }
  }

  function openTreeDetailsDialog(index: number) {
    Dialog.create({
      component: TreeDetailsDialogComponent,
      title: 'Boom Details',
      componentProps: {
        tree: rawData.value[index],
        address: props.address
      }
      });
  }

</script>

<style scoped>
.tree-list-enter-active,
.tree-list-leave-active {
  transition: all 0.25s ease;
}

.tree-list-enter-from,
.tree-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
