<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" >
    <q-card  class="width-600px">

      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6 primary-color">Wijzig {{tree.treetype}} boomnummer {{tree.treenumber}}</div>

        <q-btn class="flex-row-title-btn" size="sm" flat round icon="close" @click="onDialogCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <div class="text-subtitle1 primary-color">{{ $props.address.streetname + ' ' + $props.address.housenumber }}</div>
        <div class="text-subtitle1 primary-color">{{ $props.address.zipcode + ' ' + $props.address.city }}</div>
      </q-card-section>

      <q-card-section>
        <q-form ref="form" @submit.prevent="onSubmit" @reset="onReset" class="q-gutter-md">
          <q-input
          v-model="tree.treetype"
          name="boomtype"
          label="Boomtype"
          type="text"
          :rules="[v => !!v || 'Boomtype is verplicht']"
          lazy-rules
          clearable
          outlined
          dense
          required
          />
          <q-input
          v-model.number="tree.diameter"
          name="diameter"
          label="Diameter (cm)"
          type="number"
          :rules="[v => v >= 0 || 'Diameter moet positief zijn']"
          lazy-rules
          clearable
          outlined
          dense
          required
          />
          <q-input
          v-model.number="tree.height"
          name="hoogte"
          label="Hoogte (m)"
          type="number"
          :rules="[v => v >= 0 || 'Hoogte moet positief zijn']"
          lazy-rules
          clearable
          outlined
          dense
          required
          />
          <div class="flex-row-space-between">
            <TinyGalleryBtnComponent class="gallery-width" v-if="tree.treeimage" :treeImages="tree.treeimage" />
            <CameraOrGalleryBtnComponent @created-image="createdImage" />
          </div>
          <q-input
          v-model="tree.comment"
          name="comment"
          :rules="[v => v.length <= 500 || 'Commentaar mag maximaal 500 tekens zijn']"
          lazy-rules
          clearable
          maxlength="500"
          label="Commentaar"
          type="textarea"
          outlined
          dense
          />
          <q-checkbox
          v-model="tree.finished"
          name="afgerond"
          label="Afgerond"
          @update:model-value="val => { if (val) tree.date_finished = new Date().toISOString().slice(0, 10); else tree.date_finished = null }"
          dense
          />
          <q-separator spaced />
        </q-form>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="primary" label="Opslaan" @click="onSubmit" :disable="!valid" />
        <q-btn flat label="Annuleren" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">

import { ref, watch } from 'vue';
import type { Address } from 'src/models/Address';
import type { Tree } from 'src/models/Tree';
import { useDialogPluginComponent } from 'quasar';
import CameraOrGalleryBtnComponent from './CameraOrGalleryBtnComponent.vue';

const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent();
const form = ref();
const valid = ref(false);
const imagesList = ref<string[]>([]);
const props = defineProps<{
  address: Address;
  tree: Tree;
}>();
const tree = ref<Tree>({ ...props.tree });
defineEmits([
  ...useDialogPluginComponent.emits
]);

// Watch for changes in boom to revalidate
watch(tree, checkFormValidity, { deep: true });

// Function to check the validity of the form
async function checkFormValidity() {
  if (form.value) {
    valid.value = await form.value.validate();
  }
}

const createdImage = (data: string) => {
  imagesList.value.push(data);
  return data;
}

function onSubmit() {
 if (form.value) {
    form.value.validate().then((isValid: boolean) => {
      if (isValid) {

        console.log('Form is valid, submitting data:', tree.value);

        // updateTree();

        onDialogCancel();
      } else {
        console.error('Form is invalid');
      }
    })
  }
  else {
    console.error('Form reference is not available');
  }
}


function onReset() {
  form.value.reset();
}

</script>
