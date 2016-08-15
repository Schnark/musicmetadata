/*global MP3Metadata: true, util*/
/*global TextEncoder, TextDecoder*/
/*jshint bitwise: false*/
MP3Metadata =
(function () {
"use strict";

function encodeUint28 (uint28) {
	var array = [], i;
	for (i = 21; i >= 0; i -= 7) {
		array.push((uint28 >>> i) & 0x7F);
	}
	return array;
}

function readUint28 (array, offset) {
	return array[offset] << 21 | array[offset + 1] << 14 | array[offset + 2] << 7 | array[offset + 3];
}

function decodeString (array, code) {
	if (code === 1) {
		code = 'utf-16';
	} else if (code === 2) {
		code = 'utf-16be';
	} else {
		code = 'utf-8';
	}
	return (new TextDecoder(code)).decode(new Uint8Array(array)).replace(/\0+$/, '');
}

function encodeASCII (ascii) {
	var array = [], i;
	for (i = 0; i < ascii.length; i++) {
		array.push(ascii.charCodeAt(i) & 0x7F);
	}
	return array;
}

function encodeString (string) {
	var utf8 = (new TextEncoder('utf-8')).encode(string), array = new Uint8Array(utf8.length + 1);
	//actually + 2, the spec says we should add a 0x00, but nobody seems to do so
	array[0] = 3; //3 = UTF8
	array.set(utf8, 1);
	return array;
}

function encodeImage (image) {
	var mime = encodeASCII(util.getMime(image)), array = new Uint8Array(4 + mime.length + image.length);
	array.set(mime, 1);
	array[2 + mime.length] = 3; //type
	array.set(image, 4 + mime.length);
	return array;
}

function readImage (array) {
	var buffer, start = 1; //skip encoding
	while (array[start] !== 0) { //skip mime
		start++;
	}
	start += 2; //skip type
	while (array[start] !== 0) { //skip description, will break for UTF16
		start++;
	}
	start++;
	buffer = new ArrayBuffer(array.length - start);
	(new Uint8Array(buffer)).set(array.slice(start));
	return buffer;
}

function MP3Metadata (buffer, allowTrim) {
	var metadata = this.stripMetadata(buffer);
	this.metadata = {
		title: '',
		artist: '',
		album: '',
		track: '',
		disc: '',
		cover: false,
		other: []
	};
	if (metadata) {
		this.parseMetadata(new Uint8Array(metadata));
	}
	if (allowTrim && this.parseFrames) {
		this.metadata.length = this.parseFrames(this.music);
	}
}

MP3Metadata.prototype.stripMetadata = function (buffer) {
	var start = 0, end = buffer.byteLength, v,
		id3v1 = new Uint8Array(buffer, end - 128, 3),
		id3v2 = new Uint8Array(buffer, 0, 10);
	if (id3v1[0] === 0x54 && id3v1[1] === 0x41 && id3v1[2] === 0x47) {
		end -= 128;
	}
	if (id3v2[0] === 0x49 && id3v2[1] === 0x44 && id3v2[2] === 0x33) {
		v = id3v2[3];
		start = 10 + readUint28(id3v2, 6);
	}
	this.music = buffer.slice(start, end);
	return (v === 3 || v === 4) ? buffer.slice(0, start) : false;
};

MP3Metadata.prototype.parseMetadata = function (array) {
	var offset = 10, name, size, value, prop;
	if (array[5] & 0x80) { //skip extended header
		offset += readUint28(array, 10);
	}
	while (offset < array.length && array[offset] !== 0) {
		name = decodeString(array.slice(offset, offset + 4), 0);
		size = readUint28(array, offset + 4) + 10;
		prop = {
			TIT2: 'title',
			TPE1: 'artist',
			TALB: 'album',
			TRCK: 'track',
			TPOS: 'disc',
			APIC: 'cover'
		}[name];
		if (prop === 'cover' && this.metadata.cover) {
			prop = false;
		}
		if (prop) {
			if (prop === 'cover') {
				value = readImage(array.slice(offset + 10, offset + size));
			} else {
				value = decodeString(array.slice(offset + 11, offset + size), array[offset + 10]);
			}
			if (this.metadata[prop]) {
				this.metadata[prop] += ' / ' + value;
			} else {
				this.metadata[prop] = value;
			}
		} else {
			this.metadata.other.push(array.slice(offset, offset + size));
		}
		offset += size;
	}
};

MP3Metadata.prototype.makeTag = function (name, content) {
	var array = new Uint8Array(content.length + 10);
	array.set(encodeASCII(name));
	array.set(encodeUint28(content.length), 4);
	array.set(content, 10);
	return array;
};

MP3Metadata.prototype.makeTags = function () {
	var tags = this.metadata.other || [];
	if (this.metadata.cover) {
		tags.unshift(this.makeTag('APIC', encodeImage(new Uint8Array(this.metadata.cover))));
	}
	if (this.metadata.disc) {
		tags.unshift(this.makeTag('TPOS', encodeString(this.metadata.disc)));
	}
	if (this.metadata.track) {
		tags.unshift(this.makeTag('TRCK', encodeString(this.metadata.track)));
	}
	if (this.metadata.album) {
		tags.unshift(this.makeTag('TALB', encodeString(this.metadata.album)));
	}
	if (this.metadata.artist) {
		tags.unshift(this.makeTag('TPE1', encodeString(this.metadata.artist)));
	}
	if (this.metadata.title) {
		tags.unshift(this.makeTag('TIT2', encodeString(this.metadata.title)));
	}
	return tags;
};

MP3Metadata.prototype.getLength = function (tags) {
	var i, l = 0;
	for (i = 0; i < tags.length; i++) {
		l += tags[i].length;
	}
	return l;
};

MP3Metadata.prototype.getBuffer = function () {
	var tags = this.makeTags(),
		metadataLength = this.getLength(tags),
		musicLength = this.music.byteLength,
		buffer = new ArrayBuffer(10 + metadataLength + musicLength),
		writer = new Uint8Array(buffer),
		i, offset;

	writer.set([0x49, 0x44, 0x33, 0x04]);
	writer.set(encodeUint28(metadataLength), 6);
	offset = 10;
	for (i = 0; i < tags.length; i++) {
		writer.set(tags[i], offset);
		offset += tags[i].length;
	}
	writer.set(new Uint8Array(this.music), 10 + metadataLength);
	return buffer;
};

return MP3Metadata;

})();