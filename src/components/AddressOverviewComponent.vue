<template>
  <div>
    <q-pull-to-refresh @refresh="onPullRefresh">
    <!-- Search & Filter Section -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model="searchQuery"
              label="Zoek op straat, stad of postcode"
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filterStatus"
              :options="statusOptions"
              label="Filter status"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-select
              v-model="filterCity"
              :options="cityOptions"
              label="Filter stad"
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
    title="Adressen Overzicht"
    title-class="text-h6 primary-color"
    class="width-800px"
    :rows="filteredRows"
    :columns="columns"
    :visible-columns="visibleColumns"
    :dense="isCompact"
    no-data-label="Geen adressen gevonden"
    no-results-label="Geen resultaten gevonden"
    row-key="id"
    virtual-scroll
    table-style="max-height: 70vh"
    :rows-per-page-options="[0]"
    :pagination="{
      rowsPerPage: 0
    }">

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
    <div class="row q-gutter-sm" :class="isCompact ? 'items-stretch full-width justify-end' : 'items-center'">
      <q-chip
        outline
        color="primary"
        icon="filter_list"
        :dense="isCompact"
      >
        {{ filteredRows.length }} van {{ rows.length }} adressen
      </q-chip>
      <q-btn-dropdown
        flat
        dense
        icon="download"
        color="primary"
        dropdown-icon="arrow_drop_down"
      >
        <q-tooltip>Exporteer</q-tooltip>
        <q-list>
          <q-item clickable v-close-popup @click="exportToExcel">
            <q-item-section avatar>
              <q-icon name="table_chart" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Excel (.xlsx)</q-item-label>
              <q-item-label caption>Volledige export met alle details</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="exportToPDF">
            <q-item-section avatar>
              <q-icon name="picture_as_pdf" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label>PDF (.pdf)</q-item-label>
              <q-item-label caption>Overzichtsrapport</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        flat
        round
        dense
        icon="refresh"
        @click="loadAddresses"
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
  import { ref, computed } from 'vue';
  import { copyToClipboard, useQuasar } from 'quasar'
  import type { Address } from 'src/models/Address';
  import { useApi } from '../composables/useApi';
  import { useAppNotify } from 'src/composables/useAppNotify';
  import ExcelJS from 'exceljs';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';

  const { fetchData, prefetchTreesForCache } = useApi();
  const notifier = useAppNotify();
  const $q = useQuasar();

  const searchQuery = ref('');
  const filterStatus = ref<string | null>(null);
  const filterCity = ref<string | null>(null);
  const allAddresses = ref<Address[]>([]);
  const rows = ref<Address[]>([]);

  const statusOptions = ['Alle', 'Afgerond', 'Lopend'];
  const isCompact = computed(() => $q.screen.lt.md);
  const visibleColumns = computed(() =>
    isCompact.value
      ? ['streetname', 'city', 'count', 'completed']
      : columns.map((column) => column.name)
  );

  // Background worker to prefetch all trees with images for offline support
  function startBackgroundCaching() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    // Wait 2 seconds to not interfere with initial page load
    setTimeout(() => {
      void (async () => {
        await prefetchTreesForCache();
      })();
    }, 2000);
  }

  // Load data with new API composable
  async function loadAddresses() {
    const data = await fetchData<Address[]>('/api/address/', 'Fout bij laden van adressen');

    if (!data) return;

    allAddresses.value = data;

    // Group by street
    const filteredData = data.reduce((acc: Address[], current) => {
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

    // Map to desired format
    const result = filteredData.map(address => {
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

    // Determine if all house numbers in the street are finished
    rows.value = result.map(address => {
      const streetAddresses = data.filter(a => a.streetname === address.streetname);
      const allDone = streetAddresses.length > 0 && streetAddresses.every(a => a.finished);
      return {
        ...address,
        allFinished: allDone
      };
    });

    // Start background worker to cache all trees+images (non-blocking)
    startBackgroundCaching();
  }

  const onPullRefresh = (done: () => void) => {
    void loadAddresses().finally(done);
  };

    // Computed: unique cities for filter
  const cityOptions = computed(() => {
    const cities = new Set(allAddresses.value.map(addr => addr.city));
    return ['Alle', ...Array.from(cities)].filter(Boolean);
  });

  // Computed: filtered rows based on search and filters
  const filteredRows = computed(() => {
    let filtered = rows.value;

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(row =>
        row.streetname.toLowerCase().includes(query) ||
        row.city.toLowerCase().includes(query) ||
        row.zipcode.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus.value && filterStatus.value !== 'Alle') {
      const shouldBeFinished = filterStatus.value === 'Afgerond';
      filtered = filtered.filter(row => row.allFinished === shouldBeFinished);
    }

    // City filter
    if (filterCity.value && filterCity.value !== 'Alle') {
      filtered = filtered.filter(row => row.city === filterCity.value);
    }

    return filtered;
  });

  // Excel export function
  const exportToExcel = async () => {
    try {
      // Sheet 1: Straten overzicht
      const straatData = filteredRows.value.map(row => ({
        'Straat': row.streetname,
        'Stad': row.city,
        'Postcode': row.zipcode,
        'Aantal Huisnummers': row.housenumbers.length,
        'Afgerond': row.allFinished ? 'Ja' : 'Nee'
      }));

      // Sheet 2: Hierarchische weergave - Adressen met bomen als children
      const hierarchicalData: Array<{
        'Type': string;
        'Straat': string;
        'Huisnummer': string;
        'Boom#': string;
        'Boomtype': string;
        'Hoogte (m)': string;
        'Diameter (cm)': string;
        'Afgerond': string;
        'Datum Afgerond': string;
        'Commentaar': string;
      }> = [];

      // Group addresses by street
      const streetGroups = new Map<string, typeof allAddresses.value>();
      allAddresses.value.forEach(address => {
        if (!streetGroups.has(address.streetname)) {
          streetGroups.set(address.streetname, []);
        }
        streetGroups.get(address.streetname)?.push(address);
      });

      // Build hierarchical structure
      streetGroups.forEach((addresses) => {
        addresses.forEach(address => {
          // Add address row
          hierarchicalData.push({
            'Type': 'Adres',
            'Straat': address.streetname,
            'Huisnummer': address.housenumber.toString(),
            'Boom#': '',
            'Boomtype': '',
            'Hoogte (m)': '',
            'Diameter (cm)': '',
            'Afgerond': address.finished ? 'Ja' : 'Nee',
            'Datum Afgerond': address.date_finished || '-',
            'Commentaar': `${address.trees?.length || 0} bomen`
          });

          // Add tree children
          address.trees?.forEach(tree => {
            hierarchicalData.push({
              'Type': '  └─ Boom',
              'Straat': '',
              'Huisnummer': '',
              'Boom#': tree.treenumber.toString(),
              'Boomtype': tree.treetype,
              'Hoogte (m)': tree.height?.toString() || '-',
              'Diameter (cm)': tree.diameter?.toString() || '-',
              'Afgerond': tree.finished ? 'Ja' : 'Nee',
              'Datum Afgerond': tree.date_finished || '-',
              'Commentaar': tree.comment || '-'
            });
          });
        });
      });

      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // Add Sheet 1: Straten overzicht
      const ws1 = workbook.addWorksheet('Straten Overzicht');
      ws1.columns = [
        { header: 'Straat', key: 'Straat', width: 25 },
        { header: 'Stad', key: 'Stad', width: 15 },
        { header: 'Postcode', key: 'Postcode', width: 10 },
        { header: 'Aantal Huisnummers', key: 'Aantal Huisnummers', width: 20 },
        { header: 'Afgerond', key: 'Afgerond', width: 10 },
      ];
      ws1.addRows(straatData);

      // Add Sheet 2: Hierarchical view
      const ws2 = workbook.addWorksheet('Adressen met Bomen');
      ws2.columns = [
        { header: 'Type', key: 'Type', width: 12 },
        { header: 'Straat', key: 'Straat', width: 25 },
        { header: 'Huisnummer', key: 'Huisnummer', width: 12 },
        { header: 'Boom#', key: 'Boom#', width: 10 },
        { header: 'Boomtype', key: 'Boomtype', width: 20 },
        { header: 'Hoogte (m)', key: 'Hoogte (m)', width: 12 },
        { header: 'Diameter (cm)', key: 'Diameter (cm)', width: 15 },
        { header: 'Afgerond', key: 'Afgerond', width: 10 },
        { header: 'Datum Afgerond', key: 'Datum Afgerond', width: 15 },
        { header: 'Commentaar', key: 'Commentaar', width: 30 },
      ];
      ws2.addRows(hierarchicalData);

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `Volledige_Export_${date}.xlsx`;

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      const totalBomen = allAddresses.value.reduce((sum, addr) => sum + (addr.trees?.length || 0), 0);
      notifier.success(`Excel-bestand gedownload: ${filename} (${straatData.length} straten, ${allAddresses.value.length} adressen, ${totalBomen} bomen)`, {
        timeout: 4000,
      });
    } catch (error) {
      notifier.error('Fout bij exporteren naar Excel');
      console.error('Export error:', error);
    }
  };

  // PDF export function
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const date = new Date().toISOString().split('T')[0];

      // Title
      doc.setFontSize(18);
      doc.text('Overzichtsrapport Bomeninventarisatie', 14, 20);
      doc.setFontSize(11);
      doc.text(`Gegenereerd op: ${date}`, 14, 28);

      let yPos = 35;

      // Section 1: Straten Overzicht
      doc.setFontSize(14);
      doc.text('Straten Overzicht', 14, yPos);
      yPos += 5;

      const straatData = filteredRows.value.map(row => [
        row.streetname,
        row.city,
        row.zipcode,
        row.housenumbers.length.toString(),
        row.allFinished ? 'Ja' : 'Nee'
      ]);

      autoTable(doc, {
        head: [['Straat', 'Stad', 'Postcode', 'Huisnummers', 'Afgerond']],
        body: straatData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 }
      });

      yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      // Section 2: Hierarchische weergave - Adressen met bomen
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Adressen met Bomen (Hierarchisch)', 14, yPos);
      yPos += 5;

      // Build hierarchical data structure
      const hierarchicalData: Array<Array<string>> = [];
      const streetGroups = new Map<string, typeof allAddresses.value>();

      allAddresses.value.forEach(address => {
        if (!streetGroups.has(address.streetname)) {
          streetGroups.set(address.streetname, []);
        }
        streetGroups.get(address.streetname)?.push(address);
      });

      streetGroups.forEach((addresses) => {
        addresses.forEach(address => {
          // Add address row
          hierarchicalData.push([
            address.streetname,
            address.housenumber.toString(),
            '',
            '',
            '',
            '',
            address.finished ? 'Ja' : 'Nee',
            `${address.trees?.length || 0} bomen`
          ]);

          // Add tree children with indentation
          address.trees?.forEach(tree => {
            hierarchicalData.push([
              '',
              '',
              '  → ' + tree.treenumber,
              tree.treetype,
              tree.height?.toString() || '-',
              tree.diameter?.toString() || '-',
              tree.finished ? 'Ja' : 'Nee',
              tree.comment || '-'
            ]);
          });
        });
      });

      autoTable(doc, {
        head: [['Straat', 'Nr', 'Boom#', 'Type', 'H(m)', 'D(cm)', 'Klaar', 'Info']],
        body: hierarchicalData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 15 },
          2: { cellWidth: 18 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 35 }
        },
        didParseCell: function(data) {
          // Style address rows differently from tree rows
          if (data.row.index < hierarchicalData.length) {
            const rowData = hierarchicalData[data.row.index];
            if (rowData && rowData[2] === '') {
              // Address row
              data.cell.styles.fillColor = [240, 248, 255];
              data.cell.styles.fontStyle = 'bold';
            } else if (rowData) {
              // Tree row (child)
              data.cell.styles.fillColor = [255, 255, 255];
            }
          }
        }
      });

      // Save PDF
      const filename = `Overzichtsrapport_${date}.pdf`;
      doc.save(filename);

      notifier.success(`PDF-rapport gedownload: ${filename}`);
    } catch (error) {
      notifier.error('Fout bij exporteren naar PDF');
      console.error('PDF export error:', error);
    }
  };

  // Load on mount
  void loadAddresses();

  const columns: QTableColumn[] = [  {
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
