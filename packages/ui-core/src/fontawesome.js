import { dom, library } from "@fortawesome/fontawesome-svg-core"
import { faFolder, faFolderOpen } from "@fortawesome/free-regular-svg-icons"
import {
	faArrowLeft,
	faArrowRight,
	faAsterisk,
	faCheck,
	faChevronDown,
	faChevronUp,
	faClone,
	faCloudDownload,
	faCog,
	faCropSimple,
	faDatabase,
	faDownload,
	faEllipsisV,
	faExclamationTriangle,
	faEye,
	faEyeSlash,
	faFolderTree,
	faInfoCircle,
	faLayerGroup,
	faLink,
	faList,
	faLongArrowAltRight,
	faMicrochip,
	faPen,
	faPlus,
	faPlusMinus,
	faRuler,
	faSave,
	faSearch,
	faShareAlt,
	faSlidersH,
	faSquareRootAlt,
	faSyncAlt,
	faTasks,
	faTimes,
	faTrash,
	faWandMagicSparkles,
	faWaveSquare
} from "@fortawesome/free-solid-svg-icons"

let registered = false

const icons = [
	faArrowLeft,
	faArrowRight,
	faAsterisk,
	faCheck,
	faChevronDown,
	faChevronUp,
	faClone,
	faCloudDownload,
	faCog,
	faCropSimple,
	faDatabase,
	faDownload,
	faEllipsisV,
	faExclamationTriangle,
	faEye,
	faEyeSlash,
	faFolder,
	faFolderOpen,
	faFolderTree,
	faInfoCircle,
	faLayerGroup,
	faLink,
	faList,
	faLongArrowAltRight,
	faMicrochip,
	faPen,
	faPlus,
	faPlusMinus,
	faRuler,
	faSave,
	faSearch,
	faShareAlt,
	faSlidersH,
	faSquareRootAlt,
	faSyncAlt,
	faTasks,
	faTimes,
	faTrash,
	faWandMagicSparkles,
	faWaveSquare
]

function registerHarkanaFontAwesomeIcons(){
	if( registered ){
		return
	}

	library.add( ...icons )
	dom.watch()
	registered = true
}

export {
	registerHarkanaFontAwesomeIcons
}
