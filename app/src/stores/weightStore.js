import { defineStore } from "pinia";
import {
  getAllEntries,
  saveEntry,
  deleteEntry,
  getProfile,
  saveProfile,
  getSettings,
  saveSettings,
  startSync,
} from "src/services/db";

export const useWeightStore = defineStore("weight", {
  state: () => ({
    entries: [],
    profile: null,
    settings: null,
    loading: false,
    syncStatus: null,
    syncError: null,
  }),

  getters: {
    sortedEntries: (state) =>
      [...state.entries].sort((a, b) => b.date.localeCompare(a.date)),

    latestEntry: (state) =>
      state.entries.reduce(
        (latest, e) => (!latest || e.date > latest.date ? e : latest),
        null,
      ),

    bmi: (state) => {
      if (!state.profile) return null;
      const latest = state.entries.reduce(
        (latest, e) => (!latest || e.date > latest.date ? e : latest),
        null,
      );
      if (!latest) return null;
      const h = state.profile.height / 100;
      return +(latest.weight / (h * h)).toFixed(1);
    },

    startWeight: (state) =>
      state.entries.reduce(
        (earliest, e) => (!earliest || e.date < earliest.date ? e : earliest),
        null,
      ),

    weightChange: (state) => {
      const entries = state.entries;
      if (entries.length < 2) return null;
      const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
      return +(sorted[sorted.length - 1].weight - sorted[0].weight).toFixed(1);
    },
  },

  actions: {
    async loadAll() {
      this.loading = true;
      try {
        this.entries = await getAllEntries();
        this.profile = await getProfile();
        this.settings = await getSettings();
        if (this.settings.couchdbUrl) {
          this.syncStatus = "connecting";
          startSync(this.settings.couchdbUrl, (status, err) => {
            this.syncStatus = status;
            this.syncError = err;
            if (status === "paused") this.loadEntries();
          });
        }
      } finally {
        this.loading = false;
      }
    },

    async saveEntry(entry) {
      await saveEntry(entry);
      await this.loadEntries();
    },

    async deleteEntry(date) {
      await deleteEntry(date);
      await this.loadEntries();
    },

    async loadEntries() {
      this.entries = await getAllEntries();
    },

    async saveProfile(profile) {
      await saveProfile(profile);
      this.profile = { ...profile };
    },

    async saveSettings(settings) {
      await saveSettings(settings);
      this.settings = { ...settings };
      if (settings.couchdbUrl) {
        this.syncStatus = "connecting";
        startSync(settings.couchdbUrl, (status, err) => {
          this.syncStatus = status;
          this.syncError = err;
          if (status === "paused") this.loadEntries();
        });
      } else {
        this.syncStatus = null;
        this.syncError = null;
      }
    },
  },
});
