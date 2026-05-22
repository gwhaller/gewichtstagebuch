<template>
  <q-page class="q-pa-none" style="padding-bottom: 80px; background: #f5f5f5">
    <!-- Tab-Bar -->
    <q-tabs
      v-model="tab"
      dense
      align="justify"
      active-color="white"
      indicator-color="green"
      class="bg-primary text-white"
    >
      <q-tab name="uebersicht" label="ÜBERSICHT" />
      <q-tab name="liste" label="LISTE" />
    </q-tabs>

    <q-tab-panels
      v-model="tab"
      animated
      swipeable
      style="background: transparent"
    >
      <!-- ÜBERSICHT -->
      <q-tab-panel name="uebersicht" class="q-pt-sm q-px-md q-pb-sm">
        <!-- Chart -->
        <div style="margin-bottom: 8px">
          <div style="position: relative; height: 220px">
            <Line
              v-if="chartData.labels.length"
              :data="chartData"
              :options="chartOptions"
            />
            <div v-else class="text-center text-grey q-pt-xl">
              Noch keine Daten
            </div>
          </div>
        </div>

        <!-- Zeitfilter -->
        <div class="row q-mb-md" style="gap: 6px">
          <q-btn
            v-for="f in filters"
            :key="f.key"
            :label="f.label"
            :color="activeFilter === f.key ? 'grey-6' : 'grey-4'"
            :text-color="activeFilter === f.key ? 'white' : 'black'"
            :class="activeFilter === f.key ? 'text-weight-bold' : ''"
            dense
            unelevated
            @click="activeFilter = f.key"
            style="flex: 1"
          />
        </div>

        <!-- Zielgewicht -->
        <div class="row items-center q-mb-md">
          <q-checkbox
            v-model="showTarget"
            label="Zielgewicht anzeigen"
            color="green"
          />
        </div>

        <!-- Stats-Karte -->
        <q-card flat bordered>
          <q-card-section>
            <div class="row justify-between q-mb-xs">
              <span>Aktuelles Gewicht</span>
              <span class="text-weight-medium">{{ latestWeight }} kg</span>
            </div>
            <div class="row justify-between q-mb-xs">
              <span>Aktueller BMI</span>
              <span class="text-weight-medium">{{ currentBmi }}</span>
            </div>
            <div class="row justify-between q-mb-xs">
              <span>Gewichtsänderung</span>
              <span :class="changeClass" class="text-weight-medium">{{
                weightChangeStr
              }}</span>
            </div>
            <div class="row justify-between q-mb-xs">
              <span>bis zum Zielgewicht</span>
              <span class="text-weight-medium">{{ toTarget }} kg</span>
            </div>
            <div class="row justify-between">
              <span>Tage seit Start</span>
              <span class="text-weight-medium">{{ daysSinceStart }} Tage</span>
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <!-- LISTE -->
      <q-tab-panel name="liste" class="q-pa-none">
        <q-item-label header class="row text-weight-bold">
            <span style="flex: 1.2">Datum</span>
            <span style="flex: 1">Taille</span>
            <span style="flex: 1; text-align: right">Gewicht</span>
            <span style="flex: 1; text-align: right">Diff</span>
            <span style="flex: 0.8; text-align: right">BMI</span>
          </q-item-label>
        <q-virtual-scroll
          :items="listEntries"
          separator
          :virtual-scroll-item-size="48"
          style="height: calc(100vh - 170px)"
          v-slot="{ item: entry, index: i }"
        >
          <q-item
            :key="entry.date"
            clickable
            @click="startEdit(entry)"
          >
            <q-item-section>
              <div class="row items-center">
                <span style="flex: 1.2">{{ formatDate(entry.date) }}</span>
                <span style="flex: 1; font-size: 12px; color: #888">{{ entry.note }}</span>
                <span style="flex: 1; text-align: right">{{ entry.weight }} kg</span>
                <span
                  :style="diffStyle(entry, i)"
                  style="flex: 1; text-align: right; font-weight: 500"
                >{{ diffStr(entry, i) }}</span>
                <span style="flex: 0.8; text-align: right">{{ entryBmi(entry) }}</span>
              </div>
            </q-item-section>
          </q-item>
        </q-virtual-scroll>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Edit Dialog -->
    <EntryDialog
      v-model="editDialog"
      :edit-date="editEntry?.date"
      :edit-weight="editEntry?.weight"
      :edit-note="editEntry?.note"
    />
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useWeightStore } from "src/stores/weightStore";
import EntryDialog from "src/components/EntryDialog.vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const store = useWeightStore();
const tab = ref("uebersicht");
const activeFilter = ref("3M");
const showTarget = ref(true);
const editDialog = ref(false);
const editEntry = ref(null);

const filters = [
  { key: "2W", label: "2W", days: 14 },
  { key: "4W", label: "4W", days: 28 },
  { key: "3M", label: "3M", days: 90 },
  { key: "12M", label: "12M", days: 365 },
  { key: "Alle", label: "Alle", days: null },
];

const filteredEntries = computed(() => {
  const sorted = [...store.entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const f = filters.find((f) => f.key === activeFilter.value);
  if (!f || !f.days) return sorted;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - f.days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return sorted.filter((e) => e.date >= cutoffStr);
});

const chartData = computed(() => {
  const entries = filteredEntries.value;
  const n = entries.length;
  // Punkte: offen/hohl für wenige, klein+gefüllt für mittlere, keine für viele
  const pointRadius = n <= 30 ? 4 : n <= 90 ? 2 : 0;
  const pointBgColor = n <= 30 ? "white" : "#1976D2";
  const pointBorderW = n <= 30 ? 2 : 1;

  const datasets = [
    {
      label: "Gewicht",
      data: entries.map((e) => e.weight),
      borderColor: "#1145a0",
      borderWidth: 2,
      backgroundColor: "white",
      pointBackgroundColor: pointBgColor,
      pointBorderColor: "#1145a0",
      pointBorderWidth: pointBorderW,
      pointRadius,
      pointHoverRadius: pointRadius + 2,
      tension: 0.1,
      fill: false,
    },
  ];
  if (showTarget.value && store.profile?.targetWeight) {
    datasets.push({
      label: "Zielgewicht",
      data: entries.map(() => store.profile.targetWeight),
      borderColor: "#1145a0",
      borderDash: [8, 5],
      pointRadius: 0,
      tension: 0,
      fill: false,
    });
  }
  return {
    labels: entries.map((e) => {
      const [y, m, d] = e.date.split("-");
      return `${d}.${m}.${y.slice(2)}`;
    }),
    datasets,
  };
});

const chartOptions = computed(() => {
  const entries = filteredEntries.value;
  if (!entries.length) return {};
  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const target = store.profile?.targetWeight;
  const effMin = target ? Math.min(minW, target) : minW;
  // Ganzzahlige Grenzen → Ticks landen exakt auf vollen kg-Werten
  const range = Math.ceil(maxW) - Math.floor(effMin);
  const stepSize = range <= 6 ? 1 : range <= 15 ? 2 : 5;
  const yMin = Math.floor(effMin / stepSize) * stepSize - stepSize;
  const yMax = Math.ceil(maxW / stepSize) * stepSize + stepSize;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    layout: {
      padding: { left: 0, right: 0, top: 4, bottom: 0 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        filter: (item) => item.dataset.label !== 'Zielgewicht',
        callbacks: {
          label: (ctx) => ctx.parsed.y.toFixed(1).replace(".", ",") + " kg",
          afterBody: (items) => {
            const note = entries[items[0]?.dataIndex]?.note;
            return note ? `Taille: ${note} cm` : [];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: true, color: "#e8e8e8" },
        ticks: { maxTicksLimit: 5, font: { size: 10 } },
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { display: true, color: "#e8e8e8" },
        ticks: {
          stepSize,
          callback: (v) =>
            Number.isInteger(Math.round(v / stepSize) * 1)
              ? v.toFixed(1).replace(".", ",")
              : null,
          font: { size: 10 },
        },
        afterFit: (axis) => {
          axis.width = 38;
        },
      },
    },
  };
});

const latestWeight = computed(
  () => store.latestEntry?.weight?.toFixed(1) ?? "-",
);
const currentBmi = computed(() =>
  store.bmi != null ? String(store.bmi).replace(".", ",") : "-",
);

const weightChangeStr = computed(() => {
  const c = store.weightChange;
  if (c === null) return "-";
  return (c >= 0 ? "+" : "") + c.toFixed(1) + " kg";
});
const changeClass = computed(() => {
  const c = store.weightChange;
  if (c === null) return "";
  if (store.profile?.goal === "lose")
    return c < 0 ? "text-green" : "text-orange";
  return c > 0 ? "text-green" : "text-orange";
});

const toTarget = computed(() => {
  if (!store.latestEntry || !store.profile?.targetWeight) return "-";
  return Math.abs(
    store.latestEntry.weight - store.profile.targetWeight,
  ).toFixed(1);
});

const daysSinceStart = computed(() => {
  const start = store.startWeight;
  if (!start) return 0;
  const diff = new Date() - new Date(start.date);
  return Math.floor(diff / 86400000);
});

const listEntries = computed(() =>
  [...store.entries].sort((a, b) => b.date.localeCompare(a.date)),
);

function formatDate(d) {
  return d
    ? d.slice(5).split("-").reverse().join(".") + "." + d.slice(2, 4)
    : "";
}

function entryBmi(entry) {
  if (!store.profile?.height) return "-";
  const h = store.profile.height / 100;
  return (entry.weight / (h * h)).toFixed(1);
}

function diffStr(entry, i) {
  if (i === listEntries.value.length - 1) return "0,0 kg";
  const prev = listEntries.value[i + 1];
  const d = entry.weight - prev.weight;
  return (d >= 0 ? "+" : "") + d.toFixed(1).replace(".", ",") + " kg";
}

function diffStyle(entry, i) {
  if (i === listEntries.value.length - 1) return "color: #888";
  const prev = listEntries.value[i + 1];
  const d = entry.weight - prev.weight;
  if (Math.abs(d) < 0.05) return "color: #888";
  return d < 0 ? "color: #388e3c" : "color: #e65100";
}

function startEdit(entry) {
  editEntry.value = entry;
  editDialog.value = true;
}
</script>
