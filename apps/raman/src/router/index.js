import { createWebHistory, createRouter} from "vue-router";

const MainMenu = () => import("@harkana/ui-core/MainMenu");
const ProjectViewer = () => import("@harkana/ui-core/ProjectViewer");
const Settings = () => import("@harkana/ui-core/Settings");
const DataFormats = () => import("@harkana/ui-core/DataFormats");

const routes = [
	{ path: "/", name: "Main menu", component: MainMenu },
	{ path: "/project/:id", name: "ProjectViewer", component: ProjectViewer },
	{ path: "/settings", name: "Settings", component: Settings},
	{ path: "/formats", name: "Data formats", component: DataFormats},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
