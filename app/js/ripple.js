'use strict';

const rippleBinary = require("ripple-binary-codec");
const rippleAddrCodec = require('ripple-address-codec');

const rippleApiAddrPushTx =		'https://wallet.security-arts.com/api/pushtx/';
const rippleApiAddrUnspent =	'https://wallet.security-arts.com/api/unspent/';

const coinPrmXrp = 			{name: 'Ripple',			ticker: 'XRP',	fee: 0.00001,	feeType: 'Fee', feeName: 'XRP',		img: 'xrp.png',		fractions: 1000000,		explorer: 'https://livenet.xrpl.org/accounts/'};
const coinPrmXrpTestNet = 	{name: 'Ripple Testnet',	ticker: 'XRP',	fee: 0.00001,	feeType: 'Fee',	feeName: 'XRP',		img: 'xrp.png',		fractions: 1000000,		explorer: 'https://testnet.xrpl.org/accounts/'};
const coinPrmXrpUnknown =	{name: 'Unknown',			ticker: '',		fee: 0,			feeType: '',	feeName: '',		img: 'none.png',	fractions: 1000000,		explorer: 'https://google.com/search?q='};

const walletGetXrpCoinParameters = (coin, testnet) => {
	if (coin === 'XRP') {
		if (testnet) return coinPrmXrpTestNet; else return coinPrmXrp;
	}
	return coinPrmXrpUnknown;
};

function rippleEncodeTxSigned(tx) {
	return rippleBinary.encode(tx);
}

function rippleEncodeTxForSigning(tx) {
	try {
		return rippleBinary.encodeForSigning(tx);
	} catch (err) {
		return false;
	}
}

function rippleIsAddressValid(addr, testnet) {
	try {
		let xAddr = rippleAddrCodec.classicAddressToXAddress(addr, false, testnet);
		return rippleAddrCodec.isValidXAddress(xAddr);
	} catch (err) {
		return false;
	}
}

async function rippleGetSeqInfo(addr, testnet, timeout) {
	return new Promise((resolve) => {

		let tmr = setTimeout(() => resolve(false), timeout);

		$.get(rippleApiAddrUnspent, {coin: "XRP", addr: addr, testnet: testnet, rnd: rnd()}).then((data) =>	{
			clearTimeout(tmr);
			resolve(data);
		}).fail(() => {
			clearTimeout(tmr);
			resolve(false);
		}).catch(() => null);
	});
}


async function rippleGenerateTransaction(addrFrom, addrTo, pubKey, amount, fee, testnet, seqOffset, destTag, timeout) {
	let seq = await rippleGetSeqInfo(addrFrom, testnet, timeout);

	if (seq) {
		return {
			TransactionType: "Payment",
			Account: addrFrom,
			Destination: addrTo,
			SigningPubKey: pubKey,
			Amount: amount.toString(),
			Flags: 0x80000000,
			LastLedgerSequence: seq.ledger_seq + seqOffset,
			Fee: fee.toString(),
			DestinationTag: destTag,
			Sequence: seq.account_seq
		}
	}

	return false;
}

async function ripplePushTx(tx, testnet, timeout) {
	return new Promise((resolve) => {

		let tmr = setTimeout(() => resolve('Server respone timeout'), timeout);

		$.post(rippleApiAddrPushTx, {coin: "XRP", tx: tx, testnet: testnet}).done((result) => {
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
};
