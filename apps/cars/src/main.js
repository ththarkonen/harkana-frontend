import { Amplify } from "aws-amplify"
import awsconfig from "./aws-exports"
import { configureAmplify } from "@harkana/tools/authConfig"
configureAmplify( Amplify, awsconfig )

import Application from "@harkana/ui-core/Application"
import { registerHarkanaFontAwesomeIcons } from "@harkana/ui-core/fontawesome"
import { preloadPlotlyMathJax } from "@harkana/ui-core/mathjax"

import { createApp } from "vue"
import router from "./router"

registerHarkanaFontAwesomeIcons()
preloadPlotlyMathJax()

import "vue-json-pretty/lib/styles.css"
import "katex/dist/katex.min.css"
import "@aws-amplify/ui-vue/styles.css"
import "@/assets/css/general.scss"

var app = createApp( Application )
app.use( router )

app.config.errorHandler = ( e, instance, info) => {
    console.error('Global Vue error:', e);
    console.error('Component:', instance);
    console.error('Info:', info);
};

app.mount("#app")
