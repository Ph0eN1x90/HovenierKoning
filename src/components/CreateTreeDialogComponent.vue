<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" >
    <q-card style="min-width: 400px; max-width: 600px;">

      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6">Nieuwe Boom Toevoegen</div>
        <q-btn class="flex-row-title-btn" size="sm" flat round icon="close" @click="onDialogCancel" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <p>Voer de gegevens van de nieuwe boom in.</p>
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
          <q-checkbox
            v-model="tree.finished"
            name="afgerond"
            label="Afgerond"
            @update:model-value="val => { if (val) tree.date_finished = new Date().toISOString().slice(0, 10); else tree.date_finished = null; }"
            dense
          />
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

const tree = ref<Tree>({
  id: 0,
  treenumber: 0,
  treetype: '',
  diameter: 0,
  height: 0,
  date_finished: '',
  finished: false,
  comment: '',
  address: {
    id: 0,
  }
});
const { dialogRef, onDialogCancel, onDialogHide } = useDialogPluginComponent()
const form = ref();
const valid = ref(false);
const props = defineProps<{
  address: Address
  lastTreeNumber: number // Optional prop to set the last boom number
}>()

// Watch for changes in boom to revalidate
watch(tree, checkFormValidity, { deep: true });

// Function to check the validity of the form
async function checkFormValidity() {
  if (form.value) {
    valid.value = await form.value.validate();
  }
}

function onSubmit() {
  // Validate the form before submission
  if (form.value) {
    form.value.validate().then((isValid: boolean) => {
      if (isValid) {
        tree.value.treenumber = props.lastTreeNumber; // Set the last boom number from props
        tree.value.address.id = props.address.id; // Set the address from the props
        // Here you can handle the form submission, e.g., send data to an API
        tree.value.id = null; // Reset ID for new entry
        // Example API call (uncomment and adjust as needed)
        api.post('/api/trees/save', tree.value)
          .then(response => {
            console.log('Boom saved successfully:', response.data);
          }).finally(() => {
            // Reset the form and close the dialog
            onReset();
            onDialogHide(); // Close the dialog after submission
          })
          .catch(error => {
            console.error('Error saving boom:', error);
          });
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
  // Reset the form fields if needed
  tree.value = {
    id: 0,
    treenumber: 0,
    treetype: '',
    diameter: 0,
    height: 0,
    date_finished: '',
    finished: false,
    comment: '',
    address: {
      id: 0,
    }
  }
  valid.value = false; // Reset the validity state
}

</script>
