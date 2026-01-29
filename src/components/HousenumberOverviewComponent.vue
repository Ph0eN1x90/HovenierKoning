<template>
  <div>
    <q-table
    flat bordered
    :title= "`${address}`"
    title-class="text-h6  primary-color"
    class="width-800px"
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

      <q-tr :props="props" @click="showDialog(props.row)" class="cursor-pointer" :class="props.row.finished ? 'finished-row-item' : 'unfinished-row-item'">

        <q-td key="housenumber" :props="props">
          <q-btn flat color="primary" @click="copyToClipboard(`${props.row.straatnaam} ${props.row.huisnummer} ${props.row.stad} ${props.row.postcode}`)">
            {{ props.row.housenumber }}
          </q-btn>
        </q-td>

        <q-td key="city" :props="props">
          {{ props.row.city }}
        </q-td>

        <q-td key="zipcode" :props="props">
          {{ props.row.zipcode }}
        </q-td>

        <q-td key="completed" :props="props">
          <span :style="{ color: props.row.finished ? 'green' : 'red' }">
            {{ props.row.finished ? "Ja" : "Nee" }}
          </span>
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
  import type { Address } from 'src/models/Address';
  import { useRoute } from 'vue-router';
  import HousenumberDialogComponent from './HousenumberDialogComponent.vue';

  const route = useRoute();
  const address = ref(route.params.address)
  const filter = ref('');
  const loading = ref(true);
  let rawData: Address[];

  function showDialog(row: Address) {
    Dialog.create({
      component: HousenumberDialogComponent,
      componentProps: {
        address: row,
      }
    })
  }

  api.get('/api/address/street/' + address.value?.toString()).then(
  function (response) {
    rawData = response.data ;
    rows = rawData.map((item: Address) => {
      return {
        id: item.id,
        streetname: item.streetname,
        housenumber: item.housenumber,
        housenumbers: item.housenumbers,
        city: item.city,
        zipcode: item.zipcode,
        finished: item.finished,
        date_finished: item.date_finished,
      }
    });

  }).finally(() => {
    loading.value = false
  })
  .catch(error => {
    console.log(error)
  });

  let rows: Address[] = []
  const columns: QTableColumn[] = [
  {
    name: 'housenumber',
    label: 'Huisnummer',
    field: 'housenumber',
    align: 'center',

    sortable: true,
  },
  {
    name: 'city',
    label: 'Stad',
    field: 'city',
    align: 'left',
    sortable: true
  },
  {
    name: 'zipcode',
    label: 'Postcode',
    field: 'zipcode',
    align: 'left',
    sortable: true
  },
  {
    name: 'completed',
    label: 'Afgerond?',
    align: 'center',
    field: (row) => row.finished ? "Ja" : "Nee"
  }
  ];
</script>
