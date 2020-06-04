'use strict';

const bsv = require('bsv');
const bitcoin = require('bitcoinjs-lib');
const bitcore = require('bitcore-lib-cash');
const coinSelect = require('coinselect');

const bitcoinApiAddrPushTx =		'https://wallet.security-arts.com/api/pushtx/';
const bitcoinApiAddrUnspent =		'https://wallet.security-arts.com/api/unspent/';


const coinPrmBtc = 			{name: 'Bitcoin',				ticker: 'BTC',	fee: 10,	feeType: 'Fee', feeName: 'sat/Byte',		img: 'btc.png',		fractions: 100000000,	explorer: 'https://blockchain.com/btc/address/'};
const coinPrmBtcTestNet = 	{name: 'Bitcoin Testnet',		ticker: 'BTC',	fee: 10,	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'btc.png',		fractions: 100000000,	explorer: 'https://blockchain.com/btctest/address/'};

const coinPrmBch = 			{name: 'Bitcoin Cash',			ticker: 'BCH',	fee: 10,	feeType: 'Fee', feeName: 'sat/Byte',		img: 'bch.png',		fractions: 100000000,	explorer: 'https://blockchain.com/bch/address/'};
const coinPrmBchTestNet = 	{name: 'Bitcoin Cash Testnet',	ticker: 'BCH',	fee: 10,	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'bch.png',		fractions: 100000000,	explorer: 'https://blockchain.com/bchtest/address/'};

const coinPrmBsv = 			{name: 'Bitcoin SV',			ticker: 'BSV',	fee: 10,	feeType: 'Fee', feeName: 'sat/Byte',		img: 'bsv.png',		fractions: 100000000,	explorer: 'https://whatsonchain.com/address/'};
const coinPrmBsvTestNet = 	{name: 'Bitcoin SV Testnet',	ticker: 'BSV',	fee: 10,	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'bsv.png',		fractions: 100000000,	explorer: 'https://test.whatsonchain.com/address/'};

const coinPrmLtc = 			{name: 'LiteCoin',				ticker: 'LTC',	fee: 10,	feeType: 'Fee',	feeName: 'Litoshi/Byte',	img: 'ltc.png',		fractions: 100000000,	explorer: 'https://insight.litecore.io/address/'};
const coinPrmLtcTestNet = 	{name: 'LiteCoin Testnet',		ticker: 'LTC',	fee: 10,	feeType: 'Fee',	feeName: 'Litoshi/Byte',	img: 'ltc.png',		fractions: 100000000,	explorer: 'https://testnet.litecore.io/address/'};

const coinPrmDash =			{name: 'Dash',					ticker: 'DASH',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'dash.png',	fractions: 100000000,	explorer: 'https://insight.dashevo.org/insight/address/'};
const coinPrmDashTestNet = 	{name: 'Dash Testnet',			ticker: 'DASH',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'dash.png',	fractions: 100000000,	explorer: 'https://testnet-insight.dashevo.org/insight/address/'};

const coinPrmDoge =  		{name: 'DogeCoin',				ticker: 'DOGE',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'doge.png',	fractions: 100000000,	explorer: 'https://dogechain.info/address/'};
const coinPrmDogeTestNet = 	{name: 'DogeCoin Testnet',		ticker: 'DOGE',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'doge.png',	fractions: 100000000,	explorer: 'https://chain.so/address/DOGETEST/'};

const coinPrmXsn =			{name: 'XSN Stakenet',			ticker: 'XSN',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'xsn.png',		fractions: 100000000,	explorer: 'https://xsnexplorer.io/addresses/'};
const coinPrmXsnTestNet =	{name: 'XSN Testnet',			ticker: 'XSN',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'xsn.png',		fractions: 100000000,	explorer: 'https://xsnexplorer.io/addresses/'};

const coinUnknown =			{name: 'Unknown',				ticker: '',		fee: 0, 	feeType: 'Fee',	feeName: '',				img: 'none.png',	fractions: 100000000,	explorer: 'https://google.com/search?q='};


const walletGetBtcNetType = (coin, testnet) => {
	switch (coin) {
		case 'BTC':		if (testnet) return bitcoinNetworks.testnet; 			else return bitcoinNetworks.bitcoin; break;
		case 'XSN':		if (testnet) return bitcoinNetworks.xsn_testnet; 		else return bitcoinNetworks.xsn; break;
		case 'LTC':		if (testnet) return bitcoinNetworks.litecoin_testnet; 	else return bitcoinNetworks.litecoin; break;
		case 'DASH':	if (testnet) return bitcoinNetworks.dash_testnet; 		else return bitcoinNetworks.dash; break;
		case 'DOGE':	if (testnet) return bitcoinNetworks.dogecoin_testnet; 	else return bitcoinNetworks.dogecoin; break;
	}
	return false;
};

const walletGetBtcCoinParameters = (coin, testnet) => {
	switch (coin) {
		case 'BTC':		if (testnet) return coinPrmBtcTestNet; 		else return coinPrmBtc; break;
		case 'BCH':		if (testnet) return coinPrmBchTestNet; 		else return coinPrmBch; break;
		case 'BSV':		if (testnet) return coinPrmBsvTestNet; 		else return coinPrmBsv; break;
		case 'XSN':		if (testnet) return coinPrmXsn; 			else return coinPrmXsn; break;
		case 'LTC':		if (testnet) return coinPrmLtcTestNet; 		else return coinPrmLtc; break;
		case 'DASH':	if (testnet) return coinPrmDashTestNet; 	else return coinPrmDash; break;										
		case 'DOGE':	if (testnet) return coinPrmDogeTestNet; 	else return coinPrmDoge; break;
	}
	return coinUnknown;
};

const bitcoinValidateAddr = (addr, net) => {
	try {
		bitcoin.address.toOutputScript(addr, net);
		return true;
	} catch (err) {
		return false;
	}
};

const bitcoinCashValidateAddr = (addr, testnet, coin) => {
	let net = (testnet ? 'testnet' : 'livenet');
	let lib = ((coin === 'BSV') ? bsv: bitcore);

	try {
		let ret = lib.Address.isValid(addr, net);
		return ret;
	} catch (err) {
		return false;
	}
};


const bitcoinTxClearInputScripts = (tx, coin) => {
	switch (coin) {
		case 'BSV':
		case 'BCH':
			let lib = ((coin === 'BSV') ? bsv: bitcore);
			for (let i = 0; i < tx.inputs.length; i++) {
				tx.inputs[i].setScript(lib.Script());
			}
			break;
			
		default:
			for (let i = 0; i < tx.ins.length; i++) {
				tx.ins[i].script = bitcoin.script.compile([]);
			}
			break;
	}
}

const bitcoinTxAddSignatures = (tx, signatures, coin) => {
	switch (coin) {
		case 'BSV':
		case 'BCH':
			let lib = ((coin === 'BSV') ? bsv: bitcore);
			for (let i = 0; i < tx.inputs.length; i++) {
				tx.inputs[i].setScript(lib.Script.fromHex(signatures[i]));
			}		
			break;

		default:
			for (let i = 0; i < tx.ins.length; i++) {
				tx.ins[i].script = bitcoin.script.compile(hexStringToArray(signatures[i]));
			}
			break;
	}
}

const bitcoinScriptFromHex = (script, coin) => {
	let lib = ((coin === 'BSV') ? bsv: bitcore);
	return lib.Script.fromHex(script)
}

const bitcoinTxSerialize = (tx, coin) => {
	switch (coin) {
		case 'BSV':
		case 'BCH':
			try {
				let txSerial = tx.serialize({
					disableDustOutputs: true,
					disableIsFullySigned: true
				});
				return txSerial;
			} catch (err) {
				return false;
			}
			break;

		default:
			return tx.toHex();
			break;
	}
}

const bitcoinGetUnspentOutputs = async (coin, addr, testnet, timeout) => {
	return new Promise((resolve) => {
5
		let ret = false;
		let tmr = setTimeout(() => resolve(ret), timeout);

		$.get(bitcoinApiAddrUnspent, {coin: coin, addr: addr, testnet: testnet, confirmations: 1, rnd: rnd()}).then((utxos) => {

			clearTimeout(tmr);
			if (utxos && utxos.length) ret = utxos;
			resolve(ret);
		}).fail((err) => {
			clearTimeout(tmr);
			resolve(ret);
		});
	});
};


const bitcoinPushTx = async (coin, tx, testnet, timeout) => {
	return new Promise((resolve) => {

		let tmr = setTimeout(() => resolve('Server respone timeout'), timeout);

		$.post(bitcoinApiAddrPushTx, {coin: coin, tx: tx, testnet: testnet}).done((result) => {
			let ret = 'Unknown server response';
			
			clearTimeout(tmr);
			if (result)	{
				if (result.result) {
					ret = true;
				}

				if (result.error) {
					ret = result.error;
				}
			} 

			resolve(ret);
		}).fail((err) => {
			clearTimeout(tmr);
			resolve('Server respone error');
		});
	});
};
