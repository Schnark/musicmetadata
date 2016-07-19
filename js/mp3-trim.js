/*global MP3Metadata*/
(function (parser) {
/*jshint bitwise: false*/
"use strict";

function readHeader (b1, b2, b3) {
	var invalid = {byteLength: 1, timeLength: 0},
		version, layer, padding,
		bitrateIndex, bitrate, sampleIndex, sampleRate;
	if (b1 !== 255) {
		return invalid;
	}
	if (b2 >> 5 !== 7) {
		return invalid;
	}
	version = (b2 >> 3) & 3; //0: 2.5, 2: 2, 3: 1
	if (version === 1) {
		return invalid;
	}
	layer = (b2 >> 1) & 3; //1: 3, 2: 2, 3: 1
	if (layer === 0) {
		return invalid;
	}
	bitrateIndex = (b3 >> 4) & 15;
	bitrate = getBitrate(version, layer, bitrateIndex);
	if (!bitrate) {
		return invalid;
	}
	sampleIndex = (b3 >> 2) & 3;
	sampleRate = getSampleRate(version, sampleIndex);
	if (!sampleRate) {
		return invalid;
	}
	padding = b3 >> 1 & 1;
	return {
		byteLength: getByteLength(layer, bitrate, sampleRate, padding),
		timeLength: getTimeLength(version, layer, sampleRate)
	};
}

function getBitrate (v, l, b) {
	if (b === 0 || b === 15) {
		return 0;
	}
	if (v === 3 && l === 3) {
		return b * 32;
	}
	if (v === 3 && l === 2) {
		return [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384][b];
	}
	if (v === 3 && l === 1) {
		return [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][b];
	}
	if (l === 3) {
		return [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256][b];
	}
	return [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160][b];
}

function getSampleRate (v, s) {
	if (s === 3) {
		return 0;
	}
	s = [11025, 12000, 8000][s];
	if (v === 2) {
		s *= 2;
	} else if (v === 3) {
		s *= 4;
	}
	return s;
}

function getByteLength (l, b, s, p) {
	if (l === 3) {
		return Math.floor(12000 * b / s + p) * 4;
	}
	return Math.floor(144000 * b / s + p);
}

function getTimeLength (v, l, s) {
	if (l === 3) {
		return (384 / s) * 1000;
	}
	if (l === 2) {
		return (1152 / s) * 1000;
	}
	if (v === 3) {
		return (1152 / s) * 1000;
	}
	return (576 / s) * 1000;
}

function createIndex (data) {
	var pos = 0, time = 0, index = [], head;
	while (pos + 3 < data.byteLength) {
		head = new Uint8Array(data, pos, 3);
		head = readHeader(head[0], head[1], head[2]);
		index.push({byteStart: pos, byteEnd: pos + head.byteLength, timeStart: time, timeEnd: time + head.timeLength});
		pos += head.byteLength;
		time += head.timeLength;
	}
	return index;
}

function cut (data, index, start, end) {
	var i = 0;
	if (!start) {
		start = 0;
	} else {
		while (i < index.length && index[i].timeEnd < start) {
			i++;
		}
		if (i === index.length) {
			i--;
		}
		start = index[i].byteStart;
	}
	if (!end) {
		end = index[index.length - 1].byteEnd;
	} else {
		while (i < index.length && index[i].timeStart < end) {
			i++;
		}
		if (i === index.length) {
			i--;
		}
		end = index[i].byteEnd;
	}
	return data.slice(start, end);
}

parser.parseFrames = function (data) {
	this.index = createIndex(data);
	return this.index[this.index.length - 1].timeEnd;
};

parser.trim = function (start, end) {
	this.music = cut(this.music, this.index, start, end);
};

})(MP3Metadata.prototype);