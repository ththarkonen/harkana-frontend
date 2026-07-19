const PLOTLY_MATHJAX_SCRIPT_ID = "harkana-plotly-mathjax-v2"
const PLOTLY_MATHJAX_URL = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_SVG.js"
const PLOTLY_MATHJAX_LOAD_TIMEOUT_MS = 8000

let plotlyMathJaxLoadPromise = null

function plotlyMathJaxReady(){
    return typeof window !== "undefined" &&
        window.MathJax &&
        window.MathJax.Hub &&
        typeof window.MathJax.Hub.Queue === "function"
}

function configureMathJaxBeforeLoad(){
    if( typeof window === "undefined" ) return
    if( window.MathJax ) return

    window.MathJax = {
        messageStyle: "none",
        skipStartupTypeset: true,
        tex2jax: {
            inlineMath: [[ "$", "$" ], [ "\\(", "\\)" ]],
            displayMath: [[ "$$", "$$" ], [ "\\[", "\\]" ]],
            processEscapes: true,
            processEnvironments: true
        },
        SVG: {
            font: "TeX"
        }
    }
}

function waitForMathJaxStartup( resolve ){
    if( plotlyMathJaxReady() === false ){
        resolve( false )
        return
    }

    try{
        window.MathJax.Hub.Queue(() => resolve( true ))
    } catch( error ){
        resolve( true )
    }
}

function existingMathJaxScript(){
    if( typeof document === "undefined" ) return null
    return document.getElementById( PLOTLY_MATHJAX_SCRIPT_ID )
}

function createMathJaxScript(){
    const script = document.createElement( "script" )
    script.id = PLOTLY_MATHJAX_SCRIPT_ID
    script.src = PLOTLY_MATHJAX_URL
    script.async = true
    document.head.appendChild( script )
    return script
}

async function ensurePlotlyMathJax(){
    if( typeof window === "undefined" || typeof document === "undefined" ){
        return false
    }

    if( plotlyMathJaxReady() ){
        return true
    }

    if( plotlyMathJaxLoadPromise !== null ){
        return await plotlyMathJaxLoadPromise
    }

    configureMathJaxBeforeLoad()

    plotlyMathJaxLoadPromise = new Promise(( resolve ) => {
        const timeout = window.setTimeout(() => {
            resolve( plotlyMathJaxReady() )
        }, PLOTLY_MATHJAX_LOAD_TIMEOUT_MS )

        const finish = () => {
            window.clearTimeout( timeout )
            waitForMathJaxStartup( resolve )
        }

        const failOpen = () => {
            window.clearTimeout( timeout )
            resolve( false )
        }

        const script = existingMathJaxScript() ?? createMathJaxScript()
        script.addEventListener( "load", finish, { once: true })
        script.addEventListener( "error", failOpen, { once: true })
    })

    return await plotlyMathJaxLoadPromise
}

async function plotlyNewPlot( Plotly, ...args ){
    await ensurePlotlyMathJax()
    return await Plotly.newPlot( ...args )
}

async function plotlyReact( Plotly, ...args ){
    await ensurePlotlyMathJax()
    return await Plotly.react( ...args )
}

export {
    ensurePlotlyMathJax,
    plotlyNewPlot,
    plotlyReact
}
