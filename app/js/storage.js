"use strict";

const electronStore = require('electron-store');

function storageGet(keyName = '') {
	let store = new electronStore();
	return store.get(keyName);
}

function storageSet(keyName = '', keyVal = '') {
	let store = new electronStore();
	return store.set(keyName, keyVal);
}

function storageClear(keyName = '') {
	let store = new electronStore();
	return store.delete(keyName);
}

function storageGetWalletParameter(walletName, paramName) {
	let walletObj = storageGet(walletName);

	if (walletObj && walletObj.hasOwnProperty(paramName)) {
		return walletObj[paramName];
	}

	return false;
}

function storageSetWalletParameter(walletName, paramName, paramValue) {
	let walletObj = storageGet(walletName);

	if (walletObj) {
		let walletParam = {};
		walletParam[paramName] = paramValue;
		walletObj = Object.assign(walletObj, walletParam);
	} else {
		walletObj = {};
		walletObj[paramName] = paramValue;
	}
	storageSet(walletName, walletObj);
}
