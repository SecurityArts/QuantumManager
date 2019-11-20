'use strict';

const bitcoin = require('bitcoinjs-lib');
const coinSelect = require('coinselect');


const bitcoinApiAddrRate =			'https://wallet.security-arts.com/api/getrate/';
const bitcoinApiAddrPushTx =		'https://wallet.security-arts.com/api/pushtx/';
const bitcoinApiAddrUnspent =		'https://wallet.security-arts.com/api/unspent/';
const bitcoinApiAddrBalance =		'https://wallet.security-arts.com/api/addressbalance/';
const bitcoinApiAddrCoinInfo =		'https://wallet.security-arts.com/api/getcoininfo/';
const bitcoinApiAddrMarketData =	'https://wallet.security-arts.com/api/getmarketdata/';


const coinPrmBtc = 			{name: 'Bitcoin',			ticker: 'BTC',	fee: 50,	feeType: 'Fee', feeName: 'sat/Byte',		img: 'btc.png',		explorer: 'https://blockchain.com/btc/address/'};
const coinPrmBtcTestNet = 	{name: 'Bitcoin Testnet',	ticker: 'BTC',	fee: 50,	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'btc.png',		explorer: 'https://live.blockcypher.com/btc-testnet/address/'};

const coinPrmLtc = 			{name: 'LiteCoin',			ticker: 'LTC',	fee: 10,	feeType: 'Fee',	feeName: 'Litoshi/Byte',	img: 'ltc.png',		explorer: 'https://chain.so/address/LTC/'};
const coinPrmLtcTestNet = 	{name: 'LiteCoin Testnet',	ticker: 'LTC',	fee: 10,	feeType: 'Fee',	feeName: 'Litoshi/Byte',	img: 'ltc.png',		explorer: 'https://chain.so/address/LTCTEST/'};

const coinPrmDash =			{name: 'Dash',				ticker: 'DASH',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'dash.png',	explorer: 'https://chain.so/address/DASH/'};
const coinPrmDashTestNet = 	{name: 'Dash Testnet',		ticker: 'DASH',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'dash.png',	explorer: 'https://chain.so/address/DASHTEST/'};

const coinPrmDoge =  		{name: 'DogeCoin',			ticker: 'DOGE',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'doge.png',	explorer: 'https://dogechain.info/address/'};
const coinPrmDogeTestNet = 	{name: 'DogeCoin Testnet',	ticker: 'DOGE',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'doge.png',	explorer: 'https://chain.so/address/DOGETEST/'};

const coinPrmZcash = 		{name: 'Zcash',				ticker: 'ZEC',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'zec.png',		explorer: 'https://chain.so/address/ZEC/'};
const coinPrmZcashTestNet =	{name: 'Zcash Testnet',		ticker: 'ZEC',	fee: 1,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'zec.png',		explorer: 'https://chain.so/address/ZECTEST/'};

const coinPrmBtg =			{name: 'Bitcoin Gold',		ticker: 'BTG',	fee: 50, 	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'btg.png',		explorer: 'https://btgexplorer.com/address/'};
const coinPrmPivx =			{name: 'Pivx',				ticker: 'PIVX',	fee: 50, 	feeType: 'Fee',	feeName: 'sat/Byte',		img: 'pivx.png',	explorer: 'https://chainz.cryptoid.info/pivx/address.dws?'};
const coinPrmXsn =			{name: 'XSN Stakenet',		ticker: 'XSN',	fee: 2,		feeType: 'Fee',	feeName: 'sat/Byte',		img: 'xsn.png',		explorer: 'https://xsnexplorer.io/addresses/'};
const coinUnknown =			{name: 'Unknown',			ticker: '',		fee: 0, 	feeType: 'Fee',	feeName: '',				img: 'none.png',	explorer: 'https://google.com/search?q='};


const walletGetNetType = (coin, testnet) => {
	switch (coin) {
		case 'BTC':		if (testnet) return bitcoinNetworks.testnet; 			else return bitcoinNetworks.bitcoin; break;
		case 'XSN':		if (testnet) return bitcoinNetworks.xsn_testnet; 		else return bitcoinNetworks.xsn; break;
		case 'LTC':		if (testnet) return bitcoinNetworks.litecoin_testnet; 	else return bitcoinNetworks.litecoin; break;
		case 'DASH':	if (testnet) return bitcoinNetworks.dash_testnet; 		else return bitcoinNetworks.dash; break;
		case 'DOGE':	if (testnet) return bitcoinNetworks.dogecoin_testnet; 	else return bitcoinNetworks.dogecoin; break;
		case 'ZEC':		if (testnet) return bitcoinNetworks.zcash_testnet; 		else return bitcoinNetworks.zcash; break;
	}
	return false;
};

const walletGetCoinParameters = (coin, testnet) => {
	switch (coin) {
		case 'BTC':		if (testnet) return coinPrmBtcTestNet; 		else return coinPrmBtc; break;
		case 'XSN':		if (testnet) return coinPrmXsn; 			else return coinPrmXsn; break;
		case 'LTC':		if (testnet) return coinPrmLtcTestNet; 		else return coinPrmLtc; break;
		case 'DASH':	if (testnet) return coinPrmDashTestNet; 	else return coinPrmDash; break;										
		case 'DOGE':	if (testnet) return coinPrmDogeTestNet; 	else return coinPrmDoge; break;
		case 'ZEC':		if (testnet) return coinPrmZcashTestNet; 	else return coinPrmZcash; break;
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

const bitcoinGetUnspentOutputs = async (coin, addr, testnet, timeout) => {
	return new Promise((resolve) => {
		
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
	}).catch(() => null);
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
				} else {
					if (result.error) {
						ret = result.error;
					}
				}
			} 
			
			resolve(ret);
		}).fail((err) => {
			clearTimeout(tmr);
			resolve('Server respone error');
		});
	}).catch(() => null);
};
