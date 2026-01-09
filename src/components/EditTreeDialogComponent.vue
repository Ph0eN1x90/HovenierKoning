<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" >
    <q-card style="min-width: 400px; max-width: 600px;">

      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6">Wijzig {{tree.treetype}} boomnummer {{tree.treenumber}}</div>

        <q-btn class="flex-row-title-btn" size="sm" flat round icon="close" @click="onDialogCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <div class="text-h8">{{ $props.address.streetname + ' ' + $props.address.housenumber }}</div>
        <div class="text-h8">{{ $props.address.zipcode + ' ' + $props.address.city }}</div>
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
          outlined
          dense
          required
          />
          <CameraOrGalleryBtnComponent @created-image="createdImage" />
          <q-input
          v-model="tree.comment"
          name="comment"
          :rules="[v => v.length <= 500 || 'Commentaar mag maximaal 500 tekens zijn']"
          lazy-rules
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

import { api } from 'src/boot/axios';
import { ref, watch } from 'vue';
import type { Address } from 'src/models/Address';
import type { Tree } from 'src/models/Tree';
import { useDialogPluginComponent } from 'quasar';
import CameraOrGalleryBtnComponent from './CameraOrGalleryBtnComponent.vue';

const tree = ref<Tree>({
  id: null,
  treenumber: 0,
  treetype: '',
  diameter: 0,
  height: 0,
  date_finished: null,
  finished: false,
  comment: '',
  address: {
    id: 0,
  },
  treeimage: [] // Initialize as an empty array
});
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent();
const form = ref();
const valid = ref(false);
const imagesList = ref<string[]>([]); // Array to hold image URLs
const props = defineProps<{
  address: Address;
  lastTreeNumber: number; // Optional prop to set the last boom number
}>();
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

        tree.value.treenumber = props.lastTreeNumber;
        tree.value.address.id = props.address.id;

        imagesList.value.forEach((imageUrl) => {
          tree.value.treeimage.push({
            imageurl: imageUrl,
            id: null,
            tree: { id: tree.value.id }
          });
        });

        saveTree();

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

function saveTree() {
console.log("before post Tree save", tree)
  api.post('/api/trees/save', tree.value).then(function (response) {
    if (response.status === 200 || response.status === 201) {
      console.log('Tree saved successfully:', response.data);
      // saveTreeImages();
    } else {
      console.error('Error saving tree:', response);
    }
  }).catch(function (error) {
    console.error('Error saving tree:', error);
  });
}

function onReset() {
  // Reset the form fields if needed
  tree.value = {
    id: null,
    treenumber: 0,
    treetype: '',
    diameter: 0,
    height: 0,
    date_finished: null,
    finished: false,
    comment: '',
    address: {
      id: 0,
    },
    treeimage: []
  }
  valid.value = false;
}

</script>
