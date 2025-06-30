<template>
  <div>
    <q-table
      flat bordered
      :title= "`${adres}`"
      title-class="text-h6"
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :filter="filter"
      no-data-label="I didn't find anything for you"
      no-results-label="The filter didn't uncover any results"
      row-key="id"
      :pagination="{
        rowsPerPage: 15
      }"
    >

    <template #loading>
      <q-inner-loading
        showing
        color="primary"
      />
    </template>

      <template #body="props" >

        <q-tr :props="props" @click="showDialog(props.row)" class="cursor-pointer">

        <q-td key="huisnummer" :props="props">
          <q-btn flat color="primary" @click="copyToClipboard(`${props.row.straatnaam} ${props.row.huisnummer} ${props.row.stad} ${props.row.postcode}`)">
            {{ props.row.huisnummer }}
          </q-btn>
        </q-td>

        <q-td key="stad" :props="props">
            {{ props.row.stad }}
        </q-td>

        <q-td key="postcode" :props="props">
            {{ props.row.postcode }}
        </q-td>

        <q-td key="afgerond" :props="props">
            {{ props.row.afgerond }}
        </q-td>
        </q-tr>
      </template>

      <template v-slot:top-right>
        <q-input borderless dense debounce="300" v-model="filter" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>

      <template v-slot:no-data="{ icon, message, filter }">
        <div class="full-width row flex-center text-accent q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span>
            Well this is sad... {{ message }}
          </span>
          <q-icon size="2em" :name="filter ? 'filter_b_and_w' : icon" />
        </div>
      </template>

    </q-table>
    </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { copyToClipboard, Dialog } from 'quasar';
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import type { Adres } from 'src/models/Adres';
import { useRoute } from 'vue-router';
import HuisnummerDialogComponent from './HuisnummerDialogComponent.vue';

const route = useRoute();
const adres = ref(route.params.adres)
const filter = ref('');
const loading = ref(true);
let rawData: Adres[];

function showDialog(row: Adres) {
  console.log(row);
  Dialog.create({
    component: HuisnummerDialogComponent,
    componentProps: {
      adres: row,
    }
  }).onOk(() => {
    console.log('OK')
  }).onCancel(() => {
    console.log('Cancel')
  }).onDismiss(() => {
    console.log('Called on OK or Cancel')
  })
}

api.get('/api/adres/straat/' + adres.value?.toString()).then(
  function (response) {
  rawData = response.data ;

  console.log(response.data);

  rows = rawData.map((item: Adres) => {
    return {
      id: item.id,
      straatnaam: item.straatnaam,
      huisnummer: item.huisnummer,
      huisnummers: item.huisnummers,
      stad: item.stad,
      postcode: item.postcode,
      afgerond: item.afgerond,
     }
  });

  }).finally(() => {
    loading.value = false
  })
  .catch(error => {
    console.log(error)
  });

let rows: Adres[] = []
const columns: QTableColumn[] = [
{
  name: 'huisnummer',
  align: 'center',
  label: 'Huisnummer',
  field: 'huisnummer',
  sortable: true,
},
{ name: 'stad', label: 'Stad', field: 'stad', sortable: true },
{ name: 'postcode', label: 'Postcode', field: 'postcode', sortable: true },
{ name: 'afgerond', label: 'Afgerond?', align: 'left', field: (row) => row.afgerond ? "Ja" : "Nee" }
];
</script>
