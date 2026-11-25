import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {handleWordwall} from './shared/wordwall.mjs';
// Same handler as Netlify; no separate server or CLI needed during local development.
function localApi(){
  function mount(server){server.middlewares.use('/api/wordwall',async(req,res)=>{
    try{ const response=await handleWordwall(new Request(`http://localhost/api/wordwall${req.url||''}`,{method:req.method})); res.statusCode=response.status; response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(await response.text()); }
    catch{res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Endpoint lokal gagal.'}));}
  });}
  return {name:'teachflow-local-api',configureServer:mount,configurePreviewServer:mount};
}
export default defineConfig({plugins:[react(),localApi()],server:{host:'localhost',port:5173,strictPort:true},preview:{host:'localhost',port:4173,strictPort:true}});
