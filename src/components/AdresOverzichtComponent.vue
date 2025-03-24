<template>
  <div>
    <q-table
      flat bordered
      title="Adressen"
      :loading="loading"
      :rows="rows"
      :columns="columns"
      :filter="filter"
      no-data-label="I didn't find anything for you"
      no-results-label="The filter didn't uncover any results"
      row-key="idAdres"
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
        <q-tr :props="props" >

        <q-td key="idAdres" :props="props">
            {{ props.row.idAdres }}
        </q-td>

        <q-td key="straat" :props="props">
          <q-btn flat color="primary" @click="copyToClipboard(`${props.row.straatNaam} ${props.row.huisnummer}`)">
            {{ props.row.straatNaam }}
          </q-btn>
        </q-td>

        <q-td key="huisnummer" :props="props">
            {{ props.row.huisnummer }}
        </q-td>

        <q-td key="stad" :props="props">
            {{ props.row.stad }}
        </q-td>

        <q-td key="postcode" :props="props">
            {{ props.row.postcode }}
        </q-td>

        <!-- <q-td key="afgerond" :props="props">
            {{ props.row.afgerond }}
        </q-td> -->
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
import { api } from 'src/boot/axios';
import { ref } from 'vue';
import { copyToClipboard } from 'quasar'
import type { Adres } from 'src/models/Adres';

const filter = ref('');
const loading = ref(true);
const duplicates: Adres[] = [];
let filteredAdres: Adres[];
const AlterAdresDataset: Adres[] = [];
let rawData: Adres[];

api.get('/api/adres').then(
  function (response) {
  rows = response.data
  rawData = response.data ;

    rawData.forEach((x: Adres, i: number) => {

      filteredAdres = duplicates.filter((q, i) => {
        if(q.straatNaam == x.straatNaam) {
          if(duplicates[i] !== undefined) {
            saveFilteredAdressObjs(duplicates[i])
            delete duplicates[i]
            delete rawData[i]
          }
          return q;
        }
      })

      if (filteredAdres[i]?.straatNaam !== x.straatNaam) {
        duplicates.push(x)
      }

      // verwijder alle duplicate adressen uit actuele array forloop.
      // rawData = rawData.filter(c => filteredAdressen.includes(c))

    })
    console.log(duplicates)
    console.log(AlterAdresDataset)


  }).finally(() => {

    rows = AlterAdresDataset
    loading.value = false
  })
  .catch(error => {
    console.log(error)
  });

const saveFilteredAdressObjs = function (filteredAdres: Adres) {

    AlterAdresDataset.push(filteredAdres)
}

let rows: Adres[];
const columns: QTableColumn[] = [
  {
    name: 'idAdres',
    label: '#',
    field: 'idAdres'
  },
  {
    name: 'straat',
    required: true,
    label: 'Straat',
    align: 'left',
    field: (row) => row.straatNaam,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: 'huisnummer',
    align: 'center',
    label: 'Huisnummers',
    field: 'huisnummer',
    sortable: true,
  },
  { name: 'stad', label: 'Stad', field: 'stad', sortable: true },
  { name: 'postcode', label: 'Postcode', field: 'postcode', sortable: true },
  // { name: 'afgerond', label: 'Afgerond', field: 'afgerond' },
];
</script>
