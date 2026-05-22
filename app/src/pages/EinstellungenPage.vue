<template>
  <q-page class="q-pa-none">
    <div class="row justify-end q-px-md q-pt-md q-pb-sm">
      <img :src="appIcon" width="52" height="52" style="border-radius: 13px" />
    </div>
    <q-list separator>
      <!-- Erinnerung -->
      <q-item>
        <q-item-section avatar
          ><q-icon name="notifications" color="grey-7"
        /></q-item-section>
        <q-item-section>Erinnere mich täglich ans Wiegen</q-item-section>
        <q-item-section side>
          <q-toggle v-model="form.reminderEnabled" color="green" />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section avatar
          ><q-icon name="alarm" color="grey-7"
        /></q-item-section>
        <q-item-section>Erinnerungszeit</q-item-section>
        <q-item-section side>
          <q-input
            v-model="form.reminderTime"
            type="time"
            dense
            style="width: 90px"
          />
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section avatar
          ><q-icon name="login" color="grey-7"
        /></q-item-section>
        <q-item-section>Beim Start nach Gewicht fragen</q-item-section>
        <q-item-section side>
          <q-toggle v-model="form.askOnStart" color="green" />
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- CouchDB Sync -->
      <q-item>
        <q-item-section avatar
          ><q-icon name="sync" color="grey-7"
        /></q-item-section>
        <q-item-section>
          <q-item-label>CouchDB-Sync URL</q-item-label>
          <q-item-label caption
            >z.B. http://user:pass@server:5984/gewicht</q-item-label
          >
          <q-input
            v-model="form.couchdbUrl"
            dense
            placeholder="http://..."
            class="q-mt-xs"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Backup -->
      <q-item clickable v-ripple @click="showBackup = true">
        <q-item-section avatar
          ><q-icon name="import_export" color="grey-7"
        /></q-item-section>
        <q-item-section>
          <q-item-label>Backup</q-item-label>
          <q-item-label caption
            >Datensicherung in Datei erstellen oder
            wiederherstellen</q-item-label
          >
        </q-item-section>
      </q-item>
    </q-list>

    <div class="q-pa-md">
      <q-btn
        color="primary"
        label="Einstellungen speichern"
        @click="save"
        class="full-width"
      />
    </div>

    <!-- Backup Dialog -->
    <q-dialog v-model="showBackup">
      <q-card style="min-width: 300px">
        <q-card-section class="text-h6">Backup</q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-btn
            color="primary"
            icon="download"
            label="CSV exportieren"
            @click="exportCsv"
            class="full-width"
          />
          <div class="text-subtitle2 q-mt-md">CSV importieren:</div>
          <input
            type="file"
            accept=".csv"
            @change="importCsv"
            ref="fileInput"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Schließen" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useWeightStore } from "src/stores/weightStore";
import appIcon from 'src/assets/app-icon.png';
import { exportToCSV, importFromCSV } from "src/services/db";
import { useQuasar } from "quasar";

const store = useWeightStore();
const $q = useQuasar();
const showBackup = ref(false);
const fileInput = ref(null);

const form = reactive({
  reminderEnabled: false,
  reminderTime: "08:00",
  askOnStart: false,
  couchdbUrl: "",
});

onMounted(() => {
  if (store.settings) Object.assign(form, store.settings);
});

async function save() {
  await store.saveSettings({ ...form }, (err) => {
    $q.notify({
      message: `CouchDB-Sync fehlgeschlagen: ${err?.message || err}`,
      color: "negative",
      icon: "sync_problem",
      timeout: 5000,
    });
  });
  $q.notify({
    message: "Einstellungen gespeichert",
    color: "positive",
    icon: "check",
  });
}

async function exportCsv() {
  const csv = await exportToCSV();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gewichtstagebuch_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importCsv(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const count = await importFromCSV(text);
  await store.loadEntries();
  showBackup.value = false;
  $q.notify({
    message: `${count} Einträge importiert`,
    color: "positive",
    icon: "check",
  });
}
</script>
