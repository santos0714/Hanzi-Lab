/* Hanzi Lab — service worker: guarda todos los archivos para usar la aplicación sin internet. */
'use strict';
const VERSION = 'hanzi-lab-v2';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/estilos.css',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/nucleo.js', 'js/archivo.js', 'js/app.js', 'js/lib/hanzi-writer.min.js',
  'js/datos/contenido.js', 'js/datos/vocabulario.js', 'js/datos/oraciones.js', 'js/datos/diccionario.js', 'js/datos/trazos.js',
  'js/vistas/inicio.js', 'js/vistas/leer.js', 'js/vistas/tarjetas.js', 'js/vistas/practicar.js',
  'js/vistas/escribir.js', 'js/vistas/diccionario.js', 'js/vistas/progreso.js', 'js/vistas/ajustes.js'
];
self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  const r = ev.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin === location.origin) {
    ev.respondWith(caches.match(r, { ignoreSearch: true }).then(c => c || fetch(r).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(VERSION).then(ca => ca.put(r, copia)); }
      return resp;
    })).catch(() => caches.match('index.html')));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    // Trazos de caracteres poco comunes: se guardan al descargarlos para que después funcionen sin internet.
    ev.respondWith(caches.match(r).then(c => c || fetch(r).then(resp => {
      if (resp.ok) { const copia = resp.clone(); caches.open(VERSION).then(ca => ca.put(r, copia)); }
      return resp;
    })));
  }
});
