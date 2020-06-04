'use strict';

const util = require('ethereumjs-util');
const EthereumTx = require('ethereumjs-tx').Transaction;

const ethereumApiAddrPushTx =	'https://wallet.security-arts.com/api/pushtx/';
const ethereumApiAddrUnspent =	'https://wallet.security-arts.com/api/unspent/';

const coinPrmEth =			{name: 'Ethereum',			ticker: 'ETH',	fee: 1, feeType: 'Gas Price',	feeName: 'Gwei',	gasLimit: 22000,	img: 'eth.png',		fractions: 1000000000000000000,		explorer: 'https://etherscan.io/address/'};
const coinPrmEthTestNet =	{name: 'Ethereum Testnet',	ticker: 'ETH',	fee: 1, feeType: 'Gas Price',	feeName: 'Gwei',	gasLimit: 22000,	img: 'eth.png',		fractions: 1000000000000000000,		explorer: 'https://ropsten.etherscan.io/address/'};
const coinEthUnknown =		{name: 'Unknown',			ticker: '',		fee: 0,	feeType: '', 			feeName: '',		gasLimit: 22000,	img: 'none.png',	fractions: 1000000000000000000,		explorer: 'https://google.com/search?q='};

const walletGetEthCoinParameters = (coin, testnet) => {
	if (coin === 'ETH') {
		if (testnet) return coinPrmEthTestNet; else return coinPrmEth;
	}

	return coinEthUnknown;
};

const walletGetEthGasPriceFractions = () => {
	return 1000000000;
}

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
			gasPrice: gasPrice,
			gasLimit: gasLimit,
			value: amount,
			to: addrTo,
			data: '0x00',
			v: v
		};

		if (testnet) {
			Tx = new EthereumTx(txParam, {chain: 3});
		} else {
			Tx = new EthereumTx(txParam);
		}

		return Tx;
	}

	return false;
}

function ethereumSerializeTransaction(Tx)
{
	return Tx.serialize().toString('hex');
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

		$.post(ethereumApiAddrPushTx, {coin: "ETH", tx: tx, testnet: testnet}).done((result) => {
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
		}).catch(() => null);
	});
}

