/*global VorbisMetadata: true, util*/
/*global TextEncoder, TextDecoder*/
/*jshint bitwise: false*/
VorbisMetadata =
(function () {
"use strict";

function crc32 (array) {
	var crcTable = [
		0x00000000, 0x04C11DB7, 0x09823B6E, 0x0D4326D9,
		0x130476DC, 0x17C56B6B, 0x1A864DB2, 0x1E475005,
		0x2608EDB8, 0x22C9F00F, 0x2F8AD6D6, 0x2B4BCB61,
		0x350C9B64, 0x31CD86D3, 0x3C8EA00A, 0x384FBDBD,
		0x4C11DB70, 0x48D0C6C7, 0x4593E01E, 0x4152FDA9,
		0x5F15ADAC, 0x5BD4B01B, 0x569796C2, 0x52568B75,
		0x6A1936C8, 0x6ED82B7F, 0x639B0DA6, 0x675A1011,
		0x791D4014, 0x7DDC5DA3, 0x709F7B7A, 0x745E66CD,
		0x9823B6E0, 0x9CE2AB57, 0x91A18D8E, 0x95609039,
		0x8B27C03C, 0x8FE6DD8B, 0x82A5FB52, 0x8664E6E5,
		0xBE2B5B58, 0xBAEA46EF, 0xB7A96036, 0xB3687D81,
		0xAD2F2D84, 0xA9EE3033, 0xA4AD16EA, 0xA06C0B5D,
		0xD4326D90, 0xD0F37027, 0xDDB056FE, 0xD9714B49,
		0xC7361B4C, 0xC3F706FB, 0xCEB42022, 0xCA753D95,
		0xF23A8028, 0xF6FB9D9F, 0xFBB8BB46, 0xFF79A6F1,
		0xE13EF6F4, 0xE5FFEB43, 0xE8BCCD9A, 0xEC7DD02D,
		0x34867077, 0x30476DC0, 0x3D044B19, 0x39C556AE,
		0x278206AB, 0x23431B1C, 0x2E003DC5, 0x2AC12072,
		0x128E9DCF, 0x164F8078, 0x1B0CA6A1, 0x1FCDBB16,
		0x018AEB13, 0x054BF6A4, 0x0808D07D, 0x0CC9CDCA,
		0x7897AB07, 0x7C56B6B0, 0x71159069, 0x75D48DDE,
		0x6B93DDDB, 0x6F52C06C, 0x6211E6B5, 0x66D0FB02,
		0x5E9F46BF, 0x5A5E5B08, 0x571D7DD1, 0x53DC6066,
		0x4D9B3063, 0x495A2DD4, 0x44190B0D, 0x40D816BA,
		0xACA5C697, 0xA864DB20, 0xA527FDF9, 0xA1E6E04E,
		0xBFA1B04B, 0xBB60ADFC, 0xB6238B25, 0xB2E29692,
		0x8AAD2B2F, 0x8E6C3698, 0x832F1041, 0x87EE0DF6,
		0x99A95DF3, 0x9D684044, 0x902B669D, 0x94EA7B2A,
		0xE0B41DE7, 0xE4750050, 0xE9362689, 0xEDF73B3E,
		0xF3B06B3B, 0xF771768C, 0xFA325055, 0xFEF34DE2,
		0xC6BCF05F, 0xC27DEDE8, 0xCF3ECB31, 0xCBFFD686,
		0xD5B88683, 0xD1799B34, 0xDC3ABDED, 0xD8FBA05A,
		0x690CE0EE, 0x6DCDFD59, 0x608EDB80, 0x644FC637,
		0x7A089632, 0x7EC98B85, 0x738AAD5C, 0x774BB0EB,
		0x4F040D56, 0x4BC510E1, 0x46863638, 0x42472B8F,
		0x5C007B8A, 0x58C1663D, 0x558240E4, 0x51435D53,
		0x251D3B9E, 0x21DC2629, 0x2C9F00F0, 0x285E1D47,
		0x36194D42, 0x32D850F5, 0x3F9B762C, 0x3B5A6B9B,
		0x0315D626, 0x07D4CB91, 0x0A97ED48, 0x0E56F0FF,
		0x1011A0FA, 0x14D0BD4D, 0x19939B94, 0x1D528623,
		0xF12F560E, 0xF5EE4BB9, 0xF8AD6D60, 0xFC6C70D7,
		0xE22B20D2, 0xE6EA3D65, 0xEBA91BBC, 0xEF68060B,
		0xD727BBB6, 0xD3E6A601, 0xDEA580D8, 0xDA649D6F,
		0xC423CD6A, 0xC0E2D0DD, 0xCDA1F604, 0xC960EBB3,
		0xBD3E8D7E, 0xB9FF90C9, 0xB4BCB610, 0xB07DABA7,
		0xAE3AFBA2, 0xAAFBE615, 0xA7B8C0CC, 0xA379DD7B,
		0x9B3660C6, 0x9FF77D71, 0x92B45BA8, 0x9675461F,
		0x8832161A, 0x8CF30BAD, 0x81B02D74, 0x857130C3,
		0x5D8A9099, 0x594B8D2E, 0x5408ABF7, 0x50C9B640,
		0x4E8EE645, 0x4A4FFBF2, 0x470CDD2B, 0x43CDC09C,
		0x7B827D21, 0x7F436096, 0x7200464F, 0x76C15BF8,
		0x68860BFD, 0x6C47164A, 0x61043093, 0x65C52D24,
		0x119B4BE9, 0x155A565E, 0x18197087, 0x1CD86D30,
		0x029F3D35, 0x065E2082, 0x0B1D065B, 0x0FDC1BEC,
		0x3793A651, 0x3352BBE6, 0x3E119D3F, 0x3AD08088,
		0x2497D08D, 0x2056CD3A, 0x2D15EBE3, 0x29D4F654,
		0xC5A92679, 0xC1683BCE, 0xCC2B1D17, 0xC8EA00A0,
		0xD6AD50A5, 0xD26C4D12, 0xDF2F6BCB, 0xDBEE767C,
		0xE3A1CBC1, 0xE760D676, 0xEA23F0AF, 0xEEE2ED18,
		0xF0A5BD1D, 0xF464A0AA, 0xF9278673, 0xFDE69BC4,
		0x89B8FD09, 0x8D79E0BE, 0x803AC667, 0x84FBDBD0,
		0x9ABC8BD5, 0x9E7D9662, 0x933EB0BB, 0x97FFAD0C,
		0xAFB010B1, 0xAB710D06, 0xA6322BDF, 0xA2F33668,
		0xBCB4666D, 0xB8757BDA, 0xB5365D03, 0xB1F740B4
	], crc = 0, i;

	for (i = 0; i < array.length; i++) {
		crc = (crc << 8) ^ crcTable[(crc >> 24) & 0xFF ^ array[i]];
	}
	return crc;
}

function encodeUtf8 (string) {
	return (new TextEncoder('utf-8')).encode(string);
}

function encodeUint32 (uint32) {
	var array = [], i;
	for (i = 0; i < 32; i += 8) {
		array.push((uint32 >>> i) & 0xFF);
	}
	return array;
}

function readUint32 (array, offset) {
	return array[offset] | array[offset + 1] << 8 | array[offset + 2] << 16 | array[offset + 3] << 24;
}

function encodeCRC (array) {
	return encodeUint32(crc32(array));
}

function encodeImage (image) {
	var mime = encodeUtf8(util.getMime(image)), array = new Uint8Array(32 + mime.length + image.length);
	array[0] = 0x03; //type: Cover (front)
	array.set(encodeUint32(mime.length), 4);
	array.set(mime, 8);
	//unused, only dummy
	array[12 + mime.length] = 0xFF; //width
	array[16 + mime.length] = 0xFF; //height
	array[20 + mime.length] = 0x0F; //color depth
	array.set(encodeUint32(image.length), 28 + mime.length);
	array.set(image, 32 + mime.length);
	return btoa(String.fromCharCode.apply(String, array));
}

function readImage (string) {
	var binary = atob(string), array = new Uint8Array(binary.length), i, l;
	for (i = 0; i < binary.length; i++) {
		array[i] = binary.charCodeAt(i);
	}
	l = readUint32(array, 4);
	l += readUint32(array, 8 + l);
	return array.slice(32 + l, 32 + l + readUint32(array, 28 + l));
}

function VorbisMetadata (buffer) {
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
	this.parseMetadata(metadata);
}

VorbisMetadata.prototype.stripMetadata = function (buffer) {
	var page2start, page3start, metadataStart, page2count, data, i;
	page2start = (new Uint8Array(buffer, 27, 1))[0] + 28;
	page2count = (new Uint8Array(buffer, page2start + 26, 1))[0];
	data = new Uint8Array(buffer, page2start + 27, page2count);
	metadataStart = page2start + page2count + 27;
	page3start = metadataStart;
	for (i = 0; i < data.length; i++) {
		page3start += data[i];
	}
	this.page1 = buffer.slice(0, page2start);
	this.page2pre = buffer.slice(page2start, metadataStart);
	this.page3 = buffer.slice(page3start);
	return buffer.slice(metadataStart, page3start);
};

VorbisMetadata.prototype.parseMetadata = function (metadata) {
	var array = new Uint8Array(metadata), l, c, i, offset, data, string,
		name, value, other, decoder = new TextDecoder('utf-8');
	l = readUint32(array, 7);
	this.vendor = array.slice(11, 11 + l);
	offset = 11 + l;
	c = readUint32(array, offset);
	offset += 4;
	for (i = 0; i < c; i++) {
		l = readUint32(array, offset);
		offset += 4;
		data = array.slice(offset, offset + l);
		offset += l;
		string = decoder.decode(new Uint8Array(data));
		l = string.indexOf('=');
		if (l === -1) {
			continue;
		}
		name = string.slice(0, l).toLowerCase();
		value = string.slice(l + 1);
		switch (name) {
		case 'title':
		case 'artist':
		case 'album':
			if (this.metadata[name]) {
				this.metadata[name] += ' / ' + value;
			} else {
				this.metadata[name] = value;
			}
			break;
		case 'tracknumber':
			this.metadata.track = value + this.metadata.track.replace(/.*(\/|$)/, '$1');
			break;
		case 'tracktotal':
			this.metadata.track = this.metadata.track.replace(/\/.*/, '') + '/' + value;
			break;
		case 'discnumber':
			this.metadata.disc = value + this.metadata.disc.replace(/.*(\/|$)/, '$1');
			break;
		case 'disctotal':
			this.metadata.disc = this.metadata.disc.replace(/\/.*/, '') + '/' + value;
			break;
		case 'metadata_block_picture':
			if (!this.metadata.cover) {
				value = readImage(value);
				this.metadata.cover = new ArrayBuffer(value.length);
				(new Uint8Array(this.metadata.cover)).set(value);
				break;
			}
			/*falls through*/
		default:
			other = new Uint8Array(data.length + 4);
			other.set(encodeUint32(data.length));
			other.set(data, 4);
			this.metadata.other.push(other);
		}
	}
	offset++;
	l = offset;
	c = 0;
	data = new Uint8Array(this.page2pre);
	while (l > 0) {
		l -= data[27 + c];
		if (l < 0) {
			data[27 + c] = -l;
		} else {
			data[27 + c] = 0;
			c++;
		}
	}
	this.metadataCount = c;
	this.page2post = metadata.slice(offset);
};

VorbisMetadata.prototype.makeTag = function (name, content) {
	var array;
	content = encodeUtf8(name + '=' + content);
	array = new Uint8Array(content.length + 4);
	array.set(encodeUint32(content.length));
	array.set(content, 4);
	return array;
};

VorbisMetadata.prototype.makeTags = function () {
	var tags = this.metadata.other || [], v;
	if (this.metadata.cover) {
		tags.unshift(this.makeTag('metadata_block_picture', encodeImage(new Uint8Array(this.metadata.cover))));
	}
	if (this.metadata.disc) {
		v = this.metadata.disc.split('/');
		if (v[1]) {
			tags.unshift(this.makeTag('disctotal', v[1]));
		}
		tags.unshift(this.makeTag('discnumber', v[0]));
	}
	if (this.metadata.track) {
		v = this.metadata.track.split('/');
		if (v[1]) {
			tags.unshift(this.makeTag('tracktotal', v[1]));
		}
		tags.unshift(this.makeTag('tracknumber', v[0]));
	}
	if (this.metadata.album) {
		tags.unshift(this.makeTag('album', this.metadata.album));
	}
	if (this.metadata.artist) {
		tags.unshift(this.makeTag('artist', this.metadata.artist));
	}
	if (this.metadata.title) {
		tags.unshift(this.makeTag('title', this.metadata.title));
	}
	return tags;
};

VorbisMetadata.prototype.getLength = function (tags) {
	var l = 16 + this.vendor.length, i;
	for (i = 0; i < tags.length; i++) {
		l += tags[i].length;
	}
	return l;
};

VorbisMetadata.prototype.getBuffer = function () {
	var tags = this.makeTags(),
		page1Length = this.page1.byteLength,
		metadataLength = this.getLength(tags),
		count = Math.ceil(metadataLength / 255),
		shift = count - this.metadataCount,
		page2Length = this.page2pre.byteLength + metadataLength + this.page2post.byteLength + shift,
		page3Length = this.page3.byteLength,
		buffer = new ArrayBuffer(page1Length + page2Length + page3Length),
		writer = new Uint8Array(buffer),
		i, offset;
	writer.set(new Uint8Array(this.page1));
	writer.set(new Uint8Array(this.page2pre), page1Length);
	if (shift !== 0) {
		writer[page1Length + 26] += shift;
		writer.set(writer.slice(page1Length + 27 + this.metadataCount, page1Length + page2Length), page1Length + 27 + count);
	}
	offset = page1Length + 27;
	while (metadataLength > 0) {
		writer[offset] = metadataLength > 255 ? 255 : metadataLength;
		metadataLength -= 255;
		offset++;
	}

	offset = page1Length + this.page2pre.byteLength + shift;
	writer.set([0x03, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73], offset);
	offset += 7;
	writer.set(encodeUint32(this.vendor.length), offset);
	offset += 4;
	writer.set(this.vendor, offset);
	offset += this.vendor.length;
	writer.set(encodeUint32(tags.length), offset);
	offset += 4;
	for (i = 0; i < tags.length; i++) {
		writer.set(tags[i], offset);
		offset += tags[i].length;
	}
	writer.set([0x01], offset);
	offset++;
	writer.set(new Uint8Array(this.page2post), offset);
	writer.set(new Uint8Array(this.page3), page1Length + page2Length);

	//CRC
	writer.set([0, 0, 0, 0], page1Length + 22);
	writer.set(encodeCRC(new Uint8Array(buffer, page1Length, page2Length)), page1Length + 22);

	return buffer;
};

return VorbisMetadata;
})();