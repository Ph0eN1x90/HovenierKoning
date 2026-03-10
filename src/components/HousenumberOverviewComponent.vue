<template>
  <div>
    <q-pull-to-refresh @refresh="onPullRefresh">
    <!-- Bulk Actions -->
    <q-card v-if="selected.length > 0" flat bordered class="q-mb-md bg-blue-1">
      <q-card-section class="row items-center q-py-sm">
        <div class="col">
          <q-icon name="checklist" size="sm" class="q-mr-sm" />
          <strong>{{ selected.length }}</strong> {{ selected.length === 1 ? 'huisnummer' : 'huisnummers' }} geselecteerd
        </div>
        <div class="col-auto q-gutter-sm">
          <q-btn
            color="positive"
            icon="check_circle"
            :label="isCompact ? undefined : 'Markeer als afgerond'"
            @click="bulkMarkAsFinished"
            :loading="bulkLoading"
            :round="isCompact"
            :dense="isCompact"
            unelevated
          />
          <q-btn
            flat
            color="negative"
            icon="clear"
            :label="isCompact ? undefined : 'Annuleer selectie'"
            @click="clearSelection"
            :disable="bulkLoading"
            :round="isCompact"
            :dense="isCompact"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Search & Filter -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="searchQuery"
              label="Zoek op huisnummer of postcode"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="filterStatus"
              :options="statusOptions"
              label="Filter status"
              outlined
              dense
              clearable
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-table
    flat bordered
    :title="`${address}`"
    title-class="text-h6  primary-color"
    class="width-800px"
    :rows="filteredRows"
    :columns="columns"
    :visible-columns="visibleColumns"
    :dense="isCompact"
    no-data-label="Geen huisnummers gevonden"
    no-results-label="Geen resultaten gevonden"
    row-key="id"
    v-model:selected="selected"
    selection="multiple"
    virtual-scroll
    table-style="max-height: 70vh"
    :rows-per-page-options="[0]"
    :pagination="{
      rowsPerPage: 0
    }"
    >

    <template #body="props" >
      <q-tr :props="props" :class="props.row.finished ? 'finished-row-item' : 'unfinished-row-item'">
        <q-td auto-width>
          <q-checkbox v-model="props.selected" />
        </q-td>

        <q-td key="housenumber" :props="props" class="cursor-pointer" @click="showDialog(props.row)">
          <q-btn flat color="primary" @click.stop="copyToClipboard(`${props.row.streetname} ${props.row.housenumber} ${props.row.city} ${props.row.zipcode}`)">
            {{ props.row.housenumber }}
          </q-btn>
        </q-td>

        <q-td key="city" :props="props" class="cursor-pointer" @click="showDialog(props.row)">
          {{ props.row.city }}
        </q-td>

        <q-td key="zipcode" :props="props" class="cursor-pointer" @click="showDialog(props.row)">
          {{ props.row.zipcode }}
        </q-td>

        <q-td key="completed" :props="props" class="cursor-pointer" @click="showDialog(props.row)">
          <span :style="{ color: props.row.finished ? 'green' : 'red' }">
            {{ props.row.finished ? "Ja" : "Nee" }}
          </span>
        </q-td>
      </q-tr>
    </template>

    <template v-slot:top-right>
      <div class="row q-gutter-sm" :class="isCompact ? 'items-stretch full-width justify-end' : 'items-center'">
        <q-chip
          outline
          color="primary"
          icon="filter_list"
          :dense="isCompact"
        >
          {{ filteredRows.length }} van {{ rows.length }} huisnummers
        </q-chip>
        <q-btn
          flat
          round
          dense
          icon="refresh"
          @click="refreshAddresses"
          color="primary"
        >
          <q-tooltip>Ververs data</q-tooltip>
        </q-btn>
      </div>
    </template>

    <template v-slot:no-data="{ icon, message }">
      <div class="full-width row flex-center text-accent q-gutter-sm">
        <q-icon size="2em" name="sentiment_dissatisfied" />
        <span>
          {{ message }}
        </span>
        <q-icon size="2em" :name="icon" />
      </div>
    </template>

  </q-table>
  </q-pull-to-refresh>
</div>
</template>

<script setup lang="ts">
  import type { QTableColumn } from 'quasar';
  import { copyToClipboard, Dialog, useQuasar } from 'quasar';
  import { ref, computed } from 'vue';
  import type { Address } from 'src/models/Address';
  import { useRoute } from 'vue-router';
  import HousenumberDialogComponent from './HousenumberDialogComponent.vue';
  import { useApi } from '../composables/useApi';

  const route = useRoute();
  const $q = useQuasar();
  const address = ref(route.params.address as string);
  const searchQuery = ref('');
  const filterStatus = ref<string | null>(null);
  const { fetchData, putData } = useApi();
  const bulkLoading = ref(false);
  const selected = ref<Address[]>([]);
  const rows = ref<Address[]>([]);
  const statusOptions = ['Alle', 'Afgerond', 'Lopend'];
  const isCompact = computed(() => $q.screen.lt.md);
  const visibleColumns = computed(() =>
    isCompact.value
      ? ['housenumber', 'zipcode', 'completed']
      : columns.map((column) => column.name)
  );

  // Computed: filtered rows
  const filteredRows = computed(() => {
    let filtered = rows.value;

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(row =>
        row.housenumber.toString().includes(query) ||
        row.zipcode.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus.value && filterStatus.value !== 'Alle') {
      const shouldBeFinished = filterStatus.value === 'Afgerond';
      filtered = filtered.filter(row => row.finished === shouldBeFinished);
    }

    return filtered;
  });

  const loadAddresses = async () => {
    const response = await fetchData<Address[]>(`/api/address/street/${address.value}`);
    if (response) {
      rows.value = response;
    }
  };

  const refreshAddresses = async () => {
    await loadAddresses();
  };

  const onPullRefresh = (done: () => void) => {
    void refreshAddresses().finally(done);
  };

  const clearSelection = () => {
    selected.value = [];
  };

  const bulkMarkAsFinished = async () => {
    if (selected.value.length === 0) return;

    bulkLoading.value = true;
    const ids = selected.value.map(addr => addr.id);
    const description = `${selected.value.length} adres(sen) markeren als afgerond`;

    const response = await putData('/api/address/bulk-finish', { ids }, 'Adressen gemarkeerd als afgerond', description);

    if (response) {
      await refreshAddresses();
      clearSelection();
    }
    bulkLoading.value = false;
  };

  function showDialog(row: Address) {
    Dialog.create({
      component: HousenumberDialogComponent,
      componentProps: {
        address: row,
      }
    }).onOk(() => {
      void refreshAddresses();
    }).onDismiss(() => {
      void refreshAddresses();
    });
  }

  // Initial load
  void loadAddresses();

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
