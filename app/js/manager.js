"use strict";

const fs = require('fs');
const qr = require('qr-image');
const request = require('request');
const shell = require('electron').shell;
const remote = require('electron').remote; 
const ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
const {clipboard} = require('electron');
const {ipcRenderer} = require('electron');
const autoLaunch = require('auto-launch');


//------------------------------------------------  Popover  ---------------------------------------------------------------
function infoHide() {
	toastr.clear();	
}

function infoShow(title = '', content = '', type = '', delay = 0) {
	toastr.options = {
		'debug': false,
		'onclick': null,
		'closeButton': true,
		'newestOnTop': true,
		'progressBar': false,
		'preventDuplicates': false,
		'timeOut': delay,
		'showDuration': '200',
		'hideDuration': '200',
		'extendedTimeOut': '200',
		'showEasing': 'swing',
		'hideEasing': 'linear',
		'showMethod': 'fadeIn',
		'hideMethod': 'slideUp',
		'positionClass': 'toastr-container toast-bottom-right'
	};

	switch (type) {
		case 'info':
			toastr.info(content, title);
			break;

		case 'error':
			toastr.error(content, title);
			break;

		case 'warning':
			toastr.warning(content, title);
			break;

		case 'success':
			toastr.success(content, title);
			break;
	}
}
//------------------------------------------------  Popover  ---------------------------------------------------------------




//------------------------------------------------  UI functons  -----------------------------------------------------------
function uiClose() {
	remote.getCurrentWindow().close();
}


function uiShowSection(section = '') {

	if (section === 'last') {
		if ($('#section_market').is(':visible')) section = 'market';
		if ($('#section_general').is(':visible')) section = 'general';
		if ($('#section_wallets').is(':visible')) section = 'wallets';
		if ($('#section_settings').is(':visible')) section = 'settings';
		if ($('#section_passwords').is(':visible')) section = 'passwords';
		if (section === 'last') section = 'general';
	}

	$('#section_wait').hide();
	$('#section_rescan').hide();
	$('#section_market').hide();
	$('#section_general').hide();
	$('#section_wallets').hide();
	$('#section_settings').hide();
	$('#section_passwords').hide();

	switch (section) {
		case 'wait': $('#section_wait').show(); break;
		case 'rescan': $('#section_rescan').show(); break;
		case 'market': $('#section_market').show(); break;
		case 'wallets': $('#section_wallets').show(); break;
		case 'settings': $('#section_settings').show(); break;
		case 'passwords': $('#section_passwords').show(); break;
		case 'general': generalUpdateInfo(); $('#section_general').show(); break;
	}
}
//------------------------------------------------  UI functons  -----------------------------------------------------------




//------------------------------------------------  Quantum Manager updates  -----------------------------------------------
function downloadFile(fileURL, targetPath) {
	return new Promise(function(resolve, reject) {

		let total_bytes = 0;
		let received_bytes = 0;

		let req = request({
			method: 'GET',
			uri: fileURL
		});

		let out = fs.createWriteStream(targetPath);
		req.pipe(out);

		req.on('response', function(data) {
			total_bytes = parseInt(data.headers['content-length']);
		});

		req.on('data', function(chunk) {
			received_bytes += chunk.length;
			modalManagerUpdateDownloadProgress(received_bytes, total_bytes);
		});

		req.on('end', function() {
			resolve(true);
		});

		req.on('error', function() {
			resolve(false);
		});
	});
}

async function uiCheckSoftwareUpdates(localVersion) {
	$.get('https://security-arts.com/downloads/software.json', {rnd: rnd()}).then(async (ret) => {

		let fileUrl = '';
		let filePath = '';
		let serverMsg = '';
		let serverVersion = '0';
		const app = remote.app;

		switch (process.platform) {
			case 'win32':
				serverVersion = ret.manager.windows;
				serverMsg = ret.manager.windows_msg_eng;
				fileUrl = 'https://security-arts.com/downloads/QuantumManager_win.msi';
				filePath = app.getPath('userData') + '\\' + 'QuantumManager_win.msi';
				break;

			case 'linux':
				serverVersion = ret.manager.linux;
				serverMsg = ret.manager.linux_msg_eng;
				fileUrl = 'https://security-arts.com/downloads/QuantumManager_linux.AppImage';
				filePath = app.getPath('userData') + '/' + 'QuantumManager_linux.AppImage';
				break;

			case 'darwin':
				serverVersion = ret.manager.mac;
				serverMsg = ret.manager.mac_msg_eng;
				fileUrl = 'https://security-arts.com/downloads/QuantumManager_mac.dmg';
				filePath = app.getPath('userData') + '/' + 'QuantumManager_mac.dmg';
				break;
		}
		
		if (compareVersions(serverVersion, localVersion)) {

			if (await modalYesNo('Cancel', 'Ok', 'Update available', `New Quantum Manager version ${serverVersion} is available. Press OK for update. ` + serverMsg)) {

				let downloaded = false;

				modalManagerUpdateDownloadShow();
				downloaded = (await downloadFile(fileUrl, filePath));
				modalManagerUpdateDownloadHide();

				if (downloaded)
				{
					if (process.platform === 'linux') {
						shell.showItemInFolder(filePath);
					} else {
						shell.openPath(filePath);
					}

					await sleep(1000);
					remote.getCurrentWindow().close();
				} else {
					await modalYesNo('', 'Ok', 'Error downloading file', 'Please restart program and try again');
				}
			}
		} else {
			fs.unlink(filePath, (err) => {});
		}
	}).catch(() => null);
}
//------------------------------------------------  Quantum Manager updates  -----------------------------------------------



//------------------------------------------------  Firmware update status  ------------------------------------------------
async function uiCheckFirmwareUpdates(serial, localVersion) {
	$.get('https://wallet.security-arts.com/firmware.php', {version: true, serial: serial, rnd: rnd()}).then((ret) => {
		try {
			if (ret.code === 0)
			{
				let serverMsg = JSON.parse(ret.data).msg_eng || '';
				let serverVersion = JSON.parse(ret.data).FirmwareVersion || 0;

				if (serverVersion && serverVersion > localVersion) {
					infoShow('Firmware update', 'New firmware version is available for your device. Please press "Check for updates" button to proceed update. ' + serverMsg, 'info', '10000');
				}
			}
		} catch (err) {};
	}).catch(() => null);
}
//------------------------------------------------  Firmware update status  ------------------------------------------------




//------------------------------------------------  USB events  ------------------------------------------------------------
async function waitMode(mode, timeout) {

	while ((hidGetMode() !== mode) && (timeout > 0)) {
	    await hidFindDevice();
		await sleep(200);
		timeout -= 200;
	}

	return (hidGetMode() === mode);
}

async function waitDevice(serial, timeout) {

	while (!hidIsModeHID() && (timeout > 0)) {
		await hidFindDevice(serial);
	    await sleep(200);
		timeout -= 200;
	}

	return hidIsModeHID();
}

async function waitEnterPin() {
	if (hidIsModeHID() && !devStatus.PinOk) {

		uiShowSection('');
		modalWaitPinShow();

		while (hidIsModeHID() && !devStatus.PinOk) {
			await sleep(200);
			await loadStatus();
		}

		modalWaitPinHide();
	}

	return (hidIsModeHID() && devStatus.PinOk)
}

async function waitActivation() {
	if (hidIsModeHID() && !devStatus.Activated) {

		uiShowSection('');
		modalWaitActivationShow(devStatus.Serial);

		while (hidIsModeHID() && !devStatus.Activated) {
			await sleep(200);
			await loadStatus();
		}

		modalWaitActivationHide();
	}

	return (hidIsModeHID() && devStatus.Activated);
}

async function onDisconnect() {

	await modalWaitDevShow();
	while (hidGetMode() === USB_DEV_MODE_DISCONNECTED) await sleep(10);
	await modalWaitDevHide();
}

async function onConnect() {

	switch (hidGetMode()) {

		case USB_DEV_MODE_KBD:
			modalKbdShow();
			while (hidGetMode() === USB_DEV_MODE_KBD) await sleep(10);
			modalKbdHide();
		    break;

		case USB_DEV_MODE_U2F:
			modalU2fShow();
			while (hidGetMode() === USB_DEV_MODE_U2F) await sleep(10);
			modalU2fHide();
		    break;

		case USB_DEV_MODE_HID:
		case USB_DEV_MODE_BOOT:

			if (await hidInitChannel(1000)) {

				await loadStatus();

				switch (devStatus.Mode) {
					case 'pc':

						await hidSetTime(1000);
						await waitActivation();

						if (await waitEnterPin()) {
							uiCheckFirmwareUpdates(devStatus.Serial, devStatus.FirmwareVersion);

							await loadPasswords();
							await loadWallets();
							await loadSettings();

							uiShowSection('last');
							if (devStatus.Empty) infoShow('Status', 'User memory is empty. Please add new user to continue.', 'info', '10000');
						}
						break;

					case 'boot':
						uiShowSection('');
						await firmwareUpdate();
						break;
				}
			}
			break;
	}
}

async function onConnectErr() {
	uiShowSection('rescan');
}

async function generalRescan() {

	uiShowSection('wait');
	await hidFindDevice();

	if (hidIsConnected()) {
		onConnect();
	} else {
		onDisconnect();
	}
}
//------------------------------------------------  USB events  ------------------------------------------------------------




//------------------------------------------------  Firmware update  -------------------------------------------------------
async function firmwareUpdateSetBootMode(serial, stat, timeout) {

	switch (stat.Mode)
	{
		case 'pc':
			await hidSetBootMode(timeout);
			await sleep(2000);

			if (await waitDevice(serial, 5000)) {
				await sleep(1000);
				return await hidInitChannel(timeout);
			}
		break

		case 'boot':
			return true;
	}

	return false;
}

async function firmwareUpdateProcess(firmware, serial) {

	hidEnableHandlers(false);
	modalFwUpdateStartBtnEnable(false);
	modalFwUpdateCancelBtnEnable(false);
	modalFwUpdateText('Entering boot mode...');

	const bootMode = await firmwareUpdateSetBootMode(serial, devStatus, 5000);

	if (bootMode) {

		let addr = 0;
		let ret = true;
		let size = firmware.byteLength;
		let total = size;

		modalFwUpdateText('Updating...');
		while (size && ret && hidIsModeHID()) {

			let s = Math.min(size, 512);
			let buff = new Uint8Array(firmware, addr, s);
			let data = arrayToHexString(buff);

			ret = ((await hidBootWriteBlock(addr, s, data, 3000)).Result === 'true');
			if (ret) {
				addr += s;
				size -= s;

				modalFwUpdateProgress((addr / total) * 100);
				await sleep(1);
			}
		}

		if (ret) {
            ret = ((await hidBootCheckFirmware(1000)).Result === 'true');
			if (ret) {
				await hidSetFirmwareMode(2000);
			}
		}

		if (ret){
			modalFwUpdateText('Firmware updated.<br>Press OK to continue.');
		} else {
			modalFwUpdateText('Firmware updated error.<br>Please try again.');
		}

	} else {
		modalFwUpdateText('Error!!! Can\'t set boot mode.');
	}

	hidEnableHandlers(true);
	modalFwUpdateProgressHide();		
	modalFwUpdateOkBtnShow(true);
	modalFwUpdateStartBtnShow(false);
	modalFwUpdateCancelBtnShow(false);
}

async function firmwareUpdate() {
	if (!hidIsBusy()) {

		const serial = hidGetSerial();
		await modalFwUpdateShow(devStatus.FirmwareVersion);
		const firmwareData = await firmwareGetUpdateFile(serial, 10000);

		if (firmwareData && (firmwareData.byteLength > 1024)) {
			let serverVersion = (await firmwareGetUpdateVersion(serial, 5000)).FirmwareVersion;

			if (serverVersion > devStatus.FirmwareVersion) {
				modalFwUpdateStartBtnSetHandler(firmwareUpdateProcess, firmwareData, serial);
				modalFwUpdateText('Press Start to begin update process', serverVersion, devStatus.FirmwareVersion);
			} else {
				modalFwUpdateStartBtnEnable(false);
				modalFwUpdateText('Device firmware is up to date', serverVersion, devStatus.FirmwareVersion);
			}
		}

		await modalFwUpdateWait();
		await hidFindDevice();

		if (hidIsConnected()) {
			onConnect();
		} else {
			onDisconnect();
		}
	}
}
//------------------------------------------------  Firmware update  -------------------------------------------------------




//------------------------------------------------  Quantum Manager Settings  ----------------------------------------------
let minimizeToTray = false;

async function settingsManagerReadLocalStore() {
	minimizeToTray = (storageGet('MinimizeToTray') == true);
	ipc.send('settings', 'MinimizeToTray=' + minimizeToTray);
}

async function settingsManagerReadLocalSettings() {

	let autoLauncher = new autoLaunch({name: 'QuantumManager'});

	autoLauncher.isEnabled().then((isEnabled) => {
		$('#settings_auto_start').prop('checked', isEnabled);
	}).catch((err) => {
		$('#settings_auto_start').prop('checked', false);
	});

	settingsManagerReadLocalStore();
	$('#settings_to_tray').prop('checked', minimizeToTray);
}

async function settingsManagerChangeAutoStart() {

	let autoLauncher = new autoLaunch({
		name: 'QuantumManager',
		isHidden: true
	});

	if ($('#settings_auto_start').prop('checked')) {
		autoLauncher.enable();
	} else {
		autoLauncher.disable();
	}
}

async function settingsManagerChangeToTray() {
	minimizeToTray = ($('#settings_to_tray').prop('checked'));
	storageSet('MinimizeToTray', minimizeToTray);
	ipc.send('settings', 'MinimizeToTray=' + minimizeToTray);
}
//------------------------------------------------  Quantum Manager Settings  ----------------------------------------------




//------------------------------------------------  Quantum Manager Main  --------------------------------------------------
document.addEventListener('keydown', function (e) {

	if ((e.which === 123) || (e.which === 117)) {  							
		remote.getCurrentWindow().toggleDevTools();
	} else if (e.which === 116) {
		location.reload();
	}
});


$(document).ready(async () => {

	settingsManagerReadLocalStore();

	$('max-btn').on('click', () => {
		if (!remote.getCurrentWindow().isMaximized()){
			remote.getCurrentWindow().maximize();
		} else {
			remote.getCurrentWindow().unmaximize();
		}
	});

	$('#min-btn').on('click', () => {
		if (minimizeToTray) {
			remote.getCurrentWindow().hide();
		} else {
			remote.getCurrentWindow().minimize();
		}
	});

	$('#close-btn').on('click', () => {
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

	ipcRenderer.on('pc-resume', () => {
		onConnect();
    });

	uiCheckSoftwareUpdates(remote.app.getVersion());
	$('#about_version').text(remote.app.getVersion());	


	hidInit(onConnect, onDisconnect, onConnectErr);
	await hidFindDevice();

	if (hidIsConnected()) {
		onConnect();
	} else {
		onDisconnect();
	}
});
//------------------------------------------------  Quantum Manager Main  --------------------------------------------------

