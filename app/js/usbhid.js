"use strict";

const HID = require('node-hid');
const detect = require('usb-detection');


const USB_VID		= 6802;	// 0x1A92 - Vendor ID
const USB_PID_KBD	= 8209;	// 0x2011 - Product ID, keyboard
const USB_PID_U2F	= 8210;	// 0x2012 - Product ID, FIDO U2F
const USB_PID_HID	= 8211;	// 0x2013 - Product ID, HID interface
const USB_PID_BOOT	= 8227;	// 0x2023 - Product ID, bootloader


const PKT_CID		= 0x86; // Channel ID type - init channel
const PKT_DAT		= 0x83;	// Channel ID type - transfer data
const PKT_ERR		= 0xBF;	// Channel ID type - error


const ERR_USB_BUSY			= 10000 // Command in progress. Check 'hidIsBusy' status before new command
const ERR_USB_WRITE			= 10001 // Command write error
const ERR_USB_READ_ERROR	= 10002 // USB read error
const ERR_USB_READ_TIMEOUT	= 10003	// No command response for given timeout
const ERR_USB_PACKET_ERROR	= 10004 // Read packet error
const ERR_USB_DISCONNECTED	= 10005 // USB Disconnected during read
const ERR_USB_JSON			= 10006 // Response JSON object parsing error


const USB_DEV_MODE_DISCONNECTED	= 0	// Device disconnected
const USB_DEV_MODE_HID			= 1	// Device HID mode, ready to comunicate
const USB_DEV_MODE_BOOT			= 2	// Device HID Boot mode, ready to comunicate
const USB_DEV_MODE_KBD			= 3	// Device in Keyboard mode
const USB_DEV_MODE_U2F			= 4 // Device in U2F mode


let deviceSerial = 0;
let deviceHandler = false;
let deviceMode = USB_DEV_MODE_DISCONNECTED;


let handlersFncEnabled = false;
let handlersFncOnConnectFnc = false;
let handlersFncOnDisconnectFnc = false;
let handlersFncOnConnectErrFnc = false;


let commandChannelId = 0;
let commandInProgress = false;


//-------------------------------------  Helper functions  ----------------------------------------------------------------
function rnd() {
	return Math.floor(Math.random() * 0x100000000);
}

function usbError(error, code) {
	return {Error: error, ErrCode: code}
}

function rndArray(len) {
	let buff = [];

	while (len--) {
		buff.push(Math.floor(Math.random() * 0x100));
	}

	return buff;
}

function compareArrays(arr1, arr2, len)
{
	for (let i = 0; i < len; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
}

function jsonToArray(json) {
	return JSON.stringify(json).split('').map((item) => item.charCodeAt());
}

function arrayToJson(arr) {
	arr = arr.map((item) => String.fromCharCode(item)).join('');

	try {
		return JSON.parse(arr);
	} catch(e) {
		return {Error: 'Command response error', ErrCode: ERR_USB_JSON};
	}
}
//-------------------------------------  Helper functions  ----------------------------------------------------------------



//-------------------------------------  USB Detect/Discovery functions  --------------------------------------------------
function hidGetSerial() {
	return deviceSerial;
}

function hidIsBusy() {
	return commandInProgress;
}

function hidGetMode() {
	return deviceMode;
}

function hidIsModeHID() {
	return ((deviceMode === USB_DEV_MODE_HID) || (deviceMode === USB_DEV_MODE_BOOT));
}

function hidIsConnected() {
	return (deviceMode !== USB_DEV_MODE_DISCONNECTED);
}

function hidEnableHandlers(enable = true) {
	handlersFncEnabled = enable;
}

function hidSetHandlers(onConnectHandler = false, onDisconnectHandler = false, onConnectErrHandler = false) {
	handlersFncOnConnectFnc = onConnectHandler;
	handlersFncOnDisconnectFnc = onDisconnectHandler;
	handlersFncOnConnectErrFnc = onConnectErrHandler;
}

async function hidTryToConnect(usbDescriptor, tries, delay) {
	let handler = false;

	for (let i = 0; i < tries; i++) {
		await sleep(delay);
		try {
			handler = await new HID.HID(usbDescriptor.vendorId, usbDescriptor.productId);
			return handler;
		} catch (err) {}
	}

	return handler;
}

async function hidFindDevice(usbSerial = 0, usbDescriptor = false, connectTries = 2, connectDelay = 100) {

	let tryToConnect = false;

	if (deviceHandler) {
		try {
			deviceHandler.close();
		} catch (err) {}
	}

	deviceMode = USB_DEV_MODE_DISCONNECTED;

	if (usbDescriptor) {
		deviceSerial = usbDescriptor.serialNumber;
		switch (usbDescriptor.productId) {

			case USB_PID_KBD:
				deviceMode = USB_DEV_MODE_KBD;
				break;

			case USB_PID_U2F:
				deviceMode = USB_DEV_MODE_U2F;
				break;

			case USB_PID_HID:
				tryToConnect = true;
				deviceMode = USB_DEV_MODE_HID;
				break;

			case USB_PID_BOOT:
				tryToConnect = true;
				deviceMode = USB_DEV_MODE_BOOT;
				break;
		}

	} else {

		await sleep(100);
		HID.devices().find((d) => {
			if ((d.vendorId === USB_VID) && (usbSerial === d.serialNumber || usbSerial === 0))
			{
				usbDescriptor = d;
				deviceSerial = d.serialNumber;

				switch (d.productId) {

					case USB_PID_KBD:
						deviceMode = USB_DEV_MODE_KBD;
						return true;

					case USB_PID_U2F:
						deviceMode = USB_DEV_MODE_U2F;
						return true;

					case USB_PID_HID:
						tryToConnect = true;
						deviceMode = USB_DEV_MODE_HID;
						return true;

					case USB_PID_BOOT:
						tryToConnect = true;
						deviceMode = USB_DEV_MODE_BOOT;
						return true;
				}
			}
		});
	}

	if (tryToConnect && usbDescriptor) {
		deviceHandler = await hidTryToConnect(usbDescriptor, connectTries, connectDelay);
		if (!deviceHandler) {
			deviceMode = USB_DEV_MODE_DISCONNECTED;
		}
	}

	return deviceMode;
}

function hidInit(onConnectHandler = false, onDisconnectHandler = false, onConnectErrHandler = false) {

	deviceSerial = 0;
	deviceHandler = false;
	handlersFncEnabled = true;
	deviceMode = USB_DEV_MODE_DISCONNECTED;

	if (onConnectHandler) {
	    handlersFncOnConnectFnc = onConnectHandler;
    }

	if (onDisconnectHandler) {
	    handlersFncOnDisconnectFnc = onDisconnectHandler;
    }

	if (onConnectErrHandler) {
	    handlersFncOnConnectErrFnc = onConnectErrHandler;
    }

	detect.startMonitoring();
	detect.on('add:' + USB_VID, async (usbDescriptor) => {
		if (deviceMode === USB_DEV_MODE_DISCONNECTED) {

			await hidFindDevice(0, usbDescriptor, 5, 100);
			if (deviceMode !== USB_DEV_MODE_DISCONNECTED) {
				if (handlersFncOnConnectFnc && handlersFncEnabled) {
					await handlersFncOnConnectFnc();
				}
			} else {
				if (handlersFncOnConnectErrFnc && handlersFncEnabled) {
					await handlersFncOnConnectErrFnc();
				}
			}
		}
	});

	detect.on('remove:' + USB_VID, async (usbDescriptor) => {
		if (deviceMode !== USB_DEV_MODE_DISCONNECTED) {

			if (deviceSerial === usbDescriptor.serialNumber) {
				deviceSerial = 0;
				deviceHandler = false;
				deviceMode = USB_DEV_MODE_DISCONNECTED;
				if (handlersFncOnDisconnectFnc && handlersFncEnabled) {
				    await handlersFncOnDisconnectFnc();
                }
			}
		}
	});
}
//-------------------------------------  USB Detect/Discovery functions  --------------------------------------------------



//-------------------------------------  Transport/Packet layer  ----------------------------------------------------------
function hidReadPacket(timeout) {
	return new Promise((resolve, reject) => {
		let tmr = setTimeout(() => reject(new usbError('USB read command timeout', ERR_USB_READ_TIMEOUT)), timeout);

		deviceHandler.read((err, data) => {
			clearTimeout(tmr);

			if (err) {
			    reject(new usbError('USB read command error', ERR_USB_READ_ERROR));
            }

			if (data) {
				data = Array.from(data);
				resolve(data);
			}
		});
	});
}

function hidWritePacket(buff) {

	if (process.platform === 'win32') {
		buff.unshift(0);
	}

	try {
		return (deviceHandler.write(buff) !== 0);
	} catch (err) {
		return false;
	}
}

function hidWrite(cid, type, data) {
	let txId = 0;
	let txPtr = 0;

	let buff = [];
	let size = data.length;
	let sizeTx = Math.min(size, 57);
	let tmp = data.slice(txPtr, sizeTx);

	buff[0] = (cid >> 24) & 0xFF;
	buff[1] = (cid >> 16) & 0xFF;
	buff[2] = (cid >> 8)  & 0xFF;
	buff[3] = (cid >> 0)  & 0xFF;
	buff[4] = type;
	buff[5] = (size >> 8) & 0xFF;
	buff[6] = (size >> 0) & 0xFF;
	buff = buff.concat(tmp);

	if (!hidWritePacket(buff)) {
	    return false;
    }

	size -= Math.min(size, sizeTx);
	while (size && hidIsModeHID()) {

		txPtr += sizeTx;
		sizeTx = Math.min(size, 59);
		size -= sizeTx;
		tmp = data.slice(txPtr, txPtr + sizeTx);

		buff = [];
		buff[0] = (cid >> 24) & 0xFF;
		buff[1] = (cid >> 16) & 0xFF;
		buff[2] = (cid >> 8)  & 0xFF;
		buff[3] = (cid >> 0)  & 0xFF;
		buff[4] = txId++;
		buff = buff.concat(tmp);

		if (!hidWritePacket(buff)) {
		    return false;
        }
	}

	return true;
}

async function hidRead(cid, type, timeout) {
	let size = 0;
	let rxId = 0;
	let payload = [];

	while (hidIsModeHID()) {

		let buff = await hidReadPacket(timeout);

		let payloadType = buff[4];
		let payloadSize = (buff[5] << 8) + buff[6];
		let id = (buff[0] << 24) + (buff[1] << 16) + (buff[2] << 8) + buff[3];

		switch (payloadType) {
			case PKT_ERR:
				throw new usbError('HID packet error', ERR_USB_PACKET_ERROR);
			    break;

			case PKT_CID:
				if ((id === cid || id === -1) && (payloadType === type) && (payloadSize === 17)) {
					return buff.slice(7, 7 + payloadSize);
				} else {
				    throw new usbError('HID packet error', ERR_USB_PACKET_ERROR);
                }
			    break;

			case PKT_DAT:
				if ((id === cid) && (payloadType === type)){
					rxId = 0;
					let s = Math.min(payloadSize, 57);
					size = payloadSize - s;
					payload = buff.slice(7, 7 + s);
					if (size === 0) {
					    return payload;
                    }
				} else {
				    throw new usbError('HID packet error', ERR_USB_PACKET_ERROR);
                }
			    break;

			default:
				if ((id === cid) && (payloadType === rxId)) {
					if (size) {
						rxId++;
						let s = Math.min(size, 59);
						size -= s;
						payload = payload.concat(buff.slice(5, 5 + s));
						if (size === 0) {
						    return payload;
						}
						continue;
					}
				}

				throw new usbError('HID packet error', ERR_USB_PACKET_ERROR);
			    break;
		}
	}

	throw new usbError('USB Disconnected', ERR_USB_DISCONNECTED);
}

async function hidInitChannel(timeout) {
	let buff = rndArray(8);

	commandInProgress = true;
	commandChannelId = 0xFFFFFFFF;

	if (hidWrite(commandChannelId, PKT_CID, buff)) {
		let data;

		try {
			data = await hidRead(commandChannelId, PKT_CID, timeout);
		} catch (err) {
			console.log('Init channel error: ', err);
			commandInProgress = false;
			return false;
		}

		if (compareArrays(buff, data, buff.length)) {
			commandChannelId = (data[8] << 24) | (data[9] << 16) | (data[10] << 8) | data[11];
			commandInProgress = false;
			return true;
		}
	}

	commandInProgress = false;
	return false;
}
//-------------------------------------  Transport/Packet layer  ----------------------------------------------------------




//-------------------------------------  Transaction layer  ---------------------------------------------------------------
async function hidCommand(data, timeout) {
	let ret;

	if (commandInProgress) {
		return usbError('USB command in progress', ERR_USB_BUSY);
	}

	commandInProgress = true;
	if (hidWrite(commandChannelId, PKT_DAT, data)) {

		try {
			ret = await hidRead(commandChannelId, PKT_DAT, timeout);
		} catch (err) {
			commandInProgress = false;
			return err;
		}

	} else {
		commandInProgress = false;
		return usbError ('USB write command error', ERR_USB_WRITE);
	}

	commandInProgress = false;
	return arrayToJson(ret);
}
//-------------------------------------  Transaction layer  ---------------------------------------------------------------




//-------------------------------------  General commands  ----------------------------------------------------------------
async function hidGetStatus(timeout = 1000) {
	return await hidCommand(jsonToArray({ Command: 'GetStatus', CmdId: rnd() }), timeout);
}

async function hidAddUser(name, admin, timeout = 180000) {
	return await hidCommand(jsonToArray({ Command: 'AddUser', Name: name, Admin: admin, CmdId: rnd() }), timeout);
}

async function hidInitRnd(timeout = 120000) {
	return await hidCommand(jsonToArray({ Command: 'InitRnd', CmdId: rnd() }), timeout);
}

async function hidSetTime(timeout = 1000) {
    let epoch = Math.round(new Date().getTime() / 1000.0);
	return await hidCommand(jsonToArray({ Command: 'SetTime', Time: epoch, CmdId: rnd() }), timeout);
}
//-------------------------------------  General commands  ----------------------------------------------------------------



//-------------------------------------  Passwords commands  --------------------------------------------------------------
async function hidGetPasswords(timeout = 2000) {
	return await hidCommand(jsonToArray({Command: 'GetPasswords', CmdId: rnd()}), timeout);
}

async function hidGetPasswordData(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'GetPasswordData', Index: index, CmdId: rnd()}), timeout);
}

async function hidDeletePassword(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'DelPassword', Index: index, CmdId: rnd()}), timeout);
}

async function hidAddPassword(name, pass, random, symbols, timeout) {
	if (random) {
		return await hidCommand(jsonToArray({Command: 'AddPassword', Name: name, Rnd: random, Symbols: symbols, CmdId: rnd()}), timeout);
    } else {
		return await hidCommand(jsonToArray({Command: 'AddPassword', Name: name, Password: pass, CmdId: rnd()}), timeout);
    }
}

async function hidGet2FA(index, timeout = 40000) {
	let epoch = Math.round(new Date().getTime() / 1000.0);
	return await hidCommand(jsonToArray({Command: 'Get2FA', Index: index, Time: epoch, CmdId: rnd()}), timeout);
}

async function hidIncCounter2FA(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'IncCntr2FA', Index: index, CmdId: rnd()}), timeout);
}

async function hidSetCounter2FA(index, counter, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'SetCntr2FA', Index: index, Counter: counter, CmdId: rnd()}), timeout);
}


async function hidAdd2FA(index, type, key, timeout = 2000) {
	return await hidCommand(jsonToArray({Command: 'Add2FA', Index: index, Type: type, Key: key, CmdId: rnd()}), timeout);
}

async function hidDel2FA(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'Del2FA', Index: index, CmdId: rnd()}), timeout);
}
//-------------------------------------  Passwords commands  --------------------------------------------------------------



//-------------------------------------  Wallets commands  ----------------------------------------------------------------
async function hidGetWallets(timeout = 2000) {
	return await hidCommand(jsonToArray({Command: 'GetWallets', CmdId: rnd()}), timeout);
}

async function hidDeleteWallet(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'DelWallet', Index: index, CmdId: rnd()}), timeout);
}

async function hidAddWallet(name, type, key, otptions, timeout = 2000) {
    return await hidCommand(jsonToArray(Object.assign({Command: 'AddWallet', Name: name, Type: type, Key: key, CmdId: rnd()}, otptions)), timeout);
}

async function hidGetWalletData(index, timeout = 40000) {
	return await hidCommand(jsonToArray({Command: 'GetWalletData', Index: index, CmdId: rnd()}), timeout);
}

async function hidShowWalletKey(index, timeout = 320000) {
	return await hidCommand(jsonToArray({Command: 'ShowWalletKey', Index: index, CmdId: rnd()}), timeout);
}

async function hidGetWalletPubKey(index, timeout = 2000) {
	return await hidCommand(jsonToArray({Command: 'GetWalletPubKey', Index: index, CmdId: rnd()}), timeout);
}

async function hidSignTransaction(index, tx, curve, input, inputs, inputAmount, timeout = 100000) {
    return await hidCommand(jsonToArray({Command: 'SignTransaction', Tx: tx, Index: index, Curve: curve, Input: input + '/' + inputs, Amount: inputAmount, CmdId: rnd()}), timeout);
}
//-------------------------------------  Wallets commands  ----------------------------------------------------------------



//-------------------------------------  Settings commands  ---------------------------------------------------------------
async function hidGetSettings(timeout = 1000) {
	return await hidCommand(jsonToArray({Command: 'GetSettings', CmdId: rnd()}), timeout);
}

async function hidSetSettings(settings, timeout = 40000) {
    return await hidCommand(jsonToArray(Object.assign({Command: 'SetSettings', CmdId: rnd()}, settings)), timeout);
}

async function hidClearMemory(timeout = 60000) {
	return await hidCommand(jsonToArray({Command: 'ClearMemory', CmdId: rnd()}), timeout);
}

async function hidBackupKey(timeout = 60000) {
	return await hidCommand(jsonToArray({Command: 'BackupKey', CmdId: rnd()}), timeout);
}

async function hidBackupReadBlock(addr, size, timeout = 3000) {
	return await hidCommand(jsonToArray({Command: 'BackupBlockRead', Addr: addr, Size: size, CmdId: rnd()}), timeout);
}

async function hidBackupWriteBlock(addr, size, hexData, timeout = 5000) {
	return await hidCommand(jsonToArray({Command: 'BackupBlockWrite', Addr: addr, Size: size, Data: hexData, CmdId: rnd()}), timeout);
}
//-------------------------------------  Settings commands  ---------------------------------------------------------------



//-------------------------------------  Boot commands  -------------------------------------------------------------------
async function hidSetBootMode(timeout = 5000) {
	return await hidCommand(jsonToArray({Command: 'SetBootMode', CmdId: rnd()}), timeout);
}

async function hidRestart(timeout = 3000) {
	return await hidCommand(jsonToArray({Command: 'Restart', CmdId: rnd()}), timeout);
}

async function hidSetFirmwareMode(timeout = 3000) {
	return await hidCommand(jsonToArray({Command: 'ExitBoot', CmdId: rnd()}), timeout);
}

async function hidBootWriteBlock(addr, size, hex_data, timeout = 5000) {
	return await hidCommand(jsonToArray({Command: 'BootWrite', Addr: addr, Size: size, Data: hex_data, CmdId: rnd()}), timeout);
}

async function hidBootCheckFirmware(timeout = 1000) {
	return await hidCommand(jsonToArray({Command: 'BootCheckFirmware', CmdId: rnd()}), timeout);
}
//-------------------------------------  Boot commands  -------------------------------------------------------------------
