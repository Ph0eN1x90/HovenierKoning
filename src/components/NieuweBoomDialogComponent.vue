<template>
  <q-dialog v-model="dialog" persistent>
    <q-card style="min-width: 400px; max-width: 600px;">

      <q-card-section class="flex-row-title-btn-container">
        <div class="text-h6">Nieuwe Boom Toevoegen</div>
        <q-btn class="flex-row-title-btn" size="sm" flat round icon="close" @click="onClose" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-md">
        <p>Voer de gegevens van de nieuwe boom in.</p>
      </q-card-section>

      <q-card-section>
        <q-form ref="form" @submit.prevent="onSubmit" @reset="onReset" class="q-gutter-md">
          <q-input
            v-model="boom.boomtype"
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
            v-model.number="boom.diameter"
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
            v-model.number="boom.hoogte"
            name="hoogte"
            label="Hoogte (m)"
            type="number"
            :rules="[v => v >= 0 || 'Hoogte moet positief zijn']"
            lazy-rules
            outlined
            dense
            required
          />
          <q-input
            v-model="boom.datum_afgerond"
            name="datum_afgerond"
            label="Datum afgerond"
            type="date"
            outlined
            dense
            required
          />
          <q-checkbox
            v-model="boom.afgerond"
            name="afgerond"
            label="Afgerond"
            dense
          />
          <q-input
            v-model="boom.comment"
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
        <q-btn flat label="Annuleren" @click="onClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">

import { api } from 'src/boot/axios';
import { ref, watch } from 'vue';
import type { Adres } from 'src/models/Adres';
import type { Boom } from 'src/models/Boom';

const dialog = ref(true);
const form = ref();
const valid = ref(false);
const props = defineProps<{
  adres: Adres
  lastBoomNummer: number // Optional prop to set the last boom number
}>()
const boom = ref<Boom>({
  id: 0,
  boomnummer: 0,
  boomtype: '',
  diameter: 0,
  hoogte: 0,
  datum_afgerond: '',
  afgerond: false,
  comment: '',
  adres: {
    id: 0,
  }
});

// Watch for changes in boom to revalidate
watch(boom, checkFormValidity, { deep: true });

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
        console.log(props.adres.huisnummer.toString());
        boom.value.boomnummer = props.lastBoomNummer; // Set the last boom number from props
        boom.value.adres.id = props.adres.id; // Set the address from the props
        // Here you can handle the form submission, e.g., send data to an API
        boom.value.id = null; // Reset ID for new entry
        console.log('Form submitted:', boom.value);
        // Example API call (uncomment and adjust as needed)
        api.post('/api/bomen/save', boom.value)
          .then(response => {
            console.log('Boom saved successfully:', response.data);
          })
          .catch(error => {
            console.error('Error saving boom:', error);
          });

        dialog.value = false; // Close the dialog after submission
      } else {
        console.error('Form is invalid');
      }
    });
  }
  else {
    console.error('Form reference is not available');
  }
}

function onReset() {
  // Reset the form fields if needed
  boom.value = {
    id: 0,
    boomnummer: 0,
    boomtype: '',
    diameter: 0,
    hoogte: 0,
    datum_afgerond: '',
    afgerond: false,
    comment: '',
    adres: {
      id: 0,
    }
  }
  valid.value = false; // Reset the validity state
}

function onClose() {
  dialog.value = false;
}
</script>
