<template>
  <div>
    <q-table
    flat bordered
    title="Adressen Overzicht"
    title-class="text-h6 primary-color"
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
    }">

    <template #loading>
      <q-inner-loading
      showing
      color="primary"
      />
    </template>

    <template #body="props">
      <q-tr
      :props="props"
      @click="$router.push({ name: 'housenumber-overview', params: { address: props.row.streetname } })"
      :class="props.row.allFinished ? 'finished-row-item' : 'unfinished-row-item'"
      class="cursor-pointer"
      >
      <q-td key="streetname" :props="props">
        <q-btn flat color="primary" @click.stop="copyToClipboard(`${props.row.streetname}`)">
          {{ props.row.streetname }}
        </q-btn>
      </q-td>

      <q-td key="housenumbers" :props="props">
        {{ props.row.housenumbers.length <= 1 ?  props.row.housenumbers + '' : props.row.housenumbers[0] + '....' + props.row.housenumbers[props.row.housenumbers.length - 1]}}
      </q-td>

      <q-td key="city" :props="props">
        {{ props.row.city }}
      </q-td>

      <q-td key="zipcode" :props="props">
        {{ props.row.zipcode }}
      </q-td>

      <q-td key="count" :props="props">
        {{ props.row.housenumbers.length }}
      </q-td>

      <q-td key="completed" :props="props">
        <span :style="{ color: props.row.allFinished ? 'green' : 'red' }">
          {{ props.row.allFinished ? "Ja" : "Nee" }}
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
  import { api } from 'src/boot/axios';
  import { ref } from 'vue';
  import { copyToClipboard } from 'quasar'
  import type { Address } from 'src/models/Address';

  const filter = ref('');
  const loading = ref(true);
  let rawData: Address[];
  let result: Address[];

  api.get('/api/address/').then(
  function (response) {
    rawData = response.data ;
    const filteredData = rawData.reduce((acc: Address[], current) => {
      const existingAddress = acc.find(address => address.streetname === current.streetname);
      if (existingAddress) {
        existingAddress.housenumbers = existingAddress.housenumbers ? [...existingAddress.housenumbers, current.housenumber] : [current.housenumber];
      } else {
        acc.push({
          ...current,
          housenumbers: [current.housenumber],
        });
      }
      return acc;
    }, []);

    result = filteredData.map(address => {
      return {
        id: address.id,
        housenumber: address.housenumber,
        streetname: address.streetname,
        housenumbers: address.housenumbers,
        city: address.city,
        zipcode: address.zipcode,
        finished: address.finished,
        date_finished: address.date_finished,
        trees: address.trees,
      };
    });

    result = result.map(address => {
      const streetAddresses = rawData.filter(a => a.streetname === address.streetname);
      const allDone = streetAddresses.length > 0 && streetAddresses.every(a => a.finished);
      return {
        ...address,
        allFinished: allDone
      };

    });
  }).finally(() => {
    rows = result
    loading.value = false
  })
  .catch(error => {
    console.log(error)
  });

  let rows: Address[] = []
  const columns: QTableColumn[] = [
  {
    name: 'streetname',
    label: 'Straat',
    field: 'streetname',
    required: true,
    align: 'left',
    sortable: true,
  },
  {
    name: 'housenumbers',
    label: 'Huisnummers',
    field: 'housenumbers',
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
    align: 'center',
    sortable: true
  },
  {
    name: 'count',
    label: 'Aantal',
    field: 'count',
    align: 'center',
    sortable: true
  },
  {
    name: 'completed',
    label: 'Afgerond?',
    field: 'finished',
    align: 'center',
  }
  ];
</script>
