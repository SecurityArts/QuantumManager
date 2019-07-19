'use strict';

const Big = require('big.js');
const bigInt = require("big-integer");
const util = require('ethereumjs-util');
const EthereumTx = require('ethereumjs-tx').Transaction;

const ethereumApiAddrFee =		'https://wallet.security-arts.com/api/getfee/';
const ethereumApiAddrRate =		'https://wallet.security-arts.com/api/getrate/';
const ethereumApiAddrPushTx =	'https://wallet.security-arts.com/api/pushtx/';
const ethereumApiAddrUnspent =	'https://wallet.security-arts.com/api/unspent/';
const ethereumApiAddrBalance =	'https://wallet.security-arts.com/api/addressbalance/';

const coinPrmEth =			{name: 'Ethereum',			ticker: 'ETH',	fee: 1, feeType: 'Gas Price',	feeName: 'Gwei',	gasLimit: 21000,	img: 'eth.png',		explorer: 'https://etherscan.io/address/'};
const coinPrmEthTestNet =	{name: 'Ethereum Testnet',	ticker: 'ETH',	fee: 1, feeType: 'Gas Price',	feeName: 'Gwei',	gasLimit: 22000,	img: 'eth.png',		explorer: 'https://ropsten.etherscan.io/address/'};
const coinEthUnknown =		{name: 'Unknown',			ticker: '',		fee: 0,	feeType: '', 			feeName: '',		gasLimit: 21000,	img: 'none.png',	explorer: 'https://google.com/search?q='};

const walletGetEthCoinParameters = (coin, testnet) => {
	switch (coin) {
		case 'ETH': if (testnet) return coinPrmEthTestNet; else return coinPrmEth; break;
	}
	return coinEthUnknown;
};

function ethereumIsAddressValid(addr) {
	let ret = 0;
	
	if (util.isValidAddress(addr)) {
		ret++;
	}
		
	if (util.isValidChecksumAddress(addr)) {
		ret++;
	}
	
	return ret;
}

function ethereumAmount(amt)
{
	let a = Big(0);
	let m = Big('1000000000000000000');
	
	try {
		a = Big(amt);
	} catch (err) {
		return false;
	}
	
	a = a.times(m).toFixed(0);
	
	try {
		a = bigInt(a);
	} catch (err) {
		return false;
	}
	
	if (a.toString(16).length > 32) return false;
	return a;
}

function ethereumFormatAmount(amt)
{
	let d = Big('1000000000000000000');
	
	try {
		amt = Big(amt.toString(10));
	} catch (err) {
		return false;
	}
	
	amt = amt.div(d).toString(10);
	return amt;
}


function ethereumGasPrice(price)
{
	let a = Big(0);
	let m = Big('1000000000');
	
	try {
		a = Big(price);
	} catch (err) {
		return false;
	}
	
	a = a.times(m).toFixed(0);
	
	try {
		a = bigInt(a);
	} catch (err) {
		return false;
	}
	
	if (a.toString(16).length > 32) return false;
	return a;
}

function ethereumFormatGasLimit(limit)
{
	let a;
	
	try {
		a = bigInt(limit);
	} catch (err) {
		return false;
	}
	
	if (a.toString(16).length > 32) return false;
	return a;
}

function ethereumFee(price, limit)
{
	try {
		price = Big(price.toString(10));
	} catch (err) {
		return false;
	}
	
	try {
		limit = Big(limit.toString(10));
	} catch (err) {
		return false;
	}
	
	let fee = price.times(limit).toFixed(0);
	try {
		fee = bigInt(fee);
	} catch (err) {
		return false;
	}
	return fee;
}

async function ethereumGetTransactionCount(addr, testnet, timeout) {
	return new Promise((resolve) => {
		let tmr = setTimeout(() => resolve(false), timeout);
		
		$.get(ethereumApiAddrUnspent, {coin: "ETH", addr: addr, testnet: testnet, rnd: rnd()}).then((data) => {
			clearTimeout(tmr);
			if (data && data.count)	{
				resolve(Number(data.count));
			} else {
				resolve(false);
			}
		}).fail(() => {
			clearTimeout(tmr);
			resolve(false);
		});
	});
}

async function ethereumGenerateTransaction(addrFrom, addrTo, amount, gasPrice, gasLimit, testnet, timeout) {
	
	let txCount = await ethereumGetTransactionCount(addrFrom, testnet, timeout);
	
	if (txCount !== false) {
		
		let Tx;
		let v = (testnet ? '0x29' : '0x25');
		
		let txParam = {
			nonce: '0x' + txCount.toString(16),
			gasPrice: '0x' + gasPrice.toString(16),
			gasLimit: '0x' + gasLimit.toString(16),
			value: '0x' + amount.toString(16),
			to: addrTo,
			data: '',
			v: v
		};
	
		if (!testnet) {
			Tx = new EthereumTx(txParam);
		} else {
			Tx = new EthereumTx(txParam, {chain: 3});
		}
		
		return Tx;
	}
	
	return false;
}

function ethereumSerializeTransaction(Tx)
{
	return Tx.serialize().toString('hex');
}

function ethereumGetSourceAddr(Tx, testnet)
{
	if (!testnet) {
		return new EthereumTx(Tx).getSenderAddress().toString('hex');
	} else {
		return new EthereumTx(Tx, {chain: 3}).getSenderAddress().toString('hex');
	}	
}

function ethereumEncodeTxFinal(Tx, signature, testnet)
{
	let v = Number('0x' + signature.substring(128, 130));
	
	if (v >= 27) {
		v -= 27;
	}
	
	if (testnet) {
		v += 0x29;
	} else {
		v += 0x25;
	}
	
	Tx.r = '0x' + signature.substring(0, 64);
	Tx.s = '0x' + signature.substring(64, 128);
	Tx.v = '0x' + v.toString(16);
	
	return Tx;
}

async function ethereumPushTx(tx, testnet, timeout) {
	return new Promise((resolve) => {
		let tmr = setTimeout(() => resolve('Server respone timeout'), timeout);
	
		$.post(bitcoinApiAddrPushTx, {coin: "ETH", tx: tx, testnet: testnet}).done((result) => {
			let ret = 'Unknown server response';
			
			clearTimeout(tmr);
			if (result) {
				if (result.result) {
					ret = true;
				}

				if (result.error) {
					ret = result.error;
				}
			} 
			
			resolve(ret);
		}).fail(() => {
			clearTimeout(tmr);
			resolve('Server respone error');
		});
	});
}

