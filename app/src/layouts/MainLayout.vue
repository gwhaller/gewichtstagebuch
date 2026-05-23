<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated style="background: #1976d2">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="toggleLeftDrawer" />
        <q-toolbar-title>{{ pageTitle }}</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item class="bg-primary text-white" style="min-height: 80px">
          <q-item-section avatar>
            <img
              :src="appIcon"
              width="48"
              height="48"
              style="border-radius: 12px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h6">BMI &amp;</q-item-label>
            <q-item-label>Gewichtstagebuch</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/uebersicht"
          active-class="text-primary"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar><q-icon name="bar_chart" /></q-item-section>
          <q-item-section>Gewichtstagebuch</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/bmi-rechner"
          active-class="text-primary"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar
            ><q-icon name="accessibility_new"
          /></q-item-section>
          <q-item-section>BMI-Rechner</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          v-ripple
          to="/profil"
          active-class="text-primary"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>Profil</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/einstellungen"
          active-class="text-primary"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar><q-icon name="settings" /></q-item-section>
          <q-item-section>Einstellungen</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-page-sticky
      v-if="route.path === '/uebersicht'"
      position="bottom-right"
      :offset="[18, 18]"
    >
      <q-btn fab icon="add" color="green" @click="entryDialog = true" />
    </q-page-sticky>

    <EntryDialog v-model="entryDialog" />

    <q-banner
      v-if="updateAvailable"
      dense
      class="bg-blue text-white"
      style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999"
    >
      <template #avatar>
        <q-icon name="system_update" />
      </template>
      Neue Version verfügbar
      <template #action>
        <q-btn flat dense label="Aktualisieren" @click="reloadApp" />
        <q-btn flat dense label="Später" @click="updateAvailable = false" />
      </template>
    </q-banner>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useWeightStore } from "src/stores/weightStore";
import EntryDialog from "src/components/EntryDialog.vue";
import appIcon from "src/assets/app-icon.png";

const store = useWeightStore();
const route = useRoute();
const leftDrawerOpen = ref(false);
const entryDialog = ref(false);
const updateAvailable = ref(false);

function reloadApp() {
  window.location.reload();
}

const pageTitles = {
  "/uebersicht": "Gewichtstagebuch",
  "/bmi-rechner": "BMI-Rechner",
  "/profil": "Profil",
  "/einstellungen": "Einstellungen",
};
const pageTitle = computed(() => pageTitles[route.path] ?? "Gewichtstagebuch");

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

onMounted(() => {
  store.loadAll();
  const onVisible = () => {
    if (document.visibilityState === "visible") store.loadEntries();
  };
  document.addEventListener("visibilitychange", onVisible);
  onUnmounted(() =>
    document.removeEventListener("visibilitychange", onVisible),
  );

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      updateAvailable.value = true;
    });
  }
});
</script>
