<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">BMI-Rechner</div>

    <div class="row items-center q-mb-md">
      <div class="col-4 text-weight-medium">Größe</div>
      <div class="col-5">
        <q-input v-model.number="height" dense type="number" />
      </div>
      <div class="col-3 q-pl-sm">
        <q-btn unelevated color="grey-3" text-color="black" label="cm" dense />
      </div>
    </div>

    <div class="row items-center q-mb-lg">
      <div class="col-4 text-weight-medium">Gewicht</div>
      <div class="col-5">
        <q-input v-model.number="weight" dense type="number" step="0.1" />
      </div>
      <div class="col-3 q-pl-sm">
        <q-btn unelevated color="grey-3" text-color="black" label="kg" dense />
      </div>
    </div>

    <div class="text-h5 text-weight-bold q-mb-lg">BMI &nbsp; {{ bmi }}</div>

    <q-list bordered separator class="rounded-borders">
      <q-item
        v-for="cat in categories"
        :key="cat.label"
        :class="currentCategory === cat.label ? 'bg-grey-3' : ''"
      >
        <q-item-section avatar>
          <div
            :style="{
              width: '16px',
              height: '16px',
              background: cat.color,
              borderRadius: '2px',
            }"
          ></div>
        </q-item-section>
        <q-item-section>{{ cat.label }}</q-item-section>
        <q-item-section side>{{ cat.range }}</q-item-section>
      </q-item>
    </q-list>

    <div class="q-mt-lg q-pa-sm">
      <div class="row justify-between q-mb-xs">
        <span class="text-weight-bold">Normalgewicht</span>
        <span class="text-weight-bold">{{ normalRange }}</span>
      </div>
      <div class="row justify-between">
        <span class="text-weight-bold">Idealgewicht</span>
        <span class="text-weight-bold">{{ idealWeight }} kg</span>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useWeightStore } from "src/stores/weightStore";

const store = useWeightStore();
const height = ref(175);
const weight = ref(75);

onMounted(() => {
  if (store.profile) {
    height.value = store.profile.height;
  }
  if (store.latestEntry) {
    weight.value = store.latestEntry.weight;
  }
});

const bmi = computed(() => {
  if (!height.value || !weight.value) return "-";
  const h = height.value / 100;
  return (weight.value / (h * h)).toFixed(1).replace(".", ",");
});

const bmiNum = computed(() => {
  if (!height.value || !weight.value) return 0;
  const h = height.value / 100;
  return weight.value / (h * h);
});

const categories = [
  {
    label: "starkes Untergewicht",
    range: "< 16,0",
    min: 0,
    max: 16,
    color: "#5c35cc",
  },
  {
    label: "mäßiges Untergewicht",
    range: "16,0 - 16,9",
    min: 16,
    max: 17,
    color: "#7b68ee",
  },
  {
    label: "leichtes Untergewicht",
    range: "17,0 - 18,4",
    min: 17,
    max: 18.5,
    color: "#00bcd4",
  },
  {
    label: "Normalgewicht",
    range: "18,5 - 24,9",
    min: 18.5,
    max: 25,
    color: "#8bc34a",
  },
  {
    label: "Präadipositas",
    range: "25,0 - 29,9",
    min: 25,
    max: 30,
    color: "#ffeb3b",
  },
  {
    label: "Adipositas Grad I",
    range: "30,0 - 34,9",
    min: 30,
    max: 35,
    color: "#ffb74d",
  },
  {
    label: "Adipositas Grad II",
    range: "35,0 - 39,9",
    min: 35,
    max: 40,
    color: "#ef5350",
  },
  {
    label: "Adipositas Grad III",
    range: ">= 40",
    min: 40,
    max: Infinity,
    color: "#8d6e63",
  },
];

const currentCategory = computed(() => {
  const b = bmiNum.value;
  return categories.find((c) => b >= c.min && b < c.max)?.label ?? "";
});

const normalRange = computed(() => {
  if (!height.value) return "-";
  const h = height.value / 100;
  const min = (18.5 * h * h).toFixed(1);
  const max = (24.9 * h * h).toFixed(1);
  return `${min} - ${max} kg`;
});

const idealWeight = computed(() => {
  if (!height.value) return "-";
  const h = height.value / 100;
  return (22 * h * h).toFixed(1);
});
</script>
