const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", redirect: "/uebersicht" },
      {
        path: "uebersicht",
        component: () => import("pages/UebersichtPage.vue"),
      },
      { path: "liste", component: () => import("pages/ListePage.vue") },
      {
        path: "bmi-rechner",
        component: () => import("pages/BmiRechnerPage.vue"),
      },
      { path: "profil", component: () => import("pages/ProfilPage.vue") },
      {
        path: "einstellungen",
        component: () => import("pages/EinstellungenPage.vue"),
      },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
