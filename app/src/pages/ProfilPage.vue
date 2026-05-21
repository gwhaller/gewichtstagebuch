<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <div class="col-5 text-weight-medium">Geschlecht</div>
      <div class="col-7">
        <q-btn-toggle
          v-model="form.gender"
          :options="[
            { label: 'Mann', value: 'male' },
            { label: 'Frau', value: 'female' },
          ]"
          unelevated
          color="grey-3"
          text-color="black"
          toggle-color="grey-5"
          dense
        />
      </div>
    </div>

    <div class="row items-center q-mb-md">
      <div class="col-5 text-weight-medium">Alter</div>
      <div class="col-7">
        <q-input v-model.number="form.age" dense type="number" />
      </div>
    </div>

    <div class="row items-center q-mb-md">
      <div class="col-5 text-weight-medium">Größeneinheit</div>
      <div class="col-7">
        <q-btn
          unelevated
          color="grey-3"
          text-color="black"
          :label="form.heightUnit"
          dense
        />
      </div>
    </div>

    <div class="row items-center q-mb-md">
      <div class="col-5 text-weight-medium">Größe</div>
      <div class="col-5">
        <q-input v-model.number="form.height" dense type="number" />
      </div>
      <div class="col-2 q-pl-sm text-grey">cm</div>
    </div>

    <div class="row items-center q-mb-md">
      <div class="col-5 text-weight-medium">Gewichtseinheit</div>
      <div class="col-7">
        <q-btn
          unelevated
          color="grey-3"
          text-color="black"
          :label="form.weightUnit"
          dense
        />
      </div>
    </div>

    <div class="row items-center q-mb-md">
      <div class="col-5 text-weight-medium">Zielgewicht</div>
      <div class="col-5">
        <q-input
          v-model.number="form.targetWeight"
          dense
          type="number"
          step="0.1"
        />
      </div>
      <div class="col-2 q-pl-sm text-grey">kg</div>
    </div>

    <div class="row items-center q-mb-lg">
      <div class="col-5 text-weight-medium">Ich möchte</div>
      <div class="col-7">
        <q-btn-toggle
          v-model="form.goal"
          :options="[
            { label: 'abnehmen', value: 'lose' },
            { label: 'zunehmen', value: 'gain' },
          ]"
          unelevated
          color="grey-3"
          text-color="black"
          toggle-color="grey-5"
          dense
        />
      </div>
    </div>

    <q-btn color="primary" label="Speichern" @click="save" />
  </q-page>
</template>

<script setup>
import { reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWeightStore } from "src/stores/weightStore";

const store = useWeightStore();
const router = useRouter();
const form = reactive({
  gender: "male",
  age: 30,
  heightUnit: "cm",
  height: 175,
  weightUnit: "kg",
  targetWeight: 80,
  goal: "lose",
});

onMounted(() => {
  if (store.profile) Object.assign(form, store.profile);
});

async function save() {
  await store.saveProfile({ ...form });
  router.push("/uebersicht");
}
</script>
