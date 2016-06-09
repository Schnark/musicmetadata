/*global util, MP3Metadata, VorbisMetadata*/
(function () {
"use strict";
var currentFile, currentType;

function addListener (id, handler) {
	document.getElementById(id).addEventListener('click', handler, false);
}

function initEvents () {
	addListener('button-select-music', onClickSelectMusic);
	addListener('button-select-cover', onClickSelectCover);
	addListener('metadata-cover', onClickSelectCover);
	addListener('button-remove-cover', onClickRemoveCover);
	addListener('button-generate-file', onClickGenerateFile);
	addListener('button-next-file', onClickNextFile);
}

function onClickSelectMusic () {
	util.getFile(['audio/mpeg', 'audio/ogg', 'audio/vorbis'], function (buffer, name) {
		var id;
		if (buffer) {
			id = new Uint8Array(buffer, 0, 4);
			if (id[0] === 0x4F && id[1] === 0x67 && id[2] === 0x67 && id[3] === 0x53) {
				currentType = 'ogg';
			} else {
				currentType = 'mp3';
			}
			currentFile = currentType === 'mp3' ? new MP3Metadata(buffer) : new VorbisMetadata(buffer);
			currentFile.name = name || 'audio.' + currentType;
			showMetadata();
		}
	});
}

function onClickSelectCover () {
	util.getFile(['image/png', 'image/jpeg'], function (buffer) {
		if (buffer) {
			currentFile.metadata.cover = buffer;
			showCover(buffer);
		}
	});
}

function onClickRemoveCover () {
	currentFile.metadata.cover = false;
	showCover();
}

function onClickGenerateFile () {
	var metadata = readMetadata(), type = (currentType === 'mp3') ? 'audio/mpeg' : 'audio/ogg; codecs=vorbis';
	metadata.cover = currentFile.metadata.cover;
	metadata.other = metadata.other && currentFile.metadata.other;
	currentFile.metadata = metadata;
	showSave(util.urlFromBuffer(currentFile.getBuffer(), type), currentFile.name);
}

function onClickNextFile () {
	location.reload();
}

function showMetadata () {
	document.getElementById('metadata-title').value = currentFile.metadata.title;
	document.getElementById('metadata-artist').value = currentFile.metadata.artist;
	document.getElementById('metadata-album').value = currentFile.metadata.album;
	document.getElementById('metadata-track').value = currentFile.metadata.track;
	document.getElementById('metadata-disc').value = currentFile.metadata.disc;
	document.getElementById('metadata-other-count').innerHTML = currentFile.metadata.other.length;
	showCover(currentFile.metadata.cover);
	document.getElementById('page-select').hidden = true;
	document.getElementById('page-edit').hidden = false;
}

function showCover (buffer) {
	var cover = document.getElementById('metadata-cover');
	cover.src = buffer ? util.urlFromBuffer(buffer) : '';
	cover.hidden = !buffer;
}

function showSave (url, name) {
	var a = document.getElementById('button-download');
	a.href = url;
	a.download = name.replace(/.*\//, '');
	document.getElementById('page-edit').hidden = true;
	document.getElementById('page-download').hidden = false;
}

function readMetadata () {
	return {
		title: document.getElementById('metadata-title').value,
		artist: document.getElementById('metadata-artist').value,
		album: document.getElementById('metadata-album').value,
		track: document.getElementById('metadata-track').value,
		disc: document.getElementById('metadata-disc').value,
		other: document.getElementById('metadata-other').checked
	};
}

initEvents();

})();