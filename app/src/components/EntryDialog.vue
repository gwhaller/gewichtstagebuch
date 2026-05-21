<template>
  <q-dialog v-model="show" @hide="reset">
    <q-card style="min-width: 300px">
      <q-card-section class="text-h6 text-center">
        {{ editDate ? "Bearbeiten" : "Neu" }}
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Datum</div>
          <q-input v-model="form.date" dense outlined type="date" />
        </div>
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Gewicht</div>
          <q-input
            v-model.number="form.weight"
            dense
            outlined
            type="number"
            step="0.1"
            suffix="kg"
          />
        </div>
        <div>
          <div class="text-subtitle2 q-mb-xs">Notiz</div>
          <q-input v-model="form.note" dense outlined />
        </div>
      </q-card-section>

      <q-card-actions align="between">
        <q-btn flat label="ABBRECHEN" @click="show = false" />
        <q-btn
          flat
          label="OK"
          color="primary"
          @click="save"
          :disable="!form.weight"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useWeightStore } from "src/stores/weightStore";
import { useQuasar } from "quasar";

const props = defineProps({
  modelValue: Boolean,
  editDate: { type: String, default: null },
  editWeight: { type: Number, default: null },
  editNote: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);
const store = useWeightStore();
const $q = useQuasar();

// Lokales v-model das mit dem Parent synchronisiert
const show = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const today = new Date().toISOString().slice(0, 10);
const form = ref({ date: today, weight: null, note: "" });

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      form.value = {
        date: props.editDate || today,
        weight: props.editWeight || null,
        note: props.editNote || "",
      };
    }
  },
);

function reset() {
  form.value = { date: today, weight: null, note: "" };
}

async function save() {
  if (!form.value.weight) return;
  try {
    await store.saveEntry({
      date: form.value.date,
      weight: form.value.weight,
      note: form.value.note,
    });
    show.value = false;
    $q.notify({
      message: "Eintrag gespeichert",
      position: "bottom",
      timeout: 2000,
      color: "grey-9",
      icon: "scale",
      classes: "q-mx-auto text-body2",
      style: "border-radius: 24px; min-width: 220px; max-width: 80vw",
    });
  } catch {
    $q.notify({
      message: "Fehler beim Speichern",
      color: "negative",
      icon: "error",
    });
  }
}
</script>
