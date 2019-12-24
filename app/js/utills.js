"use strict";


function hexStringToArray(hex) {
	let arr = [];

	while (hex.length >= 2) {
		arr.push(parseInt(hex.substring(0, 2), 16));
		hex = hex.substring(2, hex.length);
	}

	return arr;
}

function arrayToHexString(arr) {
	let str = '';

	for (let i = 0; i < arr.length; i++) {
		str += ((arr[i] < 16) ? '0' : '') + arr[i].toString(16);
	}

	return str;
}

function strToJson(str) {
	try {
		return JSON.parse(str);
	} catch(e) {
		return {'status': 'error', 'data': str, 'code': 1000};
	}
}

function compareVersions(a, b) {
	a = a.replace(/(\.0+)+$/, '').split('.');
	b = b.replace(/(\.0+)+$/, '').split('.');
	let l = Math.min(a.length, b.length);

	for (let i = 0; i < l; i++) {
		let diff = parseInt(a[i], 10) - parseInt(b[i], 10);
		if (diff) return (diff > 0);
	}

	return ((a.length - b.length) > 0);
}

function openExternalUrl(url) {
	shell.openExternal(url, {activate: true});
}

function sleep(ms) {
    return new Promise(resolve => {setTimeout(resolve, ms)});
}

