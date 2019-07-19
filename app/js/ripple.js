'use strict';

const rippleKeypairs = require("ripple-keypairs");
const rippleBinary = require("ripple-binary-codec");
const rippleHashes = require("ripple-hashes");
const rippleAddrCodec = require('ripple-address-codec');

const rippleApiAddrFee = 		'https://wallet.security-arts.com/api/getfee/';
const rippleApiAddrRate =		'https://wallet.security-arts.com/api/getrate/';
const rippleApiAddrPushTx =		'https://wallet.security-arts.com/api/pushtx/';
const rippleApiAddrUnspent =	'https://wallet.security-arts.com/api/unspent/';
const rippleApiAddrBalance =	'https://wallet.security-arts.com/api/addressbalance/';


const coinPrmXrp = 			{name: 'Ripple',			ticker: 'XRP',	fee: 0.00001,	feeType: 'Fee', feeName: 'XRP',		img: 'xrp.png',		explorer: 'https://xrpscan.com/account/'};
const coinPrmXrpTestNet = 	{name: 'Ripple Testnet',	ticker: 'XRP',	fee: 0.00001,	feeType: 'Fee',	feeName: 'XRP',		img: 'xrp.png',		explorer: 'https://xrpscan.com/account/'};
const coinPrmXrpUnknown =	{name: 'Unknown',			ticker: '',		fee: 0,			feeType: '',	feeName: '',		img: 'none.png',	explorer: 'https://google.com/search?q='};

const walletGetXrpCoinParameters = (coin, testnet) => {
	switch (coin) {
		case 'XRP': if (testnet) return coinPrmXrpTestNet; else return coinPrmXrp; break;
	}
	return coinPrmXrpUnknown;
};

function rippleEncodeTxFinal(tx) {
	return rippleBinary.encode(tx);
}

function rippleEncodeTxForSigning(tx) {
	return rippleBinary.encodeForSigning(tx);
}

function rippleIsAddressValid(addr) {
	return rippleAddrCodec.isValidAddress(addr);
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
		});
	});
}


async function rippleGenerateTransaction(addrFrom, addrTo, pubKey, amount, fee, testnet, seqOffset, timeout) {
	let seq = await rippleGetSeqInfo(addrFrom, testnet, timeout);
	
	if (seq) {
		return {
			TransactionType: "Payment",
			Account: addrFrom,
			Destination: addrTo,
			SigningPubKey: pubKey,
			Amount: amount.toString(),
			Flags: 2147483648,
			LastLedgerSequence: seq.ledger_seq + seqOffset,
			Fee: fee.toString(),
			Sequence: seq.account_seq
		};
	}
	
	return false;
}

async function ripplePushTx(tx, testnet, timeout) {
	return new Promise((resolve) => {
		let tmr = setTimeout(() => resolve('Server respone timeout'), timeout);
	
		$.post(bitcoinApiAddrPushTx, {coin: "XRP", tx: tx, testnet: testnet}).done((result) => {
			let ret = 'Unknown server response';
			
			clearTimeout(tmr);
			if (result) {
				if (result.result) {
					ret = true;
				}

				if (result.error) {
					ret = ret.error;
				}
			} 
			
			resolve(ret);
		}).fail(() => {
			clearTimeout(tmr);
			resolve('Server respone error');
		});
	});
}
