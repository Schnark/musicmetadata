/*global util: true*/
/*global TextEncoder, TextDecoder, URL, Blob, MozActivity*/
/*jshint bitwise: false*/
util =
(function () {
"use strict";

Uint8Array.prototype.slice = Uint8Array.prototype.slice || Array.prototype.slice;
if (!window.TextEncoder) { //very broken
	window.TextEncoder = function () {};
	TextEncoder.prototype.encode = function (string) {
		var i, c, array = [];
		for (i = 0; i < string.length; i++) {
			c = string.charCodeAt(i);
			if (c < 0x80) {
				array.push(c);
			} else if (c < 0x800) {
				array.push((c >> 6) | 0xC0, (c & 0x3F) | 0x80);
			} else if (c < 0x10000) {
				array.push((c >> 12) | 0xE0, ((c >> 6) & 0x3F) | 0x80, ((c >> 12) & 0x3F) | 0x80);
			} else {
				array.push((c >> 18) | 0xF0, ((c >> 12) & 0x3F) | 0x80, ((c >> 6) & 0x3F) | 0x80, ((c >> 12) & 0x3F) | 0x80);
			}
		}
		return array;
	};
	window.TextDecoder = function () {};
	TextDecoder.prototype.decode = function (array) {
		return String.fromCharCode.apply(String, array);
	};
}

function getMime (array) {
	if (array[0] === 0xFF && array[1] === 0xD8 && array[2] === 0xFF) {
		return 'image/jpeg';
	}
	if (array[0] === 0x89 && array[1] === 0x50 && array[2] === 0x4e && array[3] === 0x47) {
		return 'image/png';
	}
	return 'application/octet-stream';
}

function urlFromBuffer (buffer, mime) {
	return URL.createObjectURL(new Blob([buffer], {type: mime || getMime(new Uint8Array(buffer))}));
}

function getFile (types, callback) {
	var pick;
	if (window.MozActivity) {
		pick = new MozActivity({
			name: 'pick',
			data: {
				type: types
			}
		});

		pick.onsuccess = function () {
			try {
				callback(this.result.blob);
			} catch (e) {
				callback();
			}
		};

		pick.onerror = function () {
			callback();
		};
	} else {
		pick = document.createElement('input');
		pick.type = 'file';
		pick.style.display = 'none';
		document.getElementsByTagName('body')[0].appendChild(pick);
		pick.addEventListener('change', function () {
			var file = pick.files[0];
			if (file) {
				callback(file);
			} else {
				callback();
			}
			document.getElementsByTagName('body')[0].removeChild(pick);
		}, false);
		pick.click();
	}
}

function readFile (file, callback) {
	var reader = new FileReader();
	reader.onload = function (e) {
		callback(e.target.result, file.name);
	};
	reader.readAsArrayBuffer(file);
}

function getFileAsArrayBuffer (types, callback) {
	getFile(types, function (file) {
		readFile(file, callback);
	});
}

return {
	getMime: getMime,
	urlFromBuffer: urlFromBuffer,
	getFile: getFileAsArrayBuffer
};

})();