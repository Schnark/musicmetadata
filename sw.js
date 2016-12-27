/*global caches, fetch, Promise */
(function (worker) {
"use strict";

var VERSION = 'v2.2',
	FILES = [
		'js/app.js',
		'js/id3.js',
		'js/l10n.js',
		'js/mp3-trim.js',
		'js/util.js',
		'js/vorbis.js',
		'l10n/de.properties',
		'l10n/en.properties',
		'l10n/locales.ini',
		'icon-512.png',
		'index.html',
		'style.css'
	];

worker.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open(VERSION).then(function (cache) {
			return cache.addAll(FILES);
		})
	);
});

worker.addEventListener('activate', function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.map(function (key) {
				if (key !== VERSION) {
					return caches.delete(key);
				}
			}));
		})
	);
});

worker.addEventListener('fetch', function (e) {
	e.respondWith(caches.match(e.request, {ignoreSearch: true})
		.then(function (response) {
			return response || fetch(e.request);
		})
	);
});

})(this);