import { Amplify } from "aws-amplify"
import awsconfig from "./aws-exports"
Amplify.configure( awsconfig )

import Application from "@harkana/ui-core/Application"

import { createApp } from "vue"
import { initMathJax } from "mathjax-vue3"
import VueMathjax from "vue-mathjax-next"
import router from "./router"

import { library } from "@fortawesome/fontawesome-svg-core"

import { fas } from "@fortawesome/free-solid-svg-icons"
import { fab } from "@fortawesome/free-brands-svg-icons"
import { far } from "@fortawesome/free-regular-svg-icons"
import { dom } from "@fortawesome/fontawesome-svg-core"

library.add( fas )
library.add( fab )
library.add( far )
dom.watch()

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

initMathJax({ url: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_SVG.js"})
app.use( VueMathjax )
app.mount("#app")
