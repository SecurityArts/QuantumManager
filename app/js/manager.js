
"use strict";
const fs = require('fs');
const qr = require('qr-image');
const shell = require('electron').shell;
const remote = require('electron').remote; 
const {remot} = require('electron');
const {dialog} = require('electron').remote;
const {clipboard} = require('electron');
const {ipcRenderer} = require('electron');

let devstatus = false;

//------------------------------------------------  Helpers  ---------------------------------------------------------------
function hexStringToArray(hex) {
	let arr = [];
	while (hex.length >= 2) {
		arr.push(parseInt(hex.substring(0, 2), 16));
		hex = hex.substring(2, hex.length);
	}
	return arr;
}

function arrayToHexString(arr) {
	let str = '';
	for (let i = 0; i < arr.length; i++) {
		str += ((arr[i] < 16) ? "0" : "") + arr[i].toString(16);
	}
	return str;
}

function openExternalUrl(url) {
	shell.openExternal(url, {activate: true});
}
//------------------------------------------------  Helpers  ---------------------------------------------------------------




//------------------------------------------------  Popover  ---------------------------------------------------------------

function infoHide() {
	toastr.clear();	
}

function infoShow(title, content, type, delay) {
	toastr.options = {
		"closeButton": true,
		"debug": false,
		"newestOnTop": true,
		"progressBar": false,
		"positionClass": "toastr-container toast-bottom-right",
		"preventDuplicates": false,
		"onclick": null,
		"showDuration": "200",
		"hideDuration": "200",
		"timeOut": delay,
		"extendedTimeOut": "200",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "slideUp"
	};
	
	switch (type) {
		case 'info': toastr.info(content, title); break;
		case 'error': toastr.error(content, title); break;
		case 'warning': toastr.warning(content, title); break;
		case 'success': toastr.success(content, title); break;
	}
}
//------------------------------------------------  Popover  ---------------------------------------------------------------



//------------------------------------------------  Updates  ---------------------------------------------------------------
async function uiCheckSoftwareUpdates(localVersion) {
	$.get('https://security-arts.com/downloads/software.json', {rnd: rnd()}).then((ret) => {
		
		let serverVersion = '0';
		
		switch (process.platform) {
			case 'win32': serverVersion = ret.manager.windows; break;
			case 'linux': serverVersion = ret.manager.linux; break;
			case 'darwin': serverVersion = ret.manager.mac; break;
		}
		
		if (cmpVersions(serverVersion, localVersion)) {
			infoShow('Software update', `New manager ${serverVersion} version is available.
			 Please visit WWW.SECURITY-ARTS.COM for updates.`, 'info', '10000');
		}
	});
}

async function uiCheckFirmwareUpdates(serial, localVersion) {
	$.get('https://wallet.security-arts.com/firmware.php', {version: true, serial: serial, rnd: rnd()}).then((ret) => {
		try{
			if (ret.code === 0)
			{
				let serverVersion = JSON.parse(ret.data).FirmwareVersion || 0;

				if (serverVersion && serverVersion > localVersion) {
					infoShow('Firmware update', `New firmware version is available for your device.
				 Please press "Check for updates" button to proceed update.`, 'info', '10000');
				}
			}
		} catch (err) {}

	});
}
//------------------------------------------------  Updates  ---------------------------------------------------------------



//------------------------------------------------  USB events  ------------------------------------------------------------
async function waitMode(mode, timeout) {
	while ((hidGetMode() !== mode) && (timeout > 0)) {
	    await sleep(200); timeout -= 200;
	}

	return (hidGetMode() === mode);
}

async function waitDevice(_serial, timeout) {
	while (!await hidGetDevice(_serial) && (timeout > 0)) {
	    await sleep(200); timeout -= 200;
	}

	return timeout > 0;
}

async function waitEnterPin() {
	if (hidIsConnected() && !devstatus.PinOk) {
		uiShowSection('');
		$('#modal_wait_pin').modal({keyboard: false});

		while (hidIsConnected() && !devstatus.PinOk) {
			await sleep(200);
			devstatus = await hidGetStatus(1000);
		}

		if (hidIsConnected()) {
		    devstatus = await hidGetStatus(1000);
        }
		$('#modal_wait_pin').modal('hide');
	}
	
	return devstatus.PinOk;
}

async function activationGetCode(serial) {
	$.get('https://wallet.security-arts.com/api/activate/', {serial: serial, rnd: rnd()}).then((ret) =>	{
		if (ret.code === 0) {
			ret = ret.data.split(',');
			$('#modal_wait_activation_code').text(ret[0]);
			$('#modal_wait_activation_warranty').text('Warranty period ' + ret[2] + ' month starting from ' + ret[1]);
		}
	});	
}

async function waitActivation() {
	if (hidIsConnected() && !devstatus.Activated) {
		uiShowSection('');
		activationGetCode(devstatus.Serial);
		$('#modal_wait_activation').modal({keyboard: false});

		while (hidIsConnected() && !devstatus.Activated) {
			await sleep(1000);
			devstatus = await hidGetStatus(1000);
		}

		if (hidIsConnected()) {
		    devstatus = await hidGetStatus(1000);
        }
		$('#modal_wait_activation').modal('hide');
	}
	
	return devstatus.Activated;
}

async function onDisconnect() {
	await sleep(500);
	while (!hidIsConnected()) {
		switch (hidGetMode()) {
			case 'mode_hid':
			    break;
			case 'mode_kbd':
				uiShowSection();
				modalKbdU2fShow('Please switch to PC mode', 'kbd.svg');
				while (!hidIsConnected() && (hidGetMode() === 'mode_kbd')) await sleep(200);
				modalKbdU2fHide();
			    break;
			case 'mode_u2f':
				modalKbdU2fShow('Please switch to PC mode', 'u2f.svg');
				while (!hidIsConnected() && (hidGetMode() === 'mode_u2f')) await sleep(200);
				modalKbdU2fHide();
			    break;
			default:
				uiShowSection();
				modalWaitDevShow();
				while (!hidIsConnected() && (hidGetMode() === '')) await sleep(200);
				modalWaitDevHide();
			    break;
		}
		
		await sleep(500);
		modalKbdU2fHide();
		modalWaitDevHide();
	}
}

async function onConnect() {
	if (hidIsConnected()) {
		//await sleep(200);
		if (await hidInitChannel(1000)) {
			//await (200);
			devstatus = await hidGetStatus(1000);
			switch (devstatus.Mode) {
				case 'pc':
					await hidSetTime(1000);
					if (devstatus.Activated === false) {
					    await waitActivation();
                    }
					if (await waitEnterPin()) {
						uiCheckFirmwareUpdates(devstatus.Serial, devstatus.FirmwareVersion);
						//await sleep(200);
						await loadPasswords();
						await loadWallets();
						await loadSettings();
						uiShowSection('last');
						if (devstatus.Empty) infoShow('Status', 'User memory is empty. Please add new user to contimue.', 'info', '10000');
					}
					break;
				case 'boot':
					uiShowSection('');
					await generalUpdate();
				    break;
			}
		}
	}
}
//------------------------------------------------  USB events  ------------------------------------------------------------



//------------------------------------------------  UI functons  -----------------------------------------------------------
function uiClose() {
	remote.getCurrentWindow().close();
}

function uiShowSection(section = '') {
	if (section === 'last') {
		if ($('#section_market').is(":visible")) section = 'market';
		if ($('#section_general').is(":visible")) section = 'general';
		if ($('#section_wallets').is(":visible")) section = 'wallets';
		if ($('#section_settings').is(":visible")) section = 'settings';
		if ($('#section_passwords').is(":visible")) section = 'passwords';
		if (section === 'last') section = 'general';
	}
	
	$('#section_wait').hide();
	$('#section_market').hide();
	$('#section_general').hide();
	$('#section_wallets').hide();
	$('#section_settings').hide();
	$('#section_passwords').hide();
	switch (section) {
		case 'wait': $('#section_wait').show(); break;
		case 'market': $('#section_market').show(); break;
		case 'wallets': $('#section_wallets').show(); break;
		case 'settings': $('#section_settings').show(); break;
		case 'passwords': $('#section_passwords').show(); break;
		case 'general': generalUpdateInfo(); $('#section_general').show(); break;
	}
}

function cmpVersions(a, b) {
	a = a.replace(/(\.0+)+$/, '').split('.');
	b = b.replace(/(\.0+)+$/, '').split('.');
	let l = Math.min(a.length, b.length);

	for (let i = 0; i < l; i++) {
		let diff = parseInt(a[i], 10) - parseInt(b[i], 10);
		if (diff) return (diff > 0);
	}

	return ((a.length - b.length) > 0);
}
//------------------------------------------------  UI functons  -----------------------------------------------------------


//------------------------------------------------  General  ---------------------------------------------------------------
function generalUpdateInfo() {
	if (devstatus.Mode === 'pc') {
		$('#gen_user_name').text(devstatus.Name);
		if (devstatus.Admin) $('#gen_is_admin').text('yes'); else $('#gen_is_admin').text('no');
		$('#gen_wallets_count').text(devstatus.WalletsCount);
		$('#gen_wallets_max').text(devstatus.MaxWallets);
		$('#gen_passwords_count').text(devstatus.PasswordsCount);
		$('#gen_passwords_max').text(devstatus.MaxPasswords);
		$('#gen_fw_ver').text(devstatus.FirmwareVersion.toFixed(2));
		$('#gen_boot_ver').text(devstatus.BootVersion.toFixed(2));
	}
}

function generalSelect() {
	uiShowSection('general');
}

async function initRandom() {
	if (!devstatus.RndInited) {
		infoShow('Attention', 'Please press random buttons on device', 'info', 5000);
		await hidInitRnd(60000);
		infoHide();
		devstatus = await hidGetStatus(1000);
	}
}

async function generalAddUser() {
	if (!hidIsBusy()) {
		let ret = await modalAddUser(devstatus.Admin);
		if (ret) {
			let name = ret.Name;
											
			infoShow('Attention', 'Enter PIN on device for new user', 'info', 5000);
			ret = await hidAddUser(ret.Name, ret.Admin, 60000);
			infoHide();
			
			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
			}
			else {
				devstatus = await hidGetStatus(1000);
				generalUpdateInfo();
				
				await loadPasswords();
				await loadWallets();
				if (name !== devstatus.Name){
					infoShow('Error', 'Add user error. Please try again', 'error', 10000);
				} else {
					infoShow('Success', 'User added', '#17a1b7', 'success', 2000);
				}
			}
		}
	}
}

async function setBootMode(_serial, _status, timeout) {
	if (_status.Mode === "boot") {
	    return true;
    }

	if (_status.Mode === "pc") {
		await hidSetBootMode(timeout);
		await sleep(500);
		const waitDev = await waitDevice(_serial, 5000);
		if (waitDev) {
			return await hidInitChannel(timeout);
		}
	}
	
	return false;
}

async function updateProcess(firmware, devSerial) {
	const bootMode = await setBootMode(devSerial, devstatus, 5000);
	if (bootMode) {
		let ret = true;
		let addr = 0;
		let size = firmware.byteLength;
		let total = size;

		$('#modal_update_text').text("Updating...");
		while (size && ret && hidIsConnected()) {
			let s = Math.min(size, 512);
			let buff = new Uint8Array(firmware, addr, s);
			let data = arrayToHexString(buff);

			ret = (await hidBootWriteBlock(addr, s, data, 3000)).Result === 'true';
			if (ret) {
				addr += s;
				size -= s;
				let pr = (addr / total) * 100;
				$('#modal_update_progress').css('width', pr + '%').attr('aria-valuenow', pr);
				await sleep(1);
			}
		}

		if (ret) {
            ret = (await hidBootCheckFirmware(1000)).Result === 'true'
			if (ret) {
				await hidSetFirmwareMode(2000);
			}
		}

		$('#modal_update_progress_bar').hide();

		if (ret){
			$('#modal_update_text').html("Firmware updated.<br>Press OK to continue.");
		} else {
			$('#modal_update_text').html("Firmware updated error.<br>Please try again.");
		}
	} else {
		$('#modal_update_text').text("Error!!! Can't set boot mode");
	}
}

async function generalUpdate() {
	if (!hidIsBusy()) {
		let firmware;
		let modalVisible = true;
		let devSerial = hidGetSerial();
		
		console.log("Device serial: ", "'" + devSerial + "'");

		hidEnableHandlers(false);
		$("#modal_update")
			.unbind("hidden.bs.modal")
			.on("hidden.bs.modal", () => {modalVisible = false});

		$("#modal_update_cancel")
			.prop("disabled", false)
			.unbind("click")
			.on("click", () => {$("#modal_update").modal('hide')});

		$("#modal_update_start")
			.unbind("click")
			.prop("disabled", true)
			.on("click", async () => {
				$("#modal_update_start").prop("disabled", true);
				$("#modal_update_cancel").prop("disabled", true);
				$('#modal_update_text').text("Entering boot mode...");
				await updateProcess(firmware, devSerial);
				$("#modal_update_start").hide();
				$("#modal_update_cancel")
					.text("Ok")
					.prop("disabled", false);
			})
			.text("Start")
			.show();

		$("#modal_update_cancel").text("Cancel");
		$('#modal_update_progress_bar').show();
		$('#modal_update_progress').css('width', 0 + '%').attr('aria-valuenow', 0);
		$('#modal_update_text')
			.text("Downloading firmware...")
			.append("<br>Server firmware version: ...")
			.append("<br>Device firmware version: " + devstatus.FirmwareVersion.toFixed(2));
		$('#modal_update').modal({keyboard: false});

		firmware = await firmwareDownload(devSerial, 10000);
		if (firmware) {
			let ver = await firmwareVersion(devSerial, 5000);
			ver = ver.FirmwareVersion;

			if (ver > devstatus.FirmwareVersion) {
				$("#modal_update_start").prop("disabled", false);
				$('#modal_update_text').text("Press Start to begin update process");
				$(document).unbind("keyup").keyup((e) => {if (e.which === 13) $("#modal_update_start").click()});
			} else {
				$("#modal_update_start").prop("disabled", false);
				$('#modal_update_text').text("Device firmware is up to date");
			}

			$('#modal_update_text')
				.append("<br>Server firmware version: " + ver.toFixed(2))
				.append("<br>Device firmware version: " + devstatus.FirmwareVersion.toFixed(2));
		}

		while (modalVisible) await sleep(100);
		hidEnableHandlers(true);
		
		if (await hidGetDevice()) {
			onConnect();
		} else {
			onDisconnect();
		}
	}
}

async function generalAbout() {
	$('#about_serial').text(hidGetSerial());
	modalAboutShow();
}
//------------------------------------------------  General  ---------------------------------------------------------------



//------------------------------------------------  Wallets  ---------------------------------------------------------------
let wallets = false;
let walletIndex = 0;
let walletBalance = 0;

async function loadWallets() {
	$('#listWallets').html('');
	wallets = await hidGetWallets(2000);

	if (wallets) {
		if (wallets.Wallets.length) {
			for (let i = 0; i < wallets.Wallets.length; i++) {
				$('#listWallets').append(`<li><a href="#" onclick="walletSelect(${i + 1})">${wallets.Wallets[i].Name}</a></li>`);
			}
			
			if (wallets.Wallets.length < wallets.Max) {
				$('#listWallets').append(`<li><a href="#" onclick="walletAdd()">+ add wallet</a></li>`);
			}
		} else {
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
				let utxo = await bitcoinGetUnspentOutputs(type, wallets.Wallets[walletIndex - 1].Addr, testnet, 2000);
				
				if (utxo) {
					let targets = [{address: addr, value: + (amount * 100000000)}];
					let { inputs, outputs } = coinSelect(utxo, targets, feeRate);
				
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
						await initRandom();
						fee = (total_in - total_out) / 100000000;
						
						modalTransactionStatus('Press OK button on device to confirm operation');
						modalTransactionShow(wallets.Wallets[walletIndex - 1].Addr, addr, amount, fee,
							(walletBalance - amount - fee).toFixed(8), ` ${params.ticker}`);
						for (let i = 0; i < tx.ins.length; i++) {
							for (let j = 0; j < tx.ins.length; j++) {
								tx.ins[j].script = bitcoin.script.compile([]);
							}

							tx.ins[i].script = bitcoin.script.compile(hexStringToArray(inputs[i].script));
															
							let ret = await hidSignTransaction(walletIndex, tx.toHex() + '01000000', 'SECP256K1', i + 1, tx.ins.length, 30000);
							modalTransactionStatus('Signing...');
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
							modalTransactionTx(tx);
							modalTransactionEnable();
							modalTransactionStatus('Transaction signed. Press Broadcast to send to blockchain');
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
					} else infoShow('Error', 'Not enough of btc to send', 'error', 5000);
				} else infoShow('Error', 'Not enough of btc to send', 'error', 5000);
			} else infoShow('Error', 'Invalid fee value', 'error', 5000);
		} else infoShow('Error', 'Invalid send amount', 'error', 5000);
	} else infoShow('Error', 'Invalid send address', 'error', 5000);
}

async function walletSendXrp() {
	let addr = $('#wallet_send_addr').val().trim(); 
	let fee = (Number($('#wallet_send_fee').val().replace(',', '.')) * 1000000).toFixed(0);
	let amount = (Number($('#wallet_send_amount_btc').val().replace(',', '.')) * 1000000).toFixed(0);
	let testnet = (wallets.Wallets[walletIndex - 1].Options.Testnet === true);
									
	if (rippleIsAddressValid(addr)) {
		if (amount && !isNaN(amount)) {
			if (fee && !isNaN(fee)) {
				let ret = await hidGetWalletPubKey(walletIndex, 2000);
				if (ret.PubKey) {
					modalTransactionStatus('Getting wallet data, please wait');
					modalTransactionShow(wallets.Wallets[walletIndex - 1].Addr, addr, amount / 1000000, fee / 1000000, (walletBalance - amount - fee) / 1000000, ' XRP');
					let tx = await rippleGenerateTransaction(wallets.Wallets[walletIndex - 1].Addr, addr, ret.PubKey, amount, fee, testnet, 40, 5000);
					infoHide();
					if (tx) {
						modalTransactionStatus('Please press random buttons on device');
						await initRandom();
						modalTransactionStatus('Press OK button on device to confirm operation');
						ret = await hidSignTransaction(walletIndex, rippleEncodeTxForSigning(tx), 'SECP256K1', 1, 1, 60000);
						if (ret.Signature) {
							tx.TxnSignature = ret.Signature;
							tx = rippleEncodeTxFinal(tx);
							
							modalTransactionTx(tx);
							modalTransactionEnable();
							modalTransactionStatus('Transaction signed. Press Broadcast to send to blockchain');
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

async function walletSend() {
	if (!hidIsBusy()) {
		switch (wallets.Wallets[walletIndex - 1].Type) {
			case 'XRP':
				await walletSendXrp();
				break;
			default:
				await walletSendBtc();
				break;
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
				openExternalUrl('https://xrpscan.com/account/' + addr);
				break;
			default:
				let params = walletGetCoinParameters(type, testnet);
				openExternalUrl(params.explorer + addr);
				break;
		}
	}
}

function walletCopyWif() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_wif').text());
		infoShow('Success', 'Key copied to clipboard', 'success', 5000);
	}
}

function walletCopyHex() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_hex').text());
		infoShow('Success', 'HEX key copied to clipboard', 'success', 5000);
	}
}

function walletCopySeed() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText($('#wallet_key_seed').text());
		infoShow('Success', 'SEED key copied to clipboard', 'success', 5000);
	}
}

function walletCopyAddr() {
	if (wallets && (wallets.Wallets.length >= walletIndex)) {
		clipboard.writeText(wallets.Wallets[walletIndex - 1].Addr);
		infoShow('Success', 'Wallet address copied to clipboard', 'success', 5000);
	}
}

function walletSelectXRP(index) {
	if (index && wallets && (wallets.Wallets.length >= index)) {
		let q;
		let coinToUsdRate = 0;
		let name = wallets.Wallets[index - 1].Name;
		let addr = wallets.Wallets[index - 1].Addr;
		let type = wallets.Wallets[index - 1].Type;
		let testnet = (wallets.Wallets[index - 1].Options.Testnet === true);
										
		walletIndex = index;
		$('#wallet_balance').text('...');
		$('#wallet_name').text(name);
		if (testnet) {
			$('#wallet_type').text('Ripple Testnet');
		} else {
			$('#wallet_type').text('Ripple');
		}
		$('#wallet_addr').text(addr);
		$('#wallet_img').attr('src', 'img/xrp.png');
		
		q = qr.svgObject(addr, { type: 'svg' });
		$('#wallet_qr').attr('d', q.path);
		$('#wallet_viewbox').attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
														
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
										
		$('#wallet_send_addr').val('');
		$('#wallet_send_amount_usd').val('');
		$('#wallet_send_fee_type').text('XRP');
		$('#wallet_send_coin_type').text('XRP');
		$('#wallet_send_amount_btc')
			.val('')
			.attr('placeholder', 'Enter XRP amount')
			.unbind("input")
			.on("input", () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_btc').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$("#wallet_send_amount_usd").val(Number((amount * coinToUsdRate)).toFixed(5));
					} else {
						$("#wallet_send_amount_usd").val('');
					}
				}
			});
										
		$("#wallet_send_amount_usd")
			.unbind("input")
			.on("input", () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_usd').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$("#wallet_send_amount_btc").val(Number((amount / coinToUsdRate)).toFixed(5));
					} else {
						$("#wallet_send_amount_btc").val('');
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
		let q;
		let coinToUsdRate = 0;
		let name = wallets.Wallets[index - 1].Name;
		let addr = wallets.Wallets[index - 1].Addr;
		let type = wallets.Wallets[index - 1].Type;
		let testnet = wallets.Wallets[index - 1].Options.Testnet === true;
		let params = walletGetCoinParameters(type, testnet);
										
		walletIndex = index;
		$('#wallet_balance').text('...');
		$('#wallet_name').text(name);
		$('#wallet_type').text(params.name);
		$('#wallet_addr').text(addr);
		$('#wallet_img').attr('src', 'img/' + params.img);
		
		q = qr.svgObject(addr, { type: 'svg' });
		$('#wallet_qr').attr('d', q.path);
		$('#wallet_viewbox').attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
														
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
		$('#wallet_send_fee_type').text(params.feeName);
		$('#wallet_send_coin_type').text(params.ticker);

		$('#wallet_send_amount_btc')
			.val('')
			.attr('placeholder', 'Enter ' + params.ticker + ' amount')
			.unbind("input")
			.on("input", () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_btc').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount))	{
						$("#wallet_send_amount_usd").val(Number((amount * coinToUsdRate)).toFixed(5));
					} else {
						$("#wallet_send_amount_usd").val('');
					}
				}
			});

		$('#wallet_send_amount_usd')
			.val('')
			.unbind("input")
			.on("input", () => {
				if (coinToUsdRate) {
					let amount = $('#wallet_send_amount_usd').val();
					amount = Number(amount.replace(',', '.'));

					if (!isNaN(amount)) {
						$("#wallet_send_amount_btc").val(Number((amount / coinToUsdRate)).toFixed(5));
					} else {
						$("#wallet_send_amount_btc").val('');
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
					await initRandom();
				}
				ret = await hidAddWallet(ret.Name, ret.Type, ret.Key.trim(), ret.Options, 2000);

				if (ret.Error) {
					infoShow('Error', ret.Error, 'error', 5000);
				} else {
					infoShow('Success', 'Wallet added', 'success', 2000);
					await loadWallets();
					walletSelect(wallets.Wallets.length);
					devstatus = await hidGetStatus(1000);
					generalUpdateInfo();
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
		let ret = await hidDeleteWallet(walletIndex, 30000);
		infoHide();

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Wallet deleted', 'success', 2000);
			await loadWallets();
			if (wallets.Wallets.length > (walletIndex - 1)) {
				walletSelect(walletIndex);
			} else {
				walletSelect(walletIndex - 1);
			}

			devstatus = await hidGetStatus(1000);
			generalUpdateInfo();
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
//------------------------------------------------  Wallets  ---------------------------------------------------------------



//------------------------------------------------  Passwords  -------------------------------------------------------------
let passwords = false;
let passwordIndex = 0;

async function loadPasswords() {
	$('#listPasswords').html('');
	passwords = await hidGetPasswords(2000);

	if (passwords) {
		if (passwords.Command != 'GetPasswords')
		{
			sleep(200);
			//passwords = await hidGetPasswords(2000);
			//console.log("Reread passwords: ", passwords);
			location.reload();
		}
		
		if (passwords.Passwords.length) {
			for (let i = 0; i < passwords.Passwords.length; i++) {
				$('#listPasswords').append(`<li><a href="#" onclick="passwordSelect(${i + 1})">${passwords.Passwords[i].Name}</a></li>`);
			}
			
			if (passwords.Passwords.length < passwords.Max) {
				$('#listPasswords').append(`<li><a href="#" onclick="passwordAdd()">+ add password</a></li>`);
			}
		}
		else {
			$('#listPasswords').append(`<li><a href="#" onclick="passwordAdd()">+ add password</a></li>`);
		}
	}
}

function passwordSelect(index) {
	if (index && passwords && (passwords.Passwords.length  >= index)) {
		passwordIndex = index;
		$('#password_name').text(passwords.Passwords[index - 1].Name);
		$('#password_pass').text('**********');
		$('#password_2fa').text(passwords.Passwords[index - 1].TwoFA);
										
		if (passwords.Passwords[index - 1].TwoFA === 'NONE') {
			$('#password_2fa_btn').text('Add 2FA');
		} else {
			$('#password_2fa_btn').text('Delete 2FA');
		}
																												
		$('#password_qr').attr('d', '');
		uiShowSection('passwords');
	} else {
		generalSelect();
	}
}

async function passwordShowData() {
	if (!hidIsBusy()) {
		if (passwordIndex) {
			infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
			let ret = await hidGetPasswordData(passwordIndex, 30000);
			infoHide();

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
			} else {
				infoHide();
			}

			if (ret.Command === 'GetPasswordData') {
				let q = qr.svgObject(ret.Password, { type: 'svg' });
				$('#password_pass').text(ret.Password);
				
				$('#password_qr').attr('d', q.path);
				$('#password_viewbox')
					.width((q.size + 1) * 4)
					.height((q.size + 1) * 4)
					.attr('viewBox', '0 0 ' + ++q.size + ' ' + q.size);
			}
			
		}
	}
}

async function passwordClipBoard() {
	if (!hidIsBusy()) {
		if (passwordIndex) {
			infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
			let ret = await hidGetPasswordData(passwordIndex, 30000);
			infoHide();

			if (ret.Error) {
				infoShow('Error', ret.Error, 'error', 5000);
			} else {
				infoHide();
			}

			if (ret.Command === 'GetPasswordData') {
				clipboard.writeText(ret.Password);
				infoShow('Success', 'Password copied to clipboard', 'success', 5000);
			}
		}
	}
}

function passwordCopyKey() {
	if (passwords && (passwords.Passwords.length >= passwordIndex)) {
		clipboard.writeText($('#password_pass').text());
		infoShow('Success', 'Password copied to clipboard', 'success', 5000);
	}
}

function passwordIsExist(name) {
	for (let i = 0; i < passwords.Passwords.length; i++) {
		if (name.toUpperCase() === passwords.Passwords[i].Name.toUpperCase()) {
			return true;
		}
	}
	return false;
}

async function passwordAdd() {
	if (!hidIsBusy()) {
		let ret = await modalAddPassword();

		if (ret) {
			ret.Name = ret.Name.trim();
			
			if (!passwordIsExist(ret.Name)) {
				if (ret.Rnd) {
					await initRandom();
				}
				ret = await hidAddPassword(ret.Name, ret.Password, ret.Rnd, ret.Symbols, 2000);

				if (ret.Error) {
					infoShow('Error', ret.Error, 'error', 5000);
				} else {
					infoShow('Success', 'Password added', 'success', 2000);
					await loadPasswords();
					passwordSelect(passwords.Passwords.length);
					
					devstatus = await hidGetStatus(1000);
					generalUpdateInfo();
				}
			} else {
				infoShow('Error', 'Password name ' + ret.Name + ' already exist', 'info', 5000);
			}
		}
	}
}

async function passwordDelete() {
	if (!hidIsBusy()) {
		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidDeletePassword(passwordIndex, 30000);
		infoHide();
										
		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		} else {
			infoShow('Success', 'Password deleted', 'success', 2000);
			await loadPasswords();
			if (passwords.Passwords.length > (passwordIndex - 1)) {
				passwordSelect(passwordIndex);
			} else {
				passwordSelect(passwordIndex - 1);
			}
			
			devstatus = await hidGetStatus(1000);
			generalUpdateInfo();
		}
	}
}

async function passwordTwoFA() {
	if (!hidIsBusy()) {
		if (passwordIndex) {
			if (passwords.Passwords[passwordIndex - 1].TwoFA === 'NONE') {
				let ret = await modalAdd2FA('Cancel', 'Ok', 'Add 2FA');
				switch (ret.Type) {
					case 'U2F': {
						await initRandom();
						ret = await hidAdd2FA(passwords.Passwords[passwordIndex - 1].Name, ret.Type, ret.Key, 2000);

						if (ret) {
							let mode = await waitMode('mode_u2f', 5000);

							if (mode) {
								while (hidGetMode() === 'mode_u2f') {
									await sleep(200);
								}
							}
						}
					}
					break;
					case 'HOTP':
					case 'TOTP':
						ret = await hidAdd2FA(passwords.Passwords[passwordIndex - 1].Name, ret.Type, ret.Key, 2000);
						if (ret.Error) {
							infoShow('Error', ret.Error, 'error', 5000);
						} else {
							infoShow('Success', '2FA added', 'success', 2000);
						}
					break;
				}
			} else {
				infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
				let ret = await hidDel2FA(passwordIndex, 30000);
				infoHide();

				if (ret.Error) {
					infoShow('Error', ret.Error, 'error', 5000);
				} else {
					infoShow('Success', '2FA deleted', 'success', 2000);
				}
			}

			let mode = await waitMode('mode_hid', 3000);
			if (mode) {
				await sleep(200);
				await loadPasswords();
				passwordSelect(passwordIndex);
			}
		}
	}
}
//------------------------------------------------  Passwords  -------------------------------------------------------------



//------------------------------------------------  Settings  --------------------------------------------------------------
function settingsSelect() {
	uiShowSection('settings');
}

async function loadSettings() {
	let ret = await hidGetSettings(1000);
	if (ret.Command === 'GetSettings') {
		$('#settings_lang').val(ret.Lang);
		$('#settings_def_mode').val(ret.DefaultMode);
		$('#settings_rotate_lcd').val(ret.Rotate);
		$('#settings_auto_logout').val(ret.AutoLogout);
		$('#settings_screensaver').val(ret.ScreenSaver);
		$('#settings_print_delay').val(ret.PrintDelay);
	}

	return ret;
}

async function settingsGet() {
	if (!hidIsBusy()) {
		let ret = await loadSettings();
		if (ret.Command === 'GetSettings') {
			infoShow('Success', 'Settings OK', 'success', 2000);
		}
		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}
	}
}
								
async function settingsSet() {
	if (!hidIsBusy()) {
		let Settings = {
			Lang: $('#settings_lang').val(),
			DefaultMode: $('#settings_def_mode').val(),
			Rotate: $('#settings_rotate_lcd').val(),
			AutoLogout: $('#settings_auto_logout').val(),
			ScreenSaver: $('#settings_screensaver').val(),
			PrintDelay: $('#settings_print_delay').val()
		};
		
		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidSetSettings(Settings, 30000);
		infoHide();

		if (ret.Command === 'SetSettings') {
			infoShow('Success', 'Settings set', 'success', 2000);
		}

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}
	}
}

async function settingsClearMem() {
	if (!hidIsBusy()) {
		infoShow('Attention', 'Press OK button on device to confirm operation', 'info', 5000);
		let ret = await hidClearMemory(60000);
		infoHide();

		if (ret.Command === 'ClearMemory') {
			infoShow('Success', 'Memoory clear', 'success', 2000);
			devstatus = await hidGetStatus(1000);
			generalUpdateInfo();
			
			await loadPasswords();
			await loadWallets();
			await loadSettings();
		}

		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}
	}
}

async function settingsBackup() {
	if (!hidIsBusy()) {
		infoShow('Attention', 'Enter crypt key on device', 'info', 5000);
		let ret = await hidBackupKey(60000);
		
		if (ret.Command === 'BackupKey') {
			let addr = 0;
			let size = ret.Size;
			let total = ret.Size;
			let buff = new Uint8Array(size);
											
			ret = true;
			$('#modal_backup_progress').css('width', 0 + '%').attr('aria-valuenow', 0); 
			$('#modal_backup').modal({keyboard: false});
			await sleep(700);
			
			while (ret && !ret.Error && size) {
				let s = Math.min(size, 512);

				ret = await hidBackupReadBlock(addr, s, 3000);
				if (ret && ret.Command === 'BackupBlockRead') {
					let block = hexStringToArray(ret.Data);
														
					buff.set(block, addr);
					addr += s;
					size -= s;
					let pr = (addr / total) * 100;
					$('#modal_backup_progress').css('width', pr + '%').attr('aria-valuenow', pr);
					await sleep(1);
				}
			}
											
			if (!ret.Error) {
				let fileName = dialog.showSaveDialog({defaultPath: 'userdata.dat'});

				if (fileName) {
					fs.writeFileSync(fileName, buff);
				}
			}
			
			$('#modal_backup').modal('hide');
		}
		
		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}
		if (ret.Command === 'BackupBlockRead') {
			infoShow('Attention', 'User data backup OK', 'info', 2000);
		}
	}
}

async function settingsRestore() {
	if (!hidIsBusy()) {
		let ret = false;
		let fileName = dialog.showOpenDialog({defaultPath: 'userdata.dat'});

		if (fileName) {
			let buff = fs.readFileSync(fileName[0]);

			if (buff && buff.length) {
				let size = buff.length;

				infoShow('Attention', 'Enter crypt key on device', 'info', 5000);
				ret = await hidBackupKey(60000);

				if (ret.Command === 'BackupKey') {
					let addr = 0;
					let total = size;

					ret = true;
					$('#modal_restore_progress').css('width', 0 + '%').attr('aria-valuenow', 0);
					$('#modal_restore').modal({keyboard: false});
					await sleep(700);

					while (ret && !ret.Error && size) {
						let s = Math.min(size, 512);
						let block = buff.slice(addr, addr + 512);

						ret = await hidBackupWriteBlock(addr, s, arrayToHexString(block), 3000)
						if (ret && ret.Command === 'BackupBlockWrite') {
							addr += s;
							size -= s;
							let pr = (addr / total) * 100;
							$('#modal_restore_progress').css('width', pr + '%').attr('aria-valuenow', pr);
							await sleep(1);
						}
					}

					$('#modal_restore').modal('hide');
				}

			}
		}
		
		if (ret.Error) {
			infoShow('Error', ret.Error, 'error', 5000);
		}

		if (ret.Command === 'BackupBlockWrite') {
			infoShow('Success', 'Device restored OK and should be restarted', 'success', 5000);
			await hidRestart(3000);
		}
	}
}
//------------------------------------------------  Settings  --------------------------------------------------------------



//------------------------------------------------  Market data  -----------------------------------------------------------
let marketData = [];
let marketSortCapDir = -1;
let marketSortNameDir = -1;
let marketSortPriceDir = -1;
let marketSortVolumeDir = -1;
let marketSortChangeDir = -1;
let marketSortSymbolDir = -1;

function marketSortData(sortType, direction) {
	switch (sortType) {
		case 'name':
			marketData.sort((a, b) => {return (b.name.localeCompare(a.name)) * direction});
			break;
		
		case 'symbol':
			marketData.sort((a, b) => {return (b.symbol.localeCompare(a.symbol)) * direction});
			break;
		
		case 'price':
			marketData.sort((a, b) => {return (b.price - a.price) * direction});
			break;
		
		case 'cap':
			marketData.sort((a, b) => {return (b.cap - a.cap) * direction});
			break;
		
		case 'volume':
			marketData.sort((a, b) => {return (b.volume - a.volume) * direction});
			break;
		
		case 'change':
			marketData.sort((a, b) => {return (b.change - a.change) * direction});
			break;
	}
}

async function marketShowData() {
	let i = 1;	
	let rows = '';
	let colors = ['#F8F8F8', '#FFFFFF'];

	marketData.forEach((item) => {
		let change = Number(item.change).toFixed(3);
		let cap = Number(item.cap).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$& ');
		let price = Number(item.price).toFixed(5).replace(/\d(?=(\d{3})+\.)/g, '$&,');
		let volume = Number(item.volume).toFixed(0).replace(/\d(?=(\d{3})+$)/g, '$& ');
		rows += `<tr style="background-color: ${colors[i & 1]}"><td>${i++}</td><td>${item.name}</td>
				<td>${item.symbol}</td><td>$${price}</td><td>$${cap}</td><td>$${volume}</td><td>${change}%</td></tr>`;
	});
			
	$("#table_market_data_body").html(rows);
	uiShowSection('market');
}

async function marketGetData() {
	$("#table_market_data_body").html('');
	$.get(bitcoinApiAddrMarketData).then((data) => {
		data = strToJson(data);
		if (data.status.error_code === 0) {
			let t = Date.parse(data.status.timestamp);

			if (Number.isInteger(t)) {
				let d = new Date(t);
				infoShow('Updated', d.toLocaleString(), 'info', 5000);
			}
			
			marketData = [];
			data.data.forEach((item) => {
				marketData.push({
					name: item.name,
					symbol: item.symbol,
					price: item.quote.USD.price,
					cap: item.quote.USD.market_cap,
					volume: item.quote.USD.volume_24h,
					change: item.quote.USD.percent_change_24h
				});
			});
			
			marketSortCapDir = -1;
			marketSortNameDir = -1;
			marketSortPriceDir = -1;
			marketSortVolumeDir = -1;
			marketSortChangeDir = -1;
			marketSortSymbolDir = -1;
			marketSortData('cap', 1);
			marketShowData();
		}
	});
}

function marketSortName() {
	marketSortData('name', marketSortNameDir);
	marketShowData();
	marketSortNameDir = -marketSortNameDir;
}

function marketSortSymbol() {
	marketSortData('symbol', marketSortSymbolDir);
	marketShowData();
	marketSortSymbolDir = -marketSortSymbolDir;
}

function marketSortPrice() {
	marketSortData('price', marketSortPriceDir);
	marketShowData();
	marketSortPriceDir = -marketSortPriceDir;
}

function marketSortCap() {
	marketSortData('cap', marketSortCapDir);
	marketShowData();
	marketSortCapDir =- marketSortCapDir;
}

function marketSortVolume() {
	marketSortData('volume', marketSortVolumeDir);
	marketShowData();
	marketSortVolumeDir =- marketSortVolumeDir;
}

function marketSortChange() {
	marketSortData('change', marketSortChangeDir);
	marketShowData();
	marketSortChangeDir =- marketSortChangeDir;
}

async function marketDataSelect() {
	uiShowSection('wait');
	marketGetData();
}
//------------------------------------------------  Rates  -----------------------------------------------------------------

document.addEventListener("keydown", function (e) {
	if ((e.which === 123) || (e.which === 117)) {  							// F12 or F6
		remote.getCurrentWindow().toggleDevTools();
	} else if (e.which === 116) {											// F5
		location.reload();
	}
});


$(document).ready(async () => {
	$("#max-btn").on("click", () => {
		if (!remote.getCurrentWindow().isMaximized()){
			remote.getCurrentWindow().maximize();
		} else {
			remote.getCurrentWindow().unmaximize();
		}
	});

	$("#min-btn").on("click", () => {
		remote.getCurrentWindow().minimize();
	});
	
	$("#close-btn").on("click", () => {
		remote.getCurrentWindow().close();
	}); 
	
    ipcRenderer.on('focus-element', () => {
		$('#app_header_toolbar')
			.removeClass('toolbar_unfocused')
			.addClass('toolbar_focused');
    });
	
	ipcRenderer.on('blur-element', () => {
		$('#app_header_toolbar')
			.removeClass('toolbar_focused')
			.addClass('toolbar_unfocused');
    });

	
	uiCheckSoftwareUpdates(remote.app.getVersion());
	$('#about_version').text(remote.app.getVersion());	
	
	hidInit(onConnect, onDisconnect);
	if (await hidGetDevice()) {
		onConnect();
	} else {
		onDisconnect();
	}
});
