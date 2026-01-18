import router from '@/router/index.js'
import { Amplify } from 'aws-amplify'


function redirect( event, section = "Profile") {
	if (event instanceof PointerEvent) return

    console.log( event )

	if (event === "Sign out") {
		const auth = Amplify.Auth
		auth.signOut({ global: true })
	} else if (event == "Settings" || event == "Data formats") {

        var parameters = {};
        parameters.name = event;
        parameters.query = { section: section}

		const route = router.resolve( parameters )
		window.open( route.href, '_blank', 'noopener,noreferrer');

	} else if (event == "Main menu"){

        var parameters = {};
        parameters.name = event;

		const route = router.push( parameters )
    } else {

        var parameters = {};
        parameters.name = event;

		const route = router.resolve( parameters )
		window.open( route.href, '_blank')
    }
}

async function showProject( project, event) {

    const leftMouseClick = event.button == 0;
    const middleMouseClick = event.button == 1;

    if( leftMouseClick ){

        var routerSpec = {};
        routerSpec.params = {};
        
        routerSpec.name = "ProjectViewer";
        routerSpec.params.id = project.id;

        router.push( routerSpec )
    };

    if( middleMouseClick ){

        var routerSpec = {};
        routerSpec.params = {};
        
        routerSpec.name = "ProjectViewer";
        routerSpec.params.id = project.id;

        const routeUrl = router.resolve(routerSpec).href;
        window.open( routeUrl, "_blank", 'noopener,noreferrer');
    };
}

function route( name, project) {

    var routerSpec = {};
    routerSpec.params = {};
    
    routerSpec.name = name;
    routerSpec.params.id = project.id;

    router.push( routerSpec )
}

export default { redirect, route, showProject}