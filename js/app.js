/*global util, MP3Metadata, VorbisMetadata, _*/
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
		var id, trim = document.getElementById('check-allow-trim').checked;
		if (buffer) {
			id = new Uint8Array(buffer, 0, 4);
			if (id[0] === 0x4F && id[1] === 0x67 && id[2] === 0x67 && id[3] === 0x53) {
				currentType = 'ogg';
			} else {
				currentType = 'mp3';
			}
			currentFile = currentType === 'mp3' ? new MP3Metadata(buffer, trim) : new VorbisMetadata(buffer);
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
	if (metadata.start || metadata.end) {
		currentFile.trim(metadata.start, metadata.end);
	}
	showSave(util.urlFromBuffer(currentFile.getBuffer(), type), currentFile.name);
}

function onClickNextFile () {
	location.reload();
}

function showMetadata () {
	var other, count, start, end;
	document.getElementById('metadata-title').value = currentFile.metadata.title;
	document.getElementById('metadata-artist').value = currentFile.metadata.artist;
	document.getElementById('metadata-album').value = currentFile.metadata.album;
	document.getElementById('metadata-track').value = currentFile.metadata.track;
	document.getElementById('metadata-disc').value = currentFile.metadata.disc;
	other = document.getElementById('metadata-other');
	count = document.getElementById('metadata-other-count');
	other.checked = true;
	count.innerHTML = _('label-other', {n: currentFile.metadata.other.length});
	if (currentFile.metadata.other.length) {
		other.disabled = false;
		count.className = '';
	} else {
		other.disabled = true;
		count.className = 'disabled';
	}
	document.getElementById('metadata-other').checked = true;
	showCover(currentFile.metadata.cover);
	start = document.getElementById('metadata-start');
	end = document.getElementById('metadata-end');
	if (currentFile.metadata.length) {
		document.getElementById('trim-container').className = '';
		start.disabled = false;
		start.placeholder = '0:00';
		start.value = '';
		end.disabled = false;
		end.placeholder = util.formatTime(currentFile.metadata.length);
		end.value = '';
	} else {
		document.getElementById('trim-container').className = 'disabled';
		start.disabled = true;
		start.placeholder = '';
		start.value = '';
		end.disabled = true;
		end.placeholder = '';
		end.value = '';
	}
	document.getElementById('page-select').hidden = true;
	document.getElementById('page-edit').hidden = false;
}

function showCover (buffer) {
	var cover = document.getElementById('metadata-cover'), button = document.getElementById('button-remove-cover');
	cover.src = buffer ? util.urlFromBuffer(buffer) : '';
	cover.hidden = !buffer;
	button.disabled = !buffer;
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
		other: document.getElementById('metadata-other').checked,
		start: util.readTime(document.getElementById('metadata-start').value),
		end: util.readTime(document.getElementById('metadata-end').value)
	};
}

initEvents();

window.addEventListener('localized', function () {
	document.documentElement.lang = document.webL10n.getLanguage();
	document.documentElement.dir = document.webL10n.getDirection();
	document.getElementById('page-loading').hidden = true;
	document.getElementById('page-select').hidden = false;
}, false);

})();