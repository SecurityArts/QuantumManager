"use strict";

const Store = require('electron-store');

function storageGet(keyName = '') {
	const store = new Store();
	return store.get(keyName);
}

function storageSet(keyName = '', keyVal = '') {
	let store = new Store ();
	return store.set(keyName, keyVal);
}

function storageClear(keyName = '') {
	let store = new Store ();
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
