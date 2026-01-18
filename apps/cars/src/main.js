import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { initMathJax } from 'mathjax-vue3';
import VueMathjax from 'vue-mathjax-next';

import { library } from '@fortawesome/fontawesome-svg-core'

import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { dom } from "@fortawesome/fontawesome-svg-core";

library.add( fas );
library.add( fab );
library.add( far );
dom.watch();

import 'vue-json-pretty/lib/styles.css'
import 'katex/dist/katex.min.css'

import '@/assets/css/general.scss'

var app = createApp( App )

app.use( router )

initMathJax({ url: "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-AMS-MML_SVG.js"})
app.use( VueMathjax )

app.mount('#app')
