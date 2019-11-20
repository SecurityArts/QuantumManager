"use strict";


let wallets = false;
let walletIndex = 0;
let walletBalance = 0;


async function loadWallets() {
	
	$('#listWallets').html('');
	wallets = await hidGetWallets(2000);

	if (wallets) {
		for (let i = 0; i < wallets.Wallets.length; i++) {
			$('#listWallets').append(`<li><a href="#" onclick="walletSelect(${i + 1})">${wallets.Wallets[i].Name}</a></li>`);
		}
			
		if (wallets.Wallets.length < wallets.Max) {
			$('#listWallets').append(`<li><a href="#" onclick="walletAdd()">+ add wallet</a></li>`);
		}
	}
}


async function walletSendBtc() {
	let addr = $('#wallet_send_addr').val().trim(); 
	let feeRate = parseInt($('#wallet_send_fee').val());
	let amount = Number($('#wallet_send_amount_btc').val().replace(',', '.'));
									
	let type = wallets.Wallets[walletIndex - 1].Type;
	let testnet = (wallets.Wallets[walletIndex - 1].Options.Testnet === true);
	let net = walletGetNetType(type, testnet);
	let params = walletGetCoinParameters(type, testnet);
									
	if (bitcoinValidateAddr(addr, net)) {
		if (amount && !isNaN(amount)) {
			if (feeRate && !isNaN(feeRate)) {
				
				let utxo = await bitcoinGetUnspentOutputs(type, wallets.Wallets[walletIndex - 1].Addr, testnet, 5000);
				
				if (utxo) {
					let targets = [{address: addr, value: + (amount * 100000000)}];
					let {inputs, outputs} = coinSelect(utxo, targets, feeRate);
				
					if (inputs && outputs) {
						let fee;
						let total_in = 0;
						let total_out = 0;
						let signatures = [];
						let tx = new bitcoin.TransactionBuilder(net);

						tx.setVersion(1);													
						inputs.forEach(input => {
							total_in += input.value;
							tx.addInput(input.txId, input.vout);
						});
														
						outputs.forEach(output => {
							total_out += output.value;
							if (!output.address) output.address = wallets.Wallets[walletIndex - 1].Addr;
							tx.addOutput(output.address, output.value);
						});
									
						tx = tx.buildIncomplete();
						fee = (total_in - total_out) / 100000000;

						await randomInit();						
						await modalTransactionShow(wallets.Wallets[walletIndex - 1].Addr, addr, amount, fee, (walletBalance - amount - fee).toFixed(8), ` ${params.ticker}`, 'Press OK button on device to confirm operation');
						
						for (let i = 0; i < tx.ins.length; i++) {
							for (let j = 0; j < tx.ins.length; j++) {
								tx.ins[j].script = bitcoin.script.compile([]);
							}

							tx.ins[i].script = bitcoin.script.compile(hexStringToArray(inputs[i].script));
															
							modalTransactionSetStatus('Signing...');
							let ret = await hidSignTransaction(walletIndex, tx.toHex() + '01000000', 'SECP256K1', i + 1, tx.ins.length, 100000);
							
							if (ret.Error) {
								infoShow('Error', ret.Error, 'error', 5000);
								break;
							} else {
								signatures.push(ret.Signature.slice(2));
							}
						}
															
						if (signatures.length === tx.ins.length) {
							for (let i = 0; i < tx.ins.length; i++){
								tx.ins[i].script = bitcoin.script.compile(hexStringToArray(signatures[i]));
							}
													
							tx = tx.toHex();
							modalTransactionSetTx(tx);
							modalTransactionEnable();
							modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain');
							
							if (await modalTransactionWaitConfirm()) {
								let ret = await bitcoinPushTx(type, tx, testnet, 5000);

								if (ret === true) {
									infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
								} else {
									infoShow('Error', ret, 'error', 5000);
								}
							}
						}
						
						modalTransactionHide();
					} else infoShow('Error', 'Not enough of money to send', 'error', 5000);
				} else infoShow('Error', 'Not enough of money to send', 'error', 5000);
			} else infoShow('Error', 'Invalid fee value', 'error', 5000);
		} else infoShow('Error', 'Invalid send amount', 'error', 5000);
	} else infoShow('Error', 'Invalid send address', 'error', 5000);
}


async function walletSendXrp() {
	let addr = $('#wallet_send_addr').val().trim(); 
	let fee = (Number($('#wallet_send_fee').val().replace(',', '.')) * 1000000).toFixed(0);
	let amount = (Number($('#wallet_send_amount_btc').val().replace(',', '.')) * 1000000).toFixed(0);
	let testnet = (wallets.Wallets[walletIndex - 1].Options.Testnet === true);
									
	if (rippleIsAddressValid(addr, testnet)) {
		if (amount && !isNaN(amount)) {
			if (fee && !isNaN(fee)) {
				
				let ret = await hidGetWalletPubKey(walletIndex, 2000);
				if (ret.PubKey) {
					
					await modalTransactionShow(wallets.Wallets[walletIndex - 1].Addr, addr, amount / 1000000, fee / 1000000, (walletBalance - amount - fee) / 1000000, ' XRP', 'Getting wallet data, please wait');
					let tx = await rippleGenerateTransaction(wallets.Wallets[walletIndex - 1].Addr, addr, ret.PubKey, amount, fee, testnet, 40, 5000);
					
					infoHide();
					if (tx) {
						
						modalTransactionSetStatus('Please press random buttons on device');
						await randomInit();
						modalTransactionSetStatus('Press OK button on device to confirm operation');
						
						ret = await hidSignTransaction(walletIndex, rippleEncodeTxForSigning(tx), 'SECP256K1', 1, 1, 70000);
						if (ret.Signature) {
							tx.TxnSignature = ret.Signature;
							tx = rippleEncodeTxFinal(tx);
							
							modalTransactionSetTx(tx);
							modalTransactionEnable();
							modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain');
							
							if (await modalTransactionWaitConfirm()) {
								ret = await ripplePushTx(tx, testnet, 10000);
								
								if (ret === true) {
									infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
								} else {
									infoShow('Error', ret, 'error', 5000);
								}
							}
						} else infoShow('Error', ret.Error, 'error', 5000);
					} else infoShow('Error', 'Can\'t get wallet data', 'error', 5000);
					modalTransactionHide();
					
				} else infoShow('Error', ret.Error, 'error', 5000);
			} else infoShow('Error', 'Invalid fee value', 'error', 5000);
		} else infoShow('Error', 'Invalid send amount', 'error', 5000);
	} else infoShow('Error', 'Invalid send address', 'error', 5000);
}


async function walletSendEth() {
	let addr = $('#wallet_send_addr').val().trim(); 
	let gasPrice = $('#wallet_send_fee').val().replace(',', '.').trim();
	let gasLimit = $('#wallet_gas_limit').val().replace(',', '.').trim();
	let amount = $('#wallet_send_amount_btc').val().replace(',', '.').trim();
	let balance = $('#wallet_balance').text().replace(',', '.').trim().split(' ', 2).slice(0,1).toString();
	let testnet = (wallets.Wallets[walletIndex - 1].Options.Testnet === true);
	let addrValid = ethereumIsAddressValid(addr);
	
	
	if (addrValid) {
		
		amount = ethereumAmount(amount);
		balance = ethereumAmount(balance);
		gasPrice = ethereumGasPrice(gasPrice);
		gasLimit = ethereumFormatGasLimit(gasLimit);
		let fee = ethereumFee(gasPrice, gasLimit);
		let feeStr = ethereumFormatAmount(fee);
		let amountStr = ethereumFormatAmount(amount);
				
		if (amount) {
			if (gasPrice) {
				if (gasLimit) {
					if (fee) {
						if ((fee + amount) <= balance) {
							
							let remainderStr = ethereumFormatAmount(balance - (fee + amount));
							await modalTransactionShow(wallets.Wallets[walletIndex - 1].Addr, addr, amountStr, feeStr, remainderStr, ' ETH', 'Getting wallet data, please wait');
							let tx = await ethereumGenerateTransaction(wallets.Wallets[walletIndex - 1].Addr, addr, amount, gasPrice, gasLimit, testnet, 5000);
							infoHide();
							
							if (addrValid < 2) {
								infoShow('Attention!!!', 'We can\'t verify receiver address. Make sure that you copy/paste or type it correctly', 'warning', 10000)
							}						
							
							if (tx) {
								
								modalTransactionSetStatus('Please press random buttons on device');
								await randomInit();
								modalTransactionSetStatus('Press OK button on device to confirm operation');
								
								let ret = await hidSignTransaction(walletIndex, ethereumSerializeTransaction(tx), 'SECP256K1', 1, 1, 70000);
								if (ret.Signature) {
									if (ret.Signature.length == 130) {
										tx = ethereumEncodeTxFinal(tx, ret.Signature, testnet);
										tx = ethereumSerializeTransaction(tx);
										
										modalTransactionSetTx(tx);
										modalTransactionEnable();
										modalTransactionSetStatus('Transaction signed. Press Broadcast to send to blockchain');
										
										if (await modalTransactionWaitConfirm()) {
											ret = await ethereumPushTx(tx, testnet, 10000);
											
											if (ret === true) {
												infoShow('Success', 'Transaction broadcasted OK', 'success', 5000);
											} else {
												infoShow('Error', ret, 'error', 5000);
											}
										}
									} else infoShow('Error', 'Transaction signature error', 'error', 5000);
								} else infoShow('Error', ret.Error, 'error', 5000);
							} else infoShow('Error', 'Can\'t get wallet data', 'error', 5000);
							modalTransactionHide();
							
						} else infoShow('Error', 'Wallet balance is to low', 'error', 5000);
					} else infoShow('Error', 'Invalid transaction price', 'error', 5000);
				} else infoShow('Error', 'Invalid Gas Limit value', 'error', 5000);
			} else infoShow('Error', 'Invalid Gas Price value', 'error', 5000);
		} else infoShow('Error', 'Invalid send amount', 'error', 5000);
	} else infoShow('Error', 'Invalid send address', 'error', 5000);
}


async function walletSend() {
	if (!hidIsBusy()) {
		switch (wallets.Wallets[walletIndex - 1].Type) {
			case 'XRP':
				await walletSendXrp();
				break;
			case 'ETH':
				await walletSendEth();
				break
			default:
				await walletSendBtc();
				break;
		}
	}
}


function walletShowQR(addr) {
	let q = qr.svgObject(addr, { type: 'svg' });
	$('#wallet_qr').attr('d', q.path);
	$('#wallet_viewbox').attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
}

function walletSelectXRP(index) {
	if (index && wallets && (wallets.Wallets.length >= index)) {
		
		let coinToUsdRate = 0;
		let name = wallets.Wallets[index - 1].Name;
		let addr = wallets.Wallets[index - 1].Addr;
		let type = wallets.Wallets[index - 1].Type;
		let testnet = (wallets.Wallets[index - 1].Options.Testnet === true);
		let params = walletGetXrpCoinParameters(type, testnet);
										
		walletIndex = index;
		walletShowQR(addr);
		
		$('#wallet_balance').text('...');
		$('#wallet_name').text(name);
		$('#wallet_type').text(params.name);
		$('#wallet_addr').text(addr);
		$('#wallet_img').attr('src', 'img/' + params.img);
		$('#wallet_gas_limit_div').hide();
														
		$.get(rippleApiAddrBalance, {coin: type, addr: addr, testnet: testnet, confirmations: 1, rnd: rnd()}).then((ret) => {
			ret = Number(ret);

			if (isNaN(ret)) {
				ret = 0
			}

			walletBalance = ret;
			$('#wallet_balance').text((ret / 1000000) + ' XRP');
		});
		
		$('#wallet_send_fee').val('');
		$.get(rippleApiAddrFee, {coin: type, testnet: testnet, rnd: rnd()}).then((ret) => {
			ret = Number(ret);
			
			if (isNaN(ret)) {
				ret = 0;
			}
			
			$('#wallet_send_fee').val(Number((ret / 1000000).toFixed(10)));
		});
										
		coinToUsdRate = 0;
		$.get(rippleApiAddrRate, {coin: type, rnd: rnd()}).then((ret) => {
			ret = Number(ret);
			
			if (ret && !isNaN(ret)) {
				coinToUsdRate = ret;
			}
		});
										
		$('#wallet_send_fee').val(Number((params.fee).toFixed(10)));
		$('#wallet_send_addr').val('');
		$('#wallet_send_fee_name').text(params.feeName);
		$('#wallet_send_fee_type').text(params.feeType);
		$('#wallet_send_coin_type').text(params.ticker);
		
		$('#wallet_send_amount_btc')
			.val('')
			.attr('placeholder', 'Enter XRP amount')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_btc').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$('#wallet_send_amount_usd').val(Number((amount * coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_usd').val('');
					}
				}
			});
										
		$('#wallet_send_amount_usd')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_usd').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$('#wallet_send_amount_btc').val(Number((amount / coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_btc').val('');
					}
				}
			});
										
		$('#section_wallet_key').hide();
		uiShowSection('wallets');
	} else {
		generalSelect();
	}
}


function walletSelectBTC(index) {
	if (index && wallets && (wallets.Wallets.length >= index)) {
		
		let coinToUsdRate = 0;
		let name = wallets.Wallets[index - 1].Name;
		let addr = wallets.Wallets[index - 1].Addr;
		let type = wallets.Wallets[index - 1].Type;
		let testnet = wallets.Wallets[index - 1].Options.Testnet === true;
		let params = walletGetCoinParameters(type, testnet);
										
		walletIndex = index;
		walletShowQR(addr);
		
		$('#wallet_balance').text('...');
		$('#wallet_name').text(name);
		$('#wallet_type').text(params.name);
		$('#wallet_addr').text(addr);
		$('#wallet_img').attr('src', 'img/' + params.img);
		$('#wallet_gas_limit_div').hide();
		
		$.get(bitcoinApiAddrBalance, {coin: type, addr: addr, testnet: testnet, confirmations: 1, rnd: rnd()}).then((ret) => {
			ret = Number(ret);

			if (isNaN(ret)) {
				ret = 0;
			}
			walletBalance = ret / 100000000;
			$('#wallet_balance').text((ret / 100000000) + ' ' + params.ticker);
		});
										
		coinToUsdRate = 0;
		$.get(bitcoinApiAddrRate, {coin: type, rnd: rnd()}).then((ret) => {
			ret = Number(ret);
			
			if (ret && !isNaN(ret)) {
				coinToUsdRate = ret;
			}
		});
										
		$('#wallet_send_fee').val(Number((params.fee).toFixed(10)));
		$('#wallet_send_addr').val('');
		$('#wallet_send_fee_name').text(params.feeName);
		$('#wallet_send_fee_type').text(params.feeType);
		$('#wallet_send_coin_type').text(params.ticker);

		$('#wallet_send_amount_btc')
			.val('')
			.attr('placeholder', 'Enter ' + params.ticker + ' amount')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_btc').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount))	{
						$('#wallet_send_amount_usd').val(Number((amount * coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_usd').val('');
					}
				}
			});

		$('#wallet_send_amount_usd')
			.val('')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_usd').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$('#wallet_send_amount_btc').val(Number((amount / coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_btc').val('');
					}
				}
		});
										
		$('#section_wallet_key').hide();
		uiShowSection('wallets');
	} else {
		generalSelect();
	}
}


function walletSelectETH(index) {
	if (index && wallets && (wallets.Wallets.length >= index)) {

		let coinToUsdRate = 0;
		let name = wallets.Wallets[index - 1].Name;
		let addr = wallets.Wallets[index - 1].Addr;
		let type = wallets.Wallets[index - 1].Type;
		let testnet = wallets.Wallets[index - 1].Options.Testnet === true;
		let params = walletGetEthCoinParameters(type, testnet);
										
		walletIndex = index;
		walletShowQR(addr);
		
		$('#wallet_balance').text('...');
		$('#wallet_name').text(name);
		$('#wallet_type').text(params.name);
		$('#wallet_addr').text(addr);
		$('#wallet_img').attr('src', 'img/' + params.img);
		$('#wallet_gas_limit_div').show();
		$('#wallet_gas_limit').val(params.gasLimit);
		
		$.get(ethereumApiAddrBalance, {coin: type, addr: addr, testnet: testnet, confirmations: 1, rnd: rnd()}).then((ret) => {
			ret = Number(ret);

			if (isNaN(ret)) {
				ret = 0;
			}
			
			walletBalance = ret / 1000000000000000000;
			$('#wallet_balance').text((ret / 1000000000000000000) + ' ' + params.ticker);
		});
		
		$('#wallet_send_fee').val('');
		$.get(ethereumApiAddrFee, {coin: type, testnet: testnet, rnd: rnd()}).then((ret) => {
			ret = Number(ret);
			if (isNaN(ret)) {
				ret = 0;
			}
			$('#wallet_send_fee').val(Number((ret / 1000000000).toFixed(10)));
		});
		
		coinToUsdRate = 0;
		$.get(ethereumApiAddrRate, {coin: type, rnd: rnd()}).then((ret) => {
			ret = Number(ret);
			if (ret && !isNaN(ret)) {
				coinToUsdRate = ret;
			}
		});
										
		$('#wallet_send_fee').val(Number((params.fee).toFixed(10)));
		$('#wallet_send_addr').val('');
		$('#wallet_send_fee_type').text(params.feeType);
		$('#wallet_send_fee_name').text(params.feeName);
		$('#wallet_send_coin_type').text(params.ticker);

		$('#wallet_send_amount_btc')
			.val('')
			.attr('placeholder', 'Enter ' + params.ticker + ' amount')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_btc').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount))	{
						$('#wallet_send_amount_usd').val(Number((amount * coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_usd').val('');
					}
				}
			});

		$('#wallet_send_amount_usd')
			.val('')
			.unbind('input')
			.on('input', () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_usd').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$('#wallet_send_amount_btc').val(Number((amount / coinToUsdRate)).toFixed(5));
					} else {
						$('#wallet_send_amount_btc').val('');
					}
				}
		});
										
		$('#section_wallet_key').hide();
		uiShowSection('wallets');
	} else {
		generalSelect();
	}
}


function walletSelect(index) {
	if (index && wallets && (wallets.Wallets.length >= index)) {
		
		switch (wallets.Wallets[index - 1].Type) {
			case 'XRP':
				walletSelectXRP(index);
				break;
				
			case 'ETH':
				walletSelectETH(index);
				break;
			
			default:
				walletSelectBTC(index);
				break;
		}
	}
}

function walletIsExist(name) {
	
	for (let i = 0; i < wallets.Wallets.length; i++) {
		if (name.toUpperCase() === wallets.Wallets[i].Name.toUpperCase()) {
			return true;
		}
	}
	
	return false;
}

async function walletAdd() {
	if (!hidIsBusy()) {
		let ret = await modalAddWallet();

		if (ret) {
			
			ret.Name = ret.Name.trim();
			
			if (!walletIsExist(ret.Name)) {
				
				if (ret.Options.Rnd) {
					await randomInit();
				}
				
				ret = await hidAddWallet(ret.Name, ret.Type, ret.Key.trim(), ret.Options, 2000);
				
				if (ret.Error) {
					infoShow('Error', ret.Error, 'error', 5000);
				} else {
					infoShow('Success', 'Wallet added', 'success', 2000);
					
					await loadStatus();
					await loadWallets();
					
					generalUpdateInfo();
					walletSelect(wallets.Wallets.length);
					
					if (await modalYesNo('Cancel', 'Yes', 'Attention!!!', 'New wallet added. Please press "Yes" to make device backup copy.')) {
						await settingsBackup();
					}
				}
			} else {
				infoShow('Error', `Wallet name ${ret.Name} already exist`, 'error', 2000);
			}
		}
	}
}

async function walletDelete() {
	if (!hidIsBusy()) {
		
		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidDeleteWallet(walletIndex, 40000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Wallet deleted', 'success', 2000);
			
			await loadStatus();
			await loadWallets();
			generalUpdateInfo();
			
			if (wallets.Wallets.length) {
				if (wallets.Wallets.length > (walletIndex - 1)) {
					walletSelect(walletIndex);
				} else {
					walletSelect(walletIndex - 1);
				}			
			} else {
				generalSelect();
			}
		}
	}
}

async function walletShowData() {
	if (!hidIsBusy()) {
		if (walletIndex) {
			
			let type = wallets.Wallets[walletIndex - 1].Type;
			
			infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
			let wallet = await hidGetWalletData(walletIndex, 40000);
			infoHide();
											
			$('#wallet_key_wif').show();
			$('#wallet_key_wif_name').show();
			$('#wallet_key_hex_name').show();
			$('#wallet_key_seed_name').show();

			if (wallet.Command === 'GetWalletData') {
				switch (type) {
					case 'XRP':
						$('#wallet_key_wif').text(wallet.Secret);
						$('#wallet_key_wif_name').text('SECRET: ');
						if (!wallet.Seed) $('#wallet_key_seed_name').hide();
						if (!wallet.Secret) $('#wallet_key_wif_name').hide();
						break;
						
					case 'ETH':
						$('#wallet_key_wif').hide();
						$('#wallet_key_wif_name').hide();
						break;
					
					default:
						$('#wallet_key_wif').text(wallet.WIF);
						$('#wallet_key_wif_name').text('WIF: ');
						break;
				}
				
				$('#wallet_key_hex').text(wallet.Key);
				$('#wallet_key_seed').text(wallet.Seed);
				$('#section_wallet_key').show();
			}
			
			if (wallet.Error) {
				infoShow('Error', wallet.Error, 'error', 5000);
			} else {
				infoHide();
			}
		}
	}
}


function walletBlockExplorer() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		
		let addr = wallets.Wallets[walletIndex - 1].Addr;
		let type = wallets.Wallets[walletIndex - 1].Type;
		let testnet = (wallets.Wallets[walletIndex - 1].Options.Testnet === true);
		
		switch (type) {
			case 'XRP':
				let params1 = walletGetXrpCoinParameters(type, testnet);
				openExternalUrl(params1.explorer + addr);
				break;
				
			case 'ETH':
				let params2 = walletGetEthCoinParameters(type, testnet);
				openExternalUrl(params2.explorer + addr);
				break;
				
			default:
				let params3 = walletGetCoinParameters(type, testnet);
				openExternalUrl(params3.explorer + addr);
				break;
		}
	}
}

function walletCopyWif() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_wif').text());
		infoShow('', 'Key copied to clipboard', 'success', 5000);
	}
}

function walletCopyHex() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_hex').text());
		infoShow('', 'HEX key copied to clipboard', 'success', 5000);
	}
}

function walletCopySeed() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_seed').text());
		infoShow('', 'SEED key copied to clipboard', 'success', 5000);
	}
}

function walletCopyAddr() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText(wallets.Wallets[walletIndex - 1].Addr);
		infoShow('', 'Wallet address copied to clipboard', 'success', 5000);
	}
}
