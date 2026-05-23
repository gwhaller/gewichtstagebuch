import PouchDB from "pouchdb";

const db = new PouchDB("gewichtstagebuch");

export async function getAllEntries() {
  const result = await db.allDocs({ include_docs: true, descending: true });
  return result.rows.map((r) => r.doc).filter((d) => d.type === "entry");
}

export async function saveEntry(entry) {
  // _id = "entry_YYYY-MM-DD" für einfache Sortierung und Eindeutigkeit pro Tag
  const id = `entry_${entry.date}`;
  const existing = await db.get(id).catch(() => null);
  const doc = {
    _id: id,
    type: "entry",
    date: entry.date,
    weight: entry.weight,
    note: entry.note || "",
  };
  if (existing) doc._rev = existing._rev;
  return db.put(doc);
}

export async function deleteEntry(date) {
  const id = `entry_${date}`;
  const doc = await db.get(id);
  return db.remove(doc);
}

export async function getProfile() {
  return db.get("profile").catch(() => ({
    _id: "profile",
    type: "profile",
    gender: "male",
    age: 30,
    heightUnit: "cm",
    height: 175,
    weightUnit: "kg",
    targetWeight: 80,
    goal: "lose",
  }));
}

export async function saveProfile(profile) {
  const existing = await db.get("profile").catch(() => null);
  const doc = { ...profile, _id: "profile", type: "profile" };
  if (existing) doc._rev = existing._rev;
  return db.put(doc);
}

export async function getSettings() {
  return db.get("settings").catch(() => ({
    _id: "settings",
    type: "settings",
    reminderEnabled: false,
    reminderTime: "08:00",
    askOnStart: false,
    couchdbUrl: "",
  }));
}

export async function saveSettings(settings) {
  const existing = await db.get("settings").catch(() => null);
  const doc = { ...settings, _id: "settings", type: "settings" };
  if (existing) doc._rev = existing._rev;
  return db.put(doc);
}

export async function importFromCSV(csvText) {
  const lines = csvText.trim().split("\n").slice(1); // Header überspringen
  const entries = [];
  for (const line of lines) {
    const [date, weight] = line.split(",");
    if (date && weight) {
      entries.push({
        date: date.trim(),
        weight: parseFloat(weight.trim()),
        note: "",
      });
    }
  }
  for (const entry of entries) {
    await saveEntry(entry);
  }
  return entries.length;
}

export async function exportToCSV() {
  const entries = await getAllEntries();
  const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
  const lines = [
    "date,weight,note",
    ...sorted.map((e) => `${e.date},${e.weight},${e.note || ""}`),
  ];
  return lines.join("\n");
}

let syncHandler = null;

export function startSync(couchdbUrl, onStatus) {
  if (!couchdbUrl) return;
  if (syncHandler) syncHandler.cancel();
  if (onStatus) onStatus("connecting", null);

  // Timeout: wenn nach 12s kein Event → SSL-Zertifikat nicht vertrauenswürdig oder Server nicht erreichbar
  let timeoutId = setTimeout(() => {
    onStatus?.(
      "error",
      new Error(
        "Keine Antwort – Server nicht erreichbar oder SSL-Zertifikat nicht vertrauenswürdig",
      ),
    );
  }, 12000);

  const clearT = () => clearTimeout(timeoutId);

  syncHandler = db
    .sync(couchdbUrl, { live: true, retry: true })
    .on("active", () => {
      clearT();
      onStatus?.("active", null);
    })
    .on("paused", (err) => {
      clearT();
      if (err) onStatus?.("error", err);
      else onStatus?.("paused", null);
    })
    .on("error", (err) => {
      clearT();
      console.warn("CouchDB Sync-Fehler:", err);
      onStatus?.("error", err);
    });
  return syncHandler;
}

export function stopSync() {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
  }
}

export { db };
