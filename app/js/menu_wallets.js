"use strict";

const coinApiAddrFee = 		'https://wallet.security-arts.com/api/getfee/';
const coinApiAddrRate =		'https://wallet.security-arts.com/api/getrate/';
const coinApiAddrBalance =	'https://wallet.security-arts.com/api/addressbalance/';

let walletBalance = 0;
let walletsList = false;
let walletsCurrent = false;


async function loadWallets() {

	$('#listWallets').html('');
	walletsList = await hidGetWallets(2000);

	if (walletsList) {
		for (let i = 0; i < walletsList.Wallets.length; i++) {
			$('#listWallets').append(`<li><a href="#" onclick="walletSelect(${i + 1})">${walletsList.Wallets[i].Name}</a></li>`);

			if (walletsList.Wallets[i].Type === 'EOS') {
				let accountName = storageGetWalletParameter(walletsList.Wallets[i].Name, 'account');

				walletsList.Wallets[i].PubKey = walletsList.Wallets[i].Addr;
				walletsList.Wallets[i].Addr = (accountName ? accountName : '');
			}
		}

		if (walletsList.Wallets.length < walletsList.Max) {
			$('#listWallets').append(`<li><a href="#" onclick="walletAdd()">+ add wallet</a></li>`);
		}
	}
}



//-------------------------------------  Bitcoin BTC  ---------------------------------------------------------------------
async function walletSendBTC(wallet) {

	let sendAddr = $('#wallet_send_addr').val().trim(); 
	let sendFeeStr = $('#wallet_send_fee').val().replace(',', '.').trim();
	let sendAmountStr = $('#wallet_send_amount_btc').val().replace(',', '.').trim();

	let net = walletGetBtcNetType(wallet.Type, wallet.Options.Testnet);	
	let fractions = walletGetBtcCoinParameters(wallet.Type, wallet.Options.Testnet).fractions;

	let sendFee = bigNum(sendFeeStr);
	let sendAmount = bigNumMult(sendAmountStr, fractions);
	let balance = bigNumMult(walletBalance, fractions);


	if (!bitcoinValidateAddr(sendAddr, net)) {
		infoShow('Error', 'Invalid send address', 'error', 5000);
		return;
	}

	if (sendAmount == 0) {
		infoShow('Error', 'Invalid send amount', 'error', 5000);
		return;
	}		

	if (sendFee == 0) {
		infoShow('Error', 'Invalid fee value', 'error', 5000);
		return;
	}

	let utxo = await bitcoinGetUnspentOutputs(wallet.Type, wallet.Addr, wallet.Options.Testnet, 5000);
	if (!utxo) {
		infoShow('Error', 'Not enough of money to send', 'error', 5000);
		return;
	}

	let targets = [{address: sendAddr, value: +sendAmount}];
	let {inputs, outputs} = coinSelect(utxo, targets, +sendFee);

	if (!inputs || !outputs) {
		infoShow('Error', 'Not enough of money to send', 'error', 5000);
		return;
	}


	let fee;
	let signatures = [];
	let inputAmount = 0;
	let outputAmount = 0;
	let tx = new bitcoin.TransactionBuilder(net);

	tx.setVersion(1);													
	inputs.forEach(input => {
		inputAmount += input.value;
		tx.addInput(input.txId, input.vout);
	});

	outputs.forEach(output => {
		outputAmount += output.value;
		if (!output.address) output.address = wallet.Addr;
		tx.addOutput(output.address, output.value);
	});

	tx = tx.buildIncomplete();
	fee = inputAmount - outputAmount;

	balance = bigNumSub(balance, sendAmount);
	balance = bigNumSub(balance, fee);

	await randomInit();						
	await modalTransactionShow(wallet.Addr, sendAddr, sendAmountStr, bigNumToStr(bigNumDiv(fee, fractions), 9), bigNumToStr(bigNumDiv(balance, fractions), 9), ' ' + wallet.Type, 'Press OK button on device to confirm operation');

	for (let i = 0; i < tx.ins.length; i++) {

		bitcoinTxClearInputScripts(tx, wallet.Type);
		tx.ins[i].script = bitcoin.script.compile(hexStringToArray(inputs[i].script));

		let ret = await hidSignTransaction(wallet.Index, bitcoinTxSerialize(tx, wallet.Type) + '01000000', 'SECP256K1', i + 1, tx.ins.length, 0, 100000);
		modalTransactionSetStatus('Signing...', '', false, false);

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			break;
		}

		signatures.push(ret.Signature.slice(2));
	}

	if (signatures.length === tx.ins.length) {

		bitcoinTxAddSignatures(tx, signatures, wallet.Type);
		tx = bitcoinTxSerialize(tx, wallet.Type);
		modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain', tx, true, true);

		if (await modalTransactionWaitConfirm()) {
			let ret = await bitcoinPushTx(wallet.Type, tx, wallet.Options.Testnet, 5000);

			if (ret === true) {
				infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
			} else {
				infoShow('Error', ret, 'error', 5000);
			}
		}
	}

	modalTransactionHide();
}
//-------------------------------------  Bitcoin BTC  ---------------------------------------------------------------------



//-------------------------------------  Bitcoin Cash BCH  ----------------------------------------------------------------
async function walletSendBCH(wallet) {

	let sendAddr = $('#wallet_send_addr').val().trim(); 
	let sendFeeStr = $('#wallet_send_fee').val().replace(',', '.').trim();
	let sendAmountStr = $('#wallet_send_amount_btc').val().replace(',', '.').trim();

	let net = walletGetBtcNetType(wallet.Type, wallet.Options.Testnet);	
	let fractions = walletGetBtcCoinParameters(wallet.Type, wallet.Options.Testnet).fractions;

	let sendFee = bigNum(sendFeeStr);
	let sendAmount = bigNumMult(sendAmountStr, fractions);
	let balance = bigNumMult(walletBalance, fractions);


	if (!bitcoinCashValidateAddr(sendAddr, wallet.Options.Testnet)) {
		infoShow('Error', 'Invalid send address', 'error', 5000);
		return;
	}

	if (sendAmount == 0) {
		infoShow('Error', 'Invalid send amount', 'error', 5000);
		return;
	}

	if (sendFee == 0) {
		infoShow('Error', 'Invalid fee value', 'error', 5000);
		return;
	}

	let utxo = await bitcoinGetUnspentOutputs(wallet.Type, wallet.Addr, wallet.Options.Testnet, 5000);
	if (!utxo) {
		infoShow('Error', 'Not enough of money to send', 'error', 5000);
		return;
	}

	let targets = [{address: sendAddr, value: +sendAmount}];
	let {inputs, outputs} = coinSelect(utxo, targets, +sendFee);

	if (!inputs || !outputs) {
		infoShow('Error', 'Not enough of money to send', 'error', 5000);
		return;
	}

	let signatures = [];
	let tx = new bitcore.Transaction();

	inputs.forEach(input => {
		tx.from({txId: input.txId, script: input.script, satoshis: input.value, outputIndex: input.vout});
	});

	outputs.forEach(output => {
		if (!output.address) output.address = wallet.Addr;
		tx.to(output.address, output.value);
	});

	let fee = tx.inputAmount - tx.outputAmount;
	balance = bigNumSub(balance, sendAmount);
	balance = bigNumSub(balance, fee);

	await randomInit();						
	await modalTransactionShow(wallet.Addr, sendAddr, sendAmountStr, bigNumToStr(bigNumDiv(fee, fractions), 9), bigNumToStr(bigNumDiv(balance, fractions), 9), ' ' + wallet.Type, 'Press OK button on device to confirm operation');

	for (let i = 0; i < tx.inputs.length; i++) {

		bitcoinTxClearInputScripts(tx, wallet.Type);
		tx.inputs[i].setScript(bitcore.Script.fromHex(inputs[i].script));

		let txSerial = bitcoinTxSerialize(tx, wallet.Type);
		if (!txSerial) {
			modalTransactionEnableCancel();
			infoShow('Error', 'Transaction error', 'error', 5000);
			return;
		}

		let ret = await hidSignTransaction(wallet.Index, txSerial + '41000000', 'SECP256K1', i + 1, tx.inputs.length, tx.inputs[i].output.satoshis, 100000);
		modalTransactionSetStatus('Signing...', '', false, false);

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			break;
		}

		signatures.push(ret.Signature.slice(2));
	}

	if (signatures.length === tx.inputs.length) {

		bitcoinTxAddSignatures(tx, signatures, wallet.Type);
		tx = bitcoinTxSerialize(tx, wallet.Type);
		if (!tx) {
			modalTransactionEnableCancel();
			infoShow('Error', 'Transaction error', 'error', 5000);
			return;
		}

		modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain', tx, true, true);

		if (await modalTransactionWaitConfirm()) {
			let ret = await bitcoinPushTx(wallet.Type, tx, wallet.Options.Testnet, 5000);

			if (ret === true) {
				infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
			} else {
				infoShow('Error', ret, 'error', 5000);
			}
		}
	}

	modalTransactionHide();
}
//-------------------------------------  Bitcoin Cash BCH  ----------------------------------------------------------------



//-------------------------------------  Ripple XRP  ----------------------------------------------------------------------
async function walletSendXRP(wallet) {

	let sendAddr = $('#wallet_send_addr').val().trim(); 
	let sendFeeStr = $('#wallet_send_fee').val().replace(',', '.').trim();
	let sendAmountStr = $('#wallet_send_amount_btc').val().replace(',', '.').trim();
	let fractions = walletGetXrpCoinParameters(wallet.Type, wallet.Options.Testnet).fractions;

	let sendFee = bigNumMult(sendFeeStr, fractions);
	let sendAmount = bigNumMult(sendAmountStr, fractions);
	let balance = bigNumMult(walletBalance, fractions);
	let sendTotal = bigNumAdd(sendAmount, sendFee);

	if (!rippleIsAddressValid(sendAddr, wallet.Options.Testnet)) {
		infoShow('Error', 'Invalid send address', 'error', 5000);
		return;
	}

	if (sendAmount == 0) {
		infoShow('Error', 'Invalid send amount', 'error', 5000);
		return;
	}

	if (sendFee == 0) {
		infoShow('Error', 'Invalid fee value', 'error', 5000);
		return;
	}

	if (balance.lessThan(sendTotal)) {
		infoShow('Error', 'Wallet balance is to low', 'error', 5000);
		return;
	}

	let ret = await hidGetWalletPubKey(wallet.Index, 2000);
	if (ret.Error) {
		infoShow('Error', ret.Error, 'error', 5000);
		return;
	}

	balance = bigNumSub(balance, sendTotal);
	await modalTransactionShow(wallet.Addr, sendAddr, sendAmountStr, sendFeeStr, bigNumToStr(bigNumDiv(balance, fractions), 7), ' XRP', 'Getting wallet data, please wait');
	let tx = await rippleGenerateTransaction(wallet.Addr, sendAddr, ret.PubKey, +sendAmount, +sendFee, wallet.Options.Testnet, 40, 5000);

	if (!tx) {
		modalTransactionHide();
		infoShow('Error', 'Can\'t get wallet data', 'error', 5000);
		return;
	}

	modalTransactionSetStatus('Please press random buttons on device', '', false, false);
	await randomInit();
	modalTransactionSetStatus('Press OK button on device to confirm operation', '', false, false);

	ret = await hidSignTransaction(wallet.Index, rippleEncodeTxForSigning(tx), 'SECP256K1', 1, 1, 0, 70000);
	if (ret.Error) {
		modalTransactionHide();
		infoShow('Error', ret.Error, 'error', 5000);
		return;
	}

	tx.TxnSignature = ret.Signature;
	tx = rippleEncodeTxSigned(tx);
	modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain', tx, true, true);

	if (await modalTransactionWaitConfirm()) {
		ret = await ripplePushTx(tx, wallet.Options.Testnet, 10000);

		if (ret === true) {
			infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
		} else {
			infoShow('Error', ret, 'error', 5000);
		}
	}

	modalTransactionHide();
}
//-------------------------------------  Ripple XRP  ----------------------------------------------------------------------



//-------------------------------------  EOS EOS  -------------------------------------------------------------------------
async function walletSendEOS(wallet) {

	let sendAddr = $('#wallet_send_addr').val().trim(); 
	let sendAmountStr = $('#wallet_send_amount_btc').val().replace(',', '.').trim();
	let fractions = walletGetEosCoinParameters(wallet.Type, wallet.Options.Testnet).fractions;

	let sendAmount = bigNumMult(sendAmountStr, fractions);
	let balance = bigNumMult(walletBalance, fractions);

	if (!eosIsValidAccountName(sendAddr)) {
		infoShow('Error', 'Invalid send address', 'error', 5000);
		return;
	}

	if (sendAmount == 0) {
		infoShow('Error', 'Invalid send amount', 'error', 5000);
		return;
	}

	if (balance.lessThan(sendAmount)) {
		infoShow('Error', 'Wallet balance is to low', 'error', 5000);
		return;
	}

	balance = bigNumSub(balance, sendAmount);
	await modalTransactionShow(wallet.Addr, sendAddr, sendAmountStr, '0', bigNumToStr(bigNumDiv(balance, fractions), 8), ' EOS', 'Getting wallet data, please wait');
	let tx = await eosGenerateTxTransfer(wallet.Addr, sendAddr, +sendAmount, wallet.Options.Testnet, 30, 5000);

	if (!tx) {
		modalTransactionHide();
		infoShow('Error', 'Can\'t get wallet data', 'error', 5000);
		return;
	}

	modalTransactionSetStatus('Please press random buttons on device', '', false, false);
	await randomInit();
	modalTransactionSetStatus('Press OK button on device to confirm operation', '', false, false);

	let ret = await hidSignTransaction(wallet.Index, tx.tx, 'SECP256K1', 1, 1, 0, 70000);
	if (ret.Error) {
		modalTransactionHide();
		infoShow('Error', ret.Error, 'error', 5000);
		return;
	}

	tx = eosFormatTransaction(tx.packed_trx, ret.Signature);
	modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain', tx, true, true);

	if (await modalTransactionWaitConfirm()) {
		ret = await eosPushTx(tx, wallet.Options.Testnet, 10000);

		if (ret === true) {
			infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
		} else {
			infoShow('Error', ret, 'error', 5000);
		}
	}

	modalTransactionHide();
}


async function walletEosPushAction(tx) {

	await randomInit();
	infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
	let ret = await hidSignTransaction(walletsCurrent.Index, tx.tx, 'SECP256K1', 1, 1, 0, 70000);

	if (ret.Error) {
		infoShow('Error', ret.Error, 'error', 5000);
		return;
	}

	tx = eosFormatTransaction(tx.packed_trx, ret.Signature);
	ret = await eosPushTx(tx, walletsCurrent.Options.Testnet, 10000);

	if (ret === true) {
		infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
	} else {
		infoShow('Error', ret, 'error', 5000);
	}
}

async function walletEosStake(isStake) {

	let ret = await modalEosStake(walletsCurrent.Addr, isStake);

	if (!ret) {
		return;
	}

	if (!eosIsValidAccountName(ret.receiver)) {
		if (isStake) {
			infoShow('Error', 'Invalid receiver address', 'error', 5000);
		} else {
			infoShow('Error', 'Invalid holder address', 'error', 5000);
		}
		return;
	}

	let tx = await eosGenerateTxStakeUnstage(isStake, walletsCurrent.Addr, ret.receiver, +ret.amountCPU, +ret.amountNET, ret.transfer, walletsCurrent.Options.Testnet, 30, 5000);
	await walletEosPushAction(tx);
}


async function walletEosBuyRam() {

	let ret = await modalEosBuyRam(walletsCurrent.Addr);

	if (!ret) {
		return;
	}

	if (!eosIsValidAccountName(ret.receiver)) {
		infoShow('Error', 'Invalid receiver address', 'error', 5000);
		return;
	}

	let tx = await eosGenerateTxBuyRam((ret.type === 'EOS'), walletsCurrent.Addr, ret.receiver, +ret.amount, walletsCurrent.Options.Testnet, 30, 5000);
	await walletEosPushAction(tx);
}

async function walletEosSellRam() {

	let ret = await modalEnterNumber("EOS sell RAM", 'Enter RAM amount to sell in Bytes');

	if (!ret) {
		return;
	}

	let tx = await eosGenerateTxSellRam(walletsCurrent.Addr, walletsCurrent.Addr, +ret.Value, walletsCurrent.Options.Testnet, 30, 5000);
	await walletEosPushAction(tx);
}

async function walletEosCreateAcount() {
	let ret = await modalEosNewAccount();

	if (!ret) {
		return;
	}

	if (!eosIsValidAccountName(ret.accountName)) {
		infoShow('Error', 'Invalid new account name', 'error', 5000);
		return;
	}

	if (!eosIsValidPubKey(ret.ownerKey)) {
		infoShow('Error', 'Invalid account owner public key', 'error', 5000);
		return;
	}

	if (!eosIsValidPubKey(ret.activeKey)) {
		infoShow('Error', 'Invalid account active public key', 'error', 5000);
		return;
	}

	let tx = await eosGenerateTxNewAccount(walletsCurrent.Addr, ret.accountName, ret.ownerKey, ret.activeKey, ret.amountRAM, +ret.amountCPU, +ret.amountNET, walletsCurrent.Options.Testnet, 30, 5000);
	await walletEosPushAction(tx);
}

async function walletEosFindAccount() {
	if (!walletsCurrent.Options.Testnet) {
		openExternalUrl('https://bloks.io/key/' + walletsCurrent.PubKey);
	} else {
		openExternalUrl('https://jungle.bloks.io/key/' + walletsCurrent.PubKey);
	}
}

async function walletEosEnterAccount() {

	let index = walletsCurrent.Index - 1;
	let name = await modalEnterString('EOS account name', 13, 'Enter account name');

	if (!name) {
		return;
	}
		
	if (!eosIsValidAccountName(name.Value)) {
		infoShow('Error', 'Invalid account name', 'error', 5000);
		return;
	}
	
	storageSetWalletParameter(walletsCurrent.Name, 'account', name.Value);
	walletsList.Wallets[index].Addr = name.Value
	walletSelect(walletsCurrent.Index);
}

async function walletEosCreateAccount() {
	if (!walletsCurrent.Options.Testnet) {

		if (await modalYesNo('Cancel', 'OK', 'EOS Create account',
							 'The way EOS works is that new accounts can only be created by someone with an existing account. ' + 
							 'You\'ll be redirected to an external service where you will:<br><br>' + 
							 '1. Select and enter new account name.<br>' + 
							 '2. Input public keys (public key already copied to clipboard).<br>' + 
							 '3. Make a payment to purchases EOS resources.<br><br>' +
							 'Press OK to continue.')) {

			walletCopyPubKey();
			openExternalUrl('https://eos-account-creator.com');
		}
	} else {
		walletCopyPubKey();
		openExternalUrl('https://monitor.jungletestnet.io/#account');
	}
}
//-------------------------------------  EOS EOS  -------------------------------------------------------------------------



//-------------------------------------  Ethereum ETH  --------------------------------------------------------------------
async function walletSendETH(wallet) {

	let sendAddr = $('#wallet_send_addr').val().trim(); 
	let gasPriceStr = $('#wallet_send_fee').val().replace(',', '.').trim();
	let gasLimitStr = $('#wallet_gas_limit').val().replace(',', '.').trim();
	let sendAmountStr = $('#wallet_send_amount_btc').val().replace(',', '.').trim();
	let fractions = walletGetEthCoinParameters(wallet.Type, wallet.Options.Testnet).fractions;

	let addrValid = ethereumIsAddressValid(sendAddr);	

	let gasLimit = bigNum(gasLimitStr);
	let gasPrice = bigNumMult(gasPriceStr, walletGetEthGasPriceFractions());
	let sendFee = bigNumMult(gasPrice, gasLimit);

	let balance = bigNumMult(walletBalance, fractions);
	let sendAmount = bigNumMult(sendAmountStr, fractions);
	let sendTotal = bigNumAdd(sendAmount, sendFee);

	if (!addrValid) {
		infoShow('Error', 'Invalid send address', 'error', 5000);
		return;
	}

	if (sendAmount == 0) {
		infoShow('Error', 'Invalid send amount', 'error', 5000);
		return;
	}

	if (gasPrice == 0) {
		infoShow('Error', 'Invalid Gas Price value', 'error', 5000);
		return;
	}

	if (gasLimit == 0) {
		infoShow('Error', 'Invalid Gas Limit value', 'error', 5000);
		return;
	}

	if (sendFee == 0) {
		infoShow('Error', 'Invalid transaction price', 'error', 5000);
		return;
	}

	if (balance.lessThan(sendTotal)) {
		infoShow('Error', 'Wallet balance is to low', 'error', 5000);
		return;
	}

	if (addrValid < 2) {
		infoShow('Attention!!!', 'We can\'t verify receiver address. Make sure that you copy/paste or type it correctly', 'warning', 10000)
	}

	balance = bigNumSub(balance, sendTotal);
	await modalTransactionShow(wallet.Addr, sendAddr, sendAmountStr, bigNumToStr(bigNumDiv(sendFee, fractions)), bigNumToStr(bigNumDiv(balance, fractions)), ' ETH', 'Getting wallet data, please wait');
	let tx = await ethereumGenerateTransaction(wallet.Addr, sendAddr, bigNumToHex(sendAmount), bigNumToHex(gasPrice), bigNumToHex(gasLimit), wallet.Options.Testnet, 5000);

	if (!tx) {
		modalTransactionHide();
		infoShow('Error', 'Can\'t get wallet data', 'error', 5000);
		return;
	}

	modalTransactionSetStatus('Please press random buttons on device', tx, false, false);
	await randomInit();
	modalTransactionSetStatus('Press OK button on device to confirm operation', tx, false, false);

	let ret = await hidSignTransaction(wallet.Index, ethereumSerializeTransaction(tx), 'SECP256K1', 1, 1, 0, 70000);
	if (ret.Error) {
		modalTransactionHide();
		infoShow('Error', ret.Error, 'error', 5000);
		return;
	}

	if (ret.Signature.length != 130) {
		modalTransactionHide();
		infoShow('Error', 'Transaction signature error', 'error', 5000);
		return;
	}

	tx = ethereumEncodeTxFinal(tx, ret.Signature, wallet.Options.Testnet);
	tx = ethereumSerializeTransaction(tx);
	modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain', tx, true, true);

	if (await modalTransactionWaitConfirm()) {
		ret = await ethereumPushTx(tx, wallet.Options.Testnet, 10000);

		if (ret === true) {
			infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
		} else {
			infoShow('Error', ret, 'error', 5000);
		}
	}

	modalTransactionHide();
}
//-------------------------------------  Ethereum ETH  --------------------------------------------------------------------



//-------------------------------------  Wallet  All  ---------------------------------------------------------------------
async function walletSend() {
	if (!hidIsBusy()) {

		switch (walletsCurrent.Type) {

			case 'XRP':
				await walletSendXRP(walletsCurrent);
				break;

			case 'ETH':
				await walletSendETH(walletsCurrent);
				break

			case 'BCH':
				await walletSendBCH(walletsCurrent);
				break

			case 'EOS':
				await walletSendEOS(walletsCurrent);
				break;

			default:
				await walletSendBTC(walletsCurrent);
				break;
		}
	}
}

function walletShowCoinSpecificBalance(balance, coin) {

	switch (coin) {
		case 'EOS':
			$('#wallet_eos_cpu_staked_self').text('0');
			$('#wallet_eos_net_staked_self').text('0');
			if (balance.hasOwnProperty('self_delegated_bandwidth') && balance.self_delegated_bandwidth) {
				if (balance.self_delegated_bandwidth.hasOwnProperty('cpu_weight')) {
					$('#wallet_eos_cpu_staked_self').text(balance.self_delegated_bandwidth.cpu_weight);
				}
				if (balance.self_delegated_bandwidth.hasOwnProperty('net_weight')) {
					$('#wallet_eos_net_staked_self').text(balance.self_delegated_bandwidth.net_weight);
				}
			}

			$('#wallet_eos_cpu_staked_total').text('0');
			$('#wallet_eos_net_staked_total').text('0');
			if (balance.hasOwnProperty('total_resources') && balance.total_resources) {
				if (balance.total_resources.hasOwnProperty('cpu_weight')) {
					$('#wallet_eos_cpu_staked_total').text(balance.total_resources.cpu_weight);
				}
				if (balance.total_resources.hasOwnProperty('net_weight')) {
					$('#wallet_eos_net_staked_total').text(balance.total_resources.net_weight);
				}
			}

			$('#wallet_eos_cpu_used').text('0');
			$('#wallet_eos_cpu_used_p').text('');
			$('#wallet_eos_progress_cpu').css('width', '0%').attr('aria-valuenow', '0');
			if (balance.hasOwnProperty('cpu_limit')) {
				let p = (balance.cpu_limit.used / balance.cpu_limit.max) * 100;

				$('#wallet_eos_cpu_used_p').text(p.toFixed(0) + '%');
				$('#wallet_eos_cpu_used').text(balance.cpu_limit.used + ' / ' + balance.cpu_limit.max + ' ms');
				$('#wallet_eos_progress_cpu').css('width', p.toFixed(0) + '%').attr('aria-valuenow', p.toFixed(0));
			}

			$('#wallet_eos_net_used').text('0');
			$('#wallet_eos_net_used_p').text('');
			$('#wallet_eos_progress_net').css('width', '0%').attr('aria-valuenow', '0');
			if (balance.hasOwnProperty('net_limit')) {
				let p = (balance.net_limit.used / balance.net_limit.max) * 100;

				$('#wallet_eos_net_used_p').text(p.toFixed(0) + '%');
				$('#wallet_eos_net_used').text(balance.net_limit.used + ' / ' + balance.net_limit.max + ' Bytes');
				$('#wallet_eos_progress_net').css('width', p.toFixed(0) + '%').attr('aria-valuenow', p.toFixed(0));
			}

			$('#wallet_eos_ram_used').text('0');
			$('#wallet_eos_ram_used_p').text('');
			$('#wallet_eos_progress_ram').css('width', '0%').attr('aria-valuenow', '0');
			if (balance.hasOwnProperty('ram_quota') && balance.hasOwnProperty('ram_usage')) {
				let p = (balance.ram_usage / balance.ram_quota) * 100;

				$('#wallet_eos_ram_used_p').text(p.toFixed(0) + '%');
				$('#wallet_eos_ram_used').text(balance.ram_usage + ' / ' + balance.ram_quota + ' Bytes');
				$('#wallet_eos_progress_ram').css('width', p.toFixed(0) + '%').attr('aria-valuenow', p.toFixed(0));
			}

			$('#wallet_eos_cpu_refunding').text('0');
			if (balance.hasOwnProperty('refund_request') && balance.refund_request && balance.refund_request.hasOwnProperty('cpu_amount')) {
				$('#wallet_eos_cpu_refunding').text(balance.refund_request.cpu_amount);
			}

			$('#wallet_eos_net_refunding').text('0');
			if (balance.hasOwnProperty('refund_request') && balance.refund_request && balance.refund_request.hasOwnProperty('net_amount')) {
				$('#wallet_eos_net_refunding').text(balance.refund_request.net_amount);
			}
		break;
	}
}

function walletParseBalance(balance, coin, addr, testnet, divider) {

	if (typeof(balance) === 'object') {

		if (balance.hasOwnProperty('balance')) {
			walletBalance = bigNumDiv(balance.balance, divider);
		}
		walletShowCoinSpecificBalance(balance, coin);
	} else {
		walletBalance = bigNumDiv(balance, divider);
		walletShowCoinSpecificBalance(false, coin);
	}

	$('#wallet_balance').text(bigNumToStr(walletBalance, 18) + ' ' + coin);
}


async function walletGetBalance(coin, addr, testnet, divider) {
	walletBalance = 0;

	$.get(coinApiAddrBalance, {coin: coin, addr: addr, testnet: testnet, confirmations: 1, rnd: rnd()}).then((ret) => {
		walletParseBalance(ret, coin, addr, testnet, divider);
	}).catch(() => null);
}

async function walletGetFee(coin, testnet, divider) {
	$('#wallet_send_fee').val('');

	$.get(coinApiAddrFee, {coin: coin, testnet: testnet, rnd: rnd()}).then((ret) => {
		ret = bigNumDiv(ret, divider);
		if (+ret != 0) {
			$('#wallet_send_fee').val(bigNumToStr(ret, 8));
		}
	}).catch(() => null);
}

async function walletGetExchangeRate(coin) {

	$('#wallet_send_amount_btc')
		.val('')
		.unbind('input')
		.attr('placeholder', 'Enter ' + coin +  ' amount');

	$('#wallet_send_amount_usd')
		.val('')
		.unbind('input')
		.attr('placeholder', 'Enter USD amount');

	$.get(coinApiAddrRate, {coin: coin, rnd: rnd()}).then((ret) => {

		ret = bigNum(ret);

		if (+ret != 0) {

			$('#wallet_send_amount_btc').unbind('input').on('input', () => {

				let amount = bigNum($('#wallet_send_amount_btc').val().replace(',', '.').trim());

				if (+amount == 0) {
					$('#wallet_send_amount_usd').val('');
				} else {
					$('#wallet_send_amount_usd').val(bigNumToStr(bigNumMult(amount, ret), 5));
				}
			});

			$('#wallet_send_amount_usd').unbind('input').on('input', () => {

				let amount = bigNum($('#wallet_send_amount_usd').val().replace(',', '.').trim());

				if (+amount == 0) {
					$('#wallet_send_amount_btc').val('');
				} else {
					$('#wallet_send_amount_btc').val(bigNumToStr(bigNumDiv(amount, ret), 8));
				}
			});
		}
	}).catch(() => null);
}

async function walletSelect(index) {
	if (index && walletsList && (walletsList.Wallets.length >= index)) {

		let params;
		let feeFractions;

		walletsCurrent = walletsList.Wallets[index - 1];
		$('#wallet_name').text(walletsCurrent.Name);
		$('#wallet_addr').text(walletsCurrent.Addr);

		$('#wallet_balance').text('...');
		$('#wallet_send_addr').val('');

		$('#wallet_alert').hide();
		$('#wallet_eos_specific').hide();
		$('#wallet_eth_specific').hide();
		$('#wallet_send_fee').prop("disabled", (walletsCurrent.Type === 'EOS'));

		switch (walletsCurrent.Type) {
			case 'XRP':
				params = walletGetXrpCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
				feeFractions = params.fractions;
				break;

			case 'ETH':
				params = walletGetEthCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
				feeFractions = walletGetEthGasPriceFractions();

				$('#wallet_gas_limit').val(params.gasLimit);
				$('#wallet_eth_specific').show();
				break;

			case 'EOS':
				params = walletGetEosCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
				feeFractions = params.fractions;

				if (!walletsCurrent.Addr) {
					$('#wallet_alert').show();
				} else {
					$('#wallet_eos_specific').show();
				}

				$('#wallet_key_pub').text(walletsCurrent.PubKey);
				$('#wallet_eos_pubkey').text(walletsCurrent.PubKey);
				break;

			default:
				params = walletGetBtcCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
				feeFractions = params.fractions;
				break;
		}

		walletGetBalance(walletsCurrent.Type, walletsCurrent.Addr, walletsCurrent.Options.Testnet, params.fractions);
		walletGetFee(walletsCurrent.Type, walletsCurrent.Options.Testnet, feeFractions);

		$('#wallet_send_fee_type').text(params.feeType);
		$('#wallet_send_fee_name').text(params.feeName);
		$('#wallet_send_coin_type').text(params.ticker);
		$('#wallet_send_fee').val(Number((params.fee).toFixed(10)));

		$('#wallet_type').text(params.name);
		$('#wallet_img').attr('src', 'img/' + params.img);

		walletShowQR(walletsCurrent.Addr);
		walletGetExchangeRate(walletsCurrent.Type);

		$('#section_wallet_key').hide();	
		uiShowSection('wallets');
		
	} else {
		generalSelect();
	}
}


async function walletAdd() {
	if (!hidIsBusy()) {

		let ret = await modalAddWallet();

		if (ret) {

			ret.Name = ret.Name.trim();

			if (walletIsExist(ret.Name)) {
				infoShow('Error', `Wallet name ${ret.Name} already exist`, 'error', 2000);
				return;
			}

			if (ret.Options.Rnd) {
				await randomInit();
			}

			ret = await hidAddWallet(ret.Name, ret.Type, ret.Key.trim(), ret.Options, 2000);

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
				return;
			}

			if (ret.Command === 'AddWallet') {

				infoShow('Success', 'Wallet added', 'success', 2000);

				await loadStatus();
				await loadWallets();
				generalUpdateInfo();
				await walletSelect(walletsList.Wallets.length);

				if (await modalYesNo('Cancel', 'Yes', 'Attention!!!', 'New wallet added. Please press "Yes" to make device backup copy.')) {
					await settingsBackup();
				}
			}
		}
	}
}

async function walletDelete() {
	if (!hidIsBusy()) {

		let index = walletsCurrent.Index;

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidDeleteWallet(index, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
			return;
		}

		if (ret.Command === 'DelWallet') {

			infoShow('Success', 'Wallet deleted', 'success', 2000);

			storageClear(walletsCurrent.Name);
			await loadStatus();
			await loadWallets();
			generalUpdateInfo();

			if (walletsList.Wallets.length) {
				if (walletsList.Wallets.length > (index - 1)) {
					walletSelect(index);
				} else {
					walletSelect(index - 1);
				}			
			} else {
				generalSelect();
			}
		}
	}
}

async function walletShowData() {
	if (!hidIsBusy()) {

		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let wallet = await hidGetWalletData(walletsCurrent.Index, 40000);
		infoHide();

		if (wallet.Error) {
			infoShow('Error', wallet.Error, 'error', 5000);
			return;
		}

		$('#wallet_key_pub_name').hide();
		$('#wallet_key_hex_name').hide();
		$('#wallet_key_wif_name').hide();
		$('#wallet_key_seed_name').hide();
		$('#wallet_key_secret_name').hide();

		if (wallet.Command === 'GetWalletData') {

			if (wallet.hasOwnProperty('WIF') && wallet.WIF && wallet.Type !== 'ETH') {
				$('#wallet_key_wif').text(wallet.WIF);
				$('#wallet_key_wif_name').show();
			}

			if (wallet.hasOwnProperty('Key') && wallet.Key) {
				$('#wallet_key_hex').text(wallet.Key);
				$('#wallet_key_hex_name').show();
			}

			if (wallet.hasOwnProperty('Seed') && wallet.Seed) {
				$('#wallet_key_seed').text(wallet.Seed);
				$('#wallet_key_seed_name').show();
			}

			if (wallet.hasOwnProperty('Secret') && wallet.Secret) {
				$('#wallet_key_secret').text(wallet.Secret);
				$('#wallet_key_secret_name').show();
			}

			if (wallet.Type === 'EOS') {
				$('#wallet_key_pub').text(wallet.Addr);
				$('#wallet_key_pub_name').show();
			}

			$('#section_wallet_key').show();
		}
	}
}
//-------------------------------------  Wallet  All  ---------------------------------------------------------------------



//-------------------------------------  Wallet  Utills  ------------------------------------------------------------------
function walletBlockExplorer() {
	let params;

	switch (walletsCurrent.Type) {
		case 'XRP':
			params = walletGetXrpCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
			break;

		case 'ETH':
			params = walletGetEthCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
			break;

		case 'EOS':
			params = walletGetEosCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
			break;

		default:
			params = walletGetBtcCoinParameters(walletsCurrent.Type, walletsCurrent.Options.Testnet);
			break;
	}

	openExternalUrl(params.explorer + walletsCurrent.Addr);
}

function walletCopyWif() {
	clipboard.writeText($('#wallet_key_wif').text());
	infoShow('', 'Key copied to clipboard', 'success', 5000);
}

function walletCopySecret() {
	clipboard.writeText($('#wallet_key_secret').text());
	infoShow('', 'Key copied to clipboard', 'success', 5000);
}

function walletCopyHex() {
	clipboard.writeText($('#wallet_key_hex').text());
	infoShow('', 'HEX key copied to clipboard', 'success', 5000);
}

function walletCopySeed() {
	clipboard.writeText($('#wallet_key_seed').text());
	infoShow('', 'SEED key copied to clipboard', 'success', 5000);
}

function walletCopyAddr() {
	clipboard.writeText(walletsCurrent.Addr);
	infoShow('', 'Wallet address copied to clipboard', 'success', 5000);
}

function walletCopyPubKey() {
	clipboard.writeText($('#wallet_key_pub').text());
	infoShow('', 'Wallet public key copied to clipboard', 'success', 5000);
}

function walletCopyBalance() {
	clipboard.writeText($('#wallet_balance').text());
	infoShow('', 'Wallet balance copied to clipboard', 'success', 5000);
}

function walletIsExist(name) {

	for (let i = 0; i < walletsList.Wallets.length; i++) {
		if (name.toUpperCase() === walletsList.Wallets[i].Name.toUpperCase()) {
			return true;
		}
	}

	return false;
}

function walletShowQR(addr) {
	let q = qr.svgObject(addr, { type: 'svg' });

	$('#wallet_qr').attr('d', q.path);
	$('#wallet_viewbox').attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
}
//-------------------------------------  Wallet  Utills  ------------------------------------------------------------------
