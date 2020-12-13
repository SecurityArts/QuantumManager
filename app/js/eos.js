'use strict';

const {Api} = require('eosjs');
const {TextDecoder, TextEncoder} = require('util');
const eosNumeric = require("eosjs/dist/eosjs-numeric");

const eosApiAddrPushTx =	'https://wallet.security-arts.com/api/pushtx/';
const eosApiAddrUnspent =	'https://wallet.security-arts.com/api/unspent/';

const coinPrmEos = 			{name: 'EOS',			ticker: 'EOS',	fee: 0,	feeType: 'Fee', feeName: 'EOS',		img: 'eos.png',		fractions: 1,	explorer: 'https://bloks.io/account/'};
const coinPrmEosTestNet = 	{name: 'EOS Testnet',	ticker: 'EOS',	fee: 0,	feeType: 'Fee',	feeName: 'EOS',		img: 'eos.png',		fractions: 1,	explorer: 'https://jungle.bloks.io/account/'};
const coinPrmEosUnknown =	{name: 'Unknown',		ticker: '',		fee: 0,	feeType: '',	feeName: '',		img: 'none.png',	fractions: 1,	explorer: 'https://google.com/search?q='};

const chainIdMainNet = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
const chainIdTestNet = 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473'; // Jungle Tesnet


const walletGetEosCoinParameters = (coin, testnet) => {
	if (coin === 'EOS') {
		if (testnet) return coinPrmEosTestNet; else return coinPrmEos;
	}
	return coinPrmEosUnknown;
};

function eosIsValidAccountName(name) {
	if (typeof name !== 'string') return false
	if (name.length > 12) return false
	if (!/[a-z]/.test(name[0])) return false
	return !/[^abcdefghijklmnopqrstuvwxyz12345.]/.test(name)
} 

function eosIsValidPubKey(key) {
	try {
		eosNumeric.stringToPublicKey(key);
		return true;
	} catch (e) {
		return false;
	}
}


//---------------------------------------  Transactions  ---------------------------------------------------------------
async function eosBuildTxTransfer(from, to, amount, testnet, refBlockNum, refBlockPrefix, validMinutes, memo)
{
	const chainId = (testnet ? chainIdTestNet : chainIdMainNet);

	const abiProvider = {
		getRawAbi: (accountName) => {return Promise.resolve({abi: Buffer.from(eosAbi.EOSIOTOKEN, 'base64'), accountName})}
	};

	const api = new Api({
		abiProvider,
		chainId: chainId,
		textDecoder: new TextDecoder(),
		textEncoder: new TextEncoder(),
	});

	const optionaldetails = {
		sign: false,
		broadcast: false
	};

	const transaction = {
		actions: [{
            name: 'transfer',
			account: 'eosio.token',
            authorization: [{actor: from, permission: 'active'}],
            data: {
                memo: memo,
				to: to,
				from: from,
                quantity: amount.toFixed(4) + ' EOS'
            }
        }],

		net_usage_words: 0,
		max_cpu_usage_ms: 0,

		ref_block_num: refBlockNum,
		ref_block_prefix: refBlockPrefix,

		context_free_actions: [],
		transaction_extensions: [],

		delay_sec: 0,
		expiration: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + validMinutes * 60000)
	};

    try {
		let tx = await api.transact(transaction, optionaldetails);

		return {
			packed_trx: Buffer.from(tx.serializedTransaction).toString('hex'),
			tx: Buffer.concat([Buffer.from(chainId, 'hex'), Buffer.from(tx.serializedTransaction), Buffer.from(new Uint8Array(32))]).toString('hex')
		};

	} catch (e) {
		return false;
	}

	return false;
}

async function eosBuildTxBuyRam(isAmountInEOS, from, to, amount, testnet, refBlockNum, refBlockPrefix, validMinutes)
{
	let action;
	const chainId = (testnet ? chainIdTestNet : chainIdMainNet);

	const abiProvider = {
		getRawAbi: (accountName) => {return Promise.resolve({abi: Buffer.from(eosAbi.EOSIO, 'base64'), accountName})}
	};

	const api = new Api({
		abiProvider,
		chainId: chainId,
		textDecoder: new TextDecoder(),
		textEncoder: new TextEncoder(),
	});

	const optionaldetails = {
		sign: false,
		broadcast: false
	};

	if (isAmountInEOS) {
		action = [{
            account: 'eosio',
			name: 'buyram',
            authorization: [{actor: from, permission: 'active'}],
            data: {
				payer: from,
				receiver: to,
                quant: amount.toFixed(4) + ' EOS'
            }
        }];
	} else {
		action = [{
            account: 'eosio',
			name: 'buyrambytes',
            authorization: [{actor: from, permission: 'active'}],
            data: {
				payer: from,
				receiver: to,
                bytes: amount
            }
        }]
	}

	const transaction = {
		actions: action,

		net_usage_words: 0,
		max_cpu_usage_ms: 0,

		ref_block_num: refBlockNum,
		ref_block_prefix: refBlockPrefix,

		context_free_actions: [],
		transaction_extensions: [],

		delay_sec: 0,
		expiration: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + validMinutes * 60000)
	};

    try {
		let tx = await api.transact(transaction, optionaldetails);

		return {
			packed_trx: Buffer.from(tx.serializedTransaction).toString('hex'),
			tx: Buffer.concat([Buffer.from(chainId, 'hex'), Buffer.from(tx.serializedTransaction), Buffer.from(new Uint8Array(32))]).toString('hex')
		};

	} catch (e) {
		return false;
	}

	return false;
}

async function eosBuildTxSellRam(from, to, amount, testnet, refBlockNum, refBlockPrefix, validMinutes)
{
	const chainId = (testnet ? chainIdTestNet : chainIdMainNet);

	const abiProvider = {
		getRawAbi: (accountName) => {return Promise.resolve({abi: Buffer.from(eosAbi.EOSIO, 'base64'), accountName})}
	};

	const api = new Api({
		abiProvider,
		chainId: chainId,
		textDecoder: new TextDecoder(),
		textEncoder: new TextEncoder(),
	});

	const optionaldetails = {
		sign: false,
		broadcast: false
	};

	const transaction = {
		actions: [{
            account: 'eosio',
			name: 'sellram',
            authorization: [{actor: from, permission: 'active'}],
            data: {
				account: to,
                bytes: amount
            }
        }],

		net_usage_words: 0,
		max_cpu_usage_ms: 0,

		ref_block_num: refBlockNum,
		ref_block_prefix: refBlockPrefix,

		context_free_actions: [],
		transaction_extensions: [],

		delay_sec: 0,
		expiration: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + validMinutes * 60000)
	};

    try {
		let tx = await api.transact(transaction, optionaldetails);

		return {
			packed_trx: Buffer.from(tx.serializedTransaction).toString('hex'),
			tx: Buffer.concat([Buffer.from(chainId, 'hex'), Buffer.from(tx.serializedTransaction), Buffer.from(new Uint8Array(32))]).toString('hex')
		};
	} catch (e) {
		return false;
	}

	return false;
}

async function eosBuildTxStakeUnstake(isStake, from, to, amountCPU, amountNET, transfer, testnet, refBlockNum, refBlockPrefix, validMinutes)
{
	let action;
	const chainId = (testnet ? chainIdTestNet : chainIdMainNet);

	const abiProvider = {
		getRawAbi: (accountName) => {return Promise.resolve({abi: Buffer.from(eosAbi.EOSIO, 'base64'), accountName})}
	};

	const api = new Api({
		abiProvider,
		chainId: chainId,
		textDecoder: new TextDecoder(),
		textEncoder: new TextEncoder(),
	});

	const optionaldetails = {
		sign: false,
		broadcast: false
	};

	if (isStake) {
		action = [{
            account: 'eosio',
			name: 'delegatebw',
            authorization: [{actor: from, permission: 'active'}],
            data: {
				from: from,
				receiver: to,
                stake_net_quantity: amountNET.toFixed(4) + ' EOS',
				stake_cpu_quantity: amountCPU.toFixed(4) + ' EOS',
				transfer: transfer
            }
        }];
	} else {
		action = [{
            account: 'eosio',
			name: 'undelegatebw',
            authorization: [{actor: from, permission: 'active'}],
            data: {
				from: from,
				receiver: to,
                unstake_net_quantity: amountNET.toFixed(4) + ' EOS',
				unstake_cpu_quantity: amountCPU.toFixed(4) + ' EOS',
            }
        }];
	}

	const transaction = {
		actions: action,

		net_usage_words: 0,
		max_cpu_usage_ms: 0,

		ref_block_num: refBlockNum,
		ref_block_prefix: refBlockPrefix,

		context_free_actions: [],
		transaction_extensions: [],

		delay_sec: 0,
		expiration: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + validMinutes * 60000)
	};

    try {
		let tx = await api.transact(transaction, optionaldetails);

		return {
			packed_trx: Buffer.from(tx.serializedTransaction).toString('hex'),
			tx: Buffer.concat([Buffer.from(chainId, 'hex'), Buffer.from(tx.serializedTransaction), Buffer.from(new Uint8Array(32))]).toString('hex')
		};

	} catch (e) {
		return false;
	}

	return false;
}

async function eosBuildTxNewAccount(creator, newAccountName, pubKeyOwner, pubKeyActive, amountRAM, amountCPU, amountNET, testnet, refBlockNum, refBlockPrefix, validMinutes)
{
	const chainId = (testnet ? chainIdTestNet : chainIdMainNet);

	const abiProvider = {
		getRawAbi: (accountName) => {return Promise.resolve({abi: Buffer.from(eosAbi.EOSIO, 'base64'), accountName})}
	};

	const api = new Api({
		abiProvider,
		chainId: chainId,
		textDecoder: new TextDecoder(),
		textEncoder: new TextEncoder(),
	});

	const optionaldetails = {
		sign: false,
		broadcast: false
	};

	const transaction = {
		actions: [{
			account: 'eosio',
			name: 'newaccount',
			authorization: [{actor: creator, permission: 'active'}],
			data: {
				creator: creator,
				name: newAccountName,

				owner: {
					waits: [],
					accounts: [],
					threshold: 1,
					keys: [{weight: 1, key: pubKeyOwner}]
				},

				active: {
					waits: [],
					accounts: [],
					threshold: 1,
					keys: [{weight: 1, key: pubKeyActive}]
				}
			}
		}, {
			account: 'eosio',
			name: 'buyrambytes',
			authorization: [{actor: creator, permission: 'active'}],
			data: {
				payer: creator,
				receiver: newAccountName,
				bytes: amountRAM
			}
		}, {
			account: 'eosio',
			name: 'delegatebw',
			authorization: [{actor: creator, permission: 'active'}],
			data: {
				from: creator,
				receiver: newAccountName,
				stake_net_quantity: amountNET.toFixed(4) + ' EOS',
				stake_cpu_quantity: amountCPU.toFixed(4) + ' EOS',
				transfer: true,
			}
		}],

		net_usage_words: 0,
		max_cpu_usage_ms: 0,

		ref_block_num: refBlockNum,
		ref_block_prefix: refBlockPrefix,

		context_free_actions: [],
		transaction_extensions: [],

		delay_sec: 0,
		expiration: new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000 + validMinutes * 60000)
	};

    try {
		let tx = await api.transact(transaction, optionaldetails);

		return {
			packed_trx: Buffer.from(tx.serializedTransaction).toString('hex'),
			tx: Buffer.concat([Buffer.from(chainId, 'hex'), Buffer.from(tx.serializedTransaction), Buffer.from(new Uint8Array(32))]).toString('hex')
		};
	} catch (e) {
		return false;
	}

	return false;
}


async function eosGetBlockNum(addr, testnet, timeout) {
	return new Promise((resolve) => {

		let tmr = setTimeout(() => resolve(false), timeout);

		$.get(ethereumApiAddrUnspent, {coin: "EOS", addr: addr, testnet: testnet, rnd: rnd()}).then((data) => {
			clearTimeout(tmr);

			if (data && data.hasOwnProperty('ref_block_num') && data.hasOwnProperty('ref_block_prefix')) {
				resolve(data);
			} else {
				resolve(false);
			}

		}).fail(() => {
			clearTimeout(tmr);
			resolve(false);
		});
	});
}

async function eosGenerateTxTransfer(from, to, amount, testnet, validMinutes, memo, timeout) {
	let block_num = await eosGetBlockNum(from, testnet, timeout);

	if (block_num) {
		return await eosBuildTxTransfer(from, to, amount, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes, memo);
	}

	return false;
}

async function eosGenerateTxBuyRamBytes(from, to, amount, testnet, validMinutes, timeout) {
	let block_num = await eosGetBlockNum(from, testnet, timeout);

	if (block_num) {
		return await eosBuildTxBuyRamBytes(from, to, amount, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes);
	}

	return false;
}

async function eosGenerateTxBuyRam(isAmountInEOS, from, to, amount, testnet, validMinutes, timeout) {
	let block_num = await eosGetBlockNum(from, testnet, timeout);

	if (block_num) {
		return await eosBuildTxBuyRam(isAmountInEOS, from, to, amount, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes);
	}

	return false;
}

async function eosGenerateTxSellRam(from, to, amount, testnet, validMinutes, timeout) {
	let block_num = await eosGetBlockNum(from, testnet, timeout);

	if (block_num) {
		return await eosBuildTxSellRam(from, to, amount, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes);
	}

	return false;
}

async function eosGenerateTxStakeUnstage(isStake, from, to, amountCPU, amountNET, transfer, testnet, validMinutes, timeout) {
	let block_num = await eosGetBlockNum(from, testnet, timeout);

	if (block_num) {
		return await eosBuildTxStakeUnstake(isStake, from, to, amountCPU, amountNET, transfer, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes);
	}

	return false;
}

async function eosGenerateTxNewAccount(creator, newAccountName, pubKeyOwner, pubKeyActive, amountRAM, amountCPU, amountNET, testnet, validMinutes, timeout) {
	let block_num = await eosGetBlockNum(creator, testnet, timeout);

	if (block_num) {
		return await eosBuildTxNewAccount(creator, newAccountName, pubKeyOwner, pubKeyActive, amountRAM, amountCPU, amountNET, testnet, block_num.ref_block_num, block_num.ref_block_prefix, validMinutes);
	}

	return false;
}

function eosFormatTransaction(tx, signature, curveType = 'K1') {
	let type = 0;

	switch (curveType) {
		case 'K1':
			type = 0;
			break;
		case 'R1':
			type = 1;
			break;
		case 'WA':
			type = 2;
			break;
	}

	let sign = eosNumeric.signatureToString({data: Buffer.from(signature, 'hex'), type: type});
	return '{"signatures":["' + sign + '"],"compression":0,"packed_context_free_data":"","packed_trx":"' + tx + '"}';
}

async function eosPushTx(tx, testnet, timeout) {
	return new Promise((resolve) => {

		let tmr = setTimeout(() => resolve('Server respone timeout'), timeout);

		$.post(eosApiAddrPushTx, {coin: "EOS", tx: btoa(tx), testnet: testnet}).done((result) => {
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
//---------------------------------------  Transactions  ---------------------------------------------------------------
