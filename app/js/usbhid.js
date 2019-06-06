"use strict";

const HID = require('node-hid');
const detect = require('usb-detection');

const vid = 6802;		// 0x1A92 - Vendor ID
const pid_kbd = 8209;	// 0x2011 - Product ID, keyboard
const pid_u2f = 8210;	// 0x2012 - Product ID, FIDO U2F
const pid_hid = 8211;	// 0x2013 - Product ID, HID interface
const pid_boot = 8227;	// 0x2023 - Product ID, bootloader

const typeCid = 0x86;	// Channel ID type - init channel
const typeData = 0x83;	// Channel ID type - transfer data

let serial = 0;
let channelId = 0x00;

let mode = '';
let device = false;
let connected = false;
let onConnectFnc = false;
let onDisconnectFnc = false;
let hanlersFncEnabled = false;
let commandInProgress = false;


//-------------------------------------  Helper functions  ----------------------------------------------------------------
function UserError(message, code, prm = 0) {
	return {prm: prm, code: code, Error: message}
}

function rnd() {
	return Math.floor(Math.random() * 0xFFFFFFFF);
}

function jsonToArray(json) {
	return JSON.stringify(json).split('').map((item) => item.charCodeAt());
}

function arrayToJson(str) {
	str = str.map((item) => String.fromCharCode(item)).join('');
	try {
		return JSON.parse(str);
	} catch(e) {
		return UserError("JSON string error: " + e, 9, str);
	}
}

function strToJson(str) {
	try {
		return JSON.parse(str);
	} catch(e) {
		return {"status": "error", "data": str, "code": 1000};
	}
}
//-------------------------------------  Helper functions  ----------------------------------------------------------------



//-------------------------------------  Low level USB HID functions  -----------------------------------------------------
function hidGetSerial() {
	return serial;
}

function hidIsConnected() {
	return connected;
}

function hidGetMode() {
	return mode;
}

function hidIsBusy() {
	return commandInProgress;
}

function hidEnableHandlers(enable = true) {
	hanlersFncEnabled = enable;
}

async function hidGetDevice(devSerial = 0) {
	mode = '';
	
	if (device) {
		try {
			device.close();
		} catch (err) {
			console.log("Close err: ", err);
		}
	}
	
	await sleep(100);
	device = HID.devices().find((d) => {
		if (d.vendorId === vid && (d.productId === pid_hid || d.productId === pid_boot) && (devSerial === d.serialNumber || devSerial === 0)) {
			mode = 'mode_hid';
			return true;
		} else {
			if (d.vendorId === vid) {
				switch (d.productId) {
					case pid_kbd: mode = 'mode_kbd'; break;
					case pid_u2f: mode = 'mode_u2f'; break;
				}
			}
			return false;
		}
	});
	
	if (device) {
		try {
			serial = device.serialNumber;
			await sleep(100);
			device = new HID.HID(device.path);
		} catch (err) {
			device = undefined;
			console.log("Can't connect device");
		}
	}
	
	return connected = (device !== undefined);
}

function hidSetHandlers (onConnectHandler = false, onDisconnectHandler = false) {
	onConnectFnc = onConnectHandler;
	onDisconnectFnc = onDisconnectHandler;
}

function hidInit(onConnectHandler = false, onDisconnectHandler = false) {
	serial = 0;
	device = false;
	connected = false;	
	detect.startMonitoring();
	hanlersFncEnabled = true;

	if (onConnectHandler) {
	    onConnectFnc = onConnectHandler;
    }

	if (onDisconnectHandler) {
	    onDisconnectFnc = onDisconnectHandler;
    }
	
	detect.on('add:' + vid, async (d) => {
		console.log("Device add");
		if (!connected) {
            connected = await hidGetDevice();
			console.log("Connected: ", connected);
			console.log("Mode: ", mode);
			if (connected) {
				if (onConnectFnc && hanlersFncEnabled) {
					await onConnectFnc();
                }
			} else {
				if (d.productId === pid_kbd || d.productId === pid_u2f)	{
				    serial = d.serialNumber;
                }
			}
		}
	});
	
	detect.on('remove:' + vid, async (d) => {
		console.log("Device remove");
		if (serial === d.serialNumber) {
			mode = '';
			device = false;
			if (connected) {
				serial = 0;
				connected = false;
				if (onDisconnectFnc && hanlersFncEnabled) {
				    await onDisconnectFnc();
                }
			}
		}
	});
}


function deviceRead(timeout) {
	return new Promise((resolve, reject) => {
		let tmr = setTimeout(() => reject(new UserError("HID read timeout", 1)), timeout);
		
		device.read((err, data) => {
			clearTimeout(tmr);

			if (err) {
			    reject(new UserError("HID read error", 2));
            }

			if (data) {
				data = Array.from(data);
				resolve(data);
			}
		});
	});
}


function deviceWrite(buff) {
	let ret = 0;
	
	if (process.platform === 'win32') {
		let b = buff;
		b.unshift(0);
		try {
			ret = device.write(b);
		} catch (err) {
			return false;
		}
	} else {
		try {
			ret = device.write(buff);
		} catch (err) {
			return false;
		}
	}
	
	return (ret !== 0);
}

function hidSend(data, cid, type) {
	let txId = 0;
	let txPtr = 0;
	
	let buff = [];
	let size = data.length;
	let sizeTx = Math.min(size, 57);
	let tmp = data.slice(txPtr, sizeTx);
	
	buff[0] = (cid >> 24) & 0xFF;
	buff[1] = (cid >> 16) & 0xFF;
	buff[2] = (cid >> 8)  & 0xFF;
	buff[3] = (cid)  & 0xFF;
	buff[4] = type;
	buff[5] = (size >> 8)  & 0xFF;
	buff[6] = (size)  & 0xFF;
	buff = buff.concat(tmp);
	
	if (deviceWrite(buff) === false) {
	    return false;
    }
	
	size -= Math.min(size, sizeTx);
	while (size && connected) {
		txPtr += sizeTx;
		sizeTx = Math.min(size, 59);
		tmp = data.slice(txPtr, txPtr + sizeTx);
			
		buff = [];
		buff[0] = (cid >> 24) & 0xFF;
		buff[1] = (cid >> 16) & 0xFF;
		buff[2] = (cid >> 8)  & 0xFF;
		buff[3] = (cid)  & 0xFF;
		buff[4] = txId++;
		buff = buff.concat(tmp);

		if (deviceWrite(buff) === false) {
		    return false;
        }

		size -= sizeTx;
	}
	
	return true;
}


async function hidRead(timeout) {
	let size = 0;
	let rxId = 0;
	let buff = [];
	
	while (connected) {
		let data = await deviceRead(timeout);
		let dataSize = (data[5] << 8) + data[6];
		let cid = (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
		
		switch (data[4]) {
			case 0xBF: // CMD Error
				throw new UserError("HID command error", 3);
			    break;
				
			case 0x86: // CMD Init
				if ((cid === 0xFFFFFFFF || cid === -1) && dataSize === 0x11) {
					buff = data.slice(7, 7 + dataSize);
					return { cid: 0xFFFFFFFF, data: buff, type: typeCid };
				} else {
				    throw new UserError("HID init CID error", 4);
                }
			    break;
				
			case 0x83: // CMD First data block
				if (cid === channelId) {
					rxId = 0;
					let s = Math.min(dataSize, 57);
					size = dataSize - s;
					buff = data.slice(7, 7 + s);
					if (size === 0) {
					    return { cid: channelId, data: buff, type: typeData };
                    }
				} else {
				    throw new UserError("HID CID error", 5);
                }
			    break;
				
			default: // CMD Data sequence block
				if (cid === channelId) {
					if (size) {
						if (data[4] === rxId) {
							rxId++;
							let s = Math.min(size, 59);
							size -= s;
							buff = buff.concat(data.slice(5, 5 + s));
							if (size === 0) {
							    return { cid: channelId, data: buff, type: typeData };
                            }
						} else {
						    throw new UserError("HID seq error", 6);
                        }
					} else {
					    throw new UserError("HID invalid block", 7);
                    }
				} else {
				    throw new UserError("HID CID error", 8);
                }
			    break;
		}
	}
	
	throw new UserError("HID read error", 9);
}

async function hidInitChannel(timeout) {
	let buff = [];
		
	channelId = 0xFFFFFFFF;
	buff[0] = Math.floor(Math.random() * 256);
	buff[1] = Math.floor(Math.random() * 256);
	buff[2] = Math.floor(Math.random() * 256);
	buff[3] = Math.floor(Math.random() * 256);
	buff[4] = Math.floor(Math.random() * 256);
	buff[5] = Math.floor(Math.random() * 256);
	buff[6] = Math.floor(Math.random() * 256);
	buff[7] = Math.floor(Math.random() * 256);
	
	commandInProgress = true;
	if (hidSend(buff, channelId, typeCid)) {
		let ret;
		
		try {
			ret = await hidRead(timeout);
		} catch (err) {
			console.log("Init channel error: ", err);
			commandInProgress = false;
			return false;
		}
			
		if (ret.cid === channelId) {
			if ((buff[0] === ret.data[0]) && (buff[1] === ret.data[1]) && (buff[2] === ret.data[2]) && (buff[3] === ret.data[3]) && 
				(buff[4] === ret.data[4]) && (buff[5] === ret.data[5]) && (buff[6] === ret.data[6]) && (buff[7] === ret.data[7])) {
				channelId = (ret.data[8] << 24) | (ret.data[9] << 16) | (ret.data[10] << 8) | ret.data[11];
				commandInProgress = false;
				return true;
			}
		}
	}
			
	commandInProgress = false;
	return false;
}

async function hidCommand(data, timeout) {
	commandInProgress = true;

	if (hidSend(data, channelId, typeData)) {
		let ret;
		
		try {
			ret = await hidRead(timeout);
		} catch (err) {
			commandInProgress = false;
			return false;
		}
		
		if (ret.cid === channelId && ret.type === typeData) {
			commandInProgress = false;
			return ret.data;
		}
	}
	
	commandInProgress = false;
	return false;
}
//-------------------------------------  Low level USB HID functions  -----------------------------------------------------



//-------------------------------------  General functions  ---------------------------------------------------------------
async function hidGetStatus(timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetStatus", CmdId: rnd() }), timeout);

	if (ret) {
	    return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidAddUser(name, admin, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "AddUser", Name: name, Admin: admin, CmdId: rnd() }), timeout);

	if (ret) {
	    return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidInitRnd(timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "InitRnd", CmdId: rnd() }), timeout);

	if (ret) {
	    return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidSetTime(timeout) {
    let epoch = Math.round(new Date().getTime() / 1000.0);
	let ret = await hidCommand(jsonToArray({ Command: "SetTime", Time: epoch, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}
//-------------------------------------  General functions  ---------------------------------------------------------------


//-------------------------------------  Passwords functions  -------------------------------------------------------------
async function hidGetPasswords(timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetPasswords", CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidGetPasswordData(index, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetPasswordData", Index: index, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidDeletePassword(index, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "DelPassword", Index: index, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidAddPassword(name, pass, random, symbols, timeout) {
	let cmd;
	
	if (random) {
		cmd = { Command: "AddPassword", Name: name, Rnd: random, Symbols: symbols, CmdId: rnd() };
    } else {
		cmd = { Command: "AddPassword", Name: name, Password: pass, CmdId: rnd() };
    }

    let ret = await hidCommand(jsonToArray(cmd), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidAdd2FA(name, type, key, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "Add2FA", Name: name, Type: type, Key: key, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidDel2FA(index, timeout) {
	let ret = await hidCommand(jsonToArray({Command: "Del2FA", Index: index, CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}
//-------------------------------------  Passwords functions  -------------------------------------------------------------


//-------------------------------------  Wallets functions  ---------------------------------------------------------------
async function hidGetWallets(timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetWallets", CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidDeleteWallet(index, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "DelWallet", Index: index, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidAddWallet(name, type, key, otptions, timeout) {
	let cmd = Object.assign({ Command: "AddWallet", Name: name, Type: type, Key: key, CmdId: rnd() }, otptions);
    let ret = await hidCommand(jsonToArray(cmd), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidGetWalletData(index, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetWalletData", Index: index, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidGetWalletPubKey(index, timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "GetWalletPubKey", Index: index, CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidSignTransaction(index, tx, curve, input, inputs, timeout) {
	let cmd = Object.assign({Command: "SignTransaction", Tx: tx, Index: index, Curve: curve, CmdId: rnd()}, {Input: input + "/" + inputs});
    let ret = await hidCommand(jsonToArray(cmd), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}
//-------------------------------------  Wallets functions  ---------------------------------------------------------------


//-------------------------------------  Settings functions  --------------------------------------------------------------
async function hidGetSettings(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "GetSettings", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidSetSettings(settings, timeout) {
	let cmd = Object.assign(settings, {Command: "SetSettings", CmdId: rnd()});
    let ret = await hidCommand(jsonToArray(cmd), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidClearMemory(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "ClearMemory", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidBackupKey(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "BackupKey", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidBackupReadBlock(addr, size, timeout) {
	let ret = await hidCommand(jsonToArray({Command: "BackupBlockRead", Addr: addr, Size: size, CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidBackupWriteBlock(addr, size, hex_data, timeout) {
	let ret = await hidCommand(jsonToArray({Command: "BackupBlockWrite", Addr: addr, Size: size, Data: hex_data, CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}
//-------------------------------------  Settings functions  --------------------------------------------------------------


//-------------------------------------  Boot functions  ------------------------------------------------------------------
async function hidSetBootMode(timeout) {
	let ret = await hidCommand(jsonToArray({ Command: "SetBootMode", CmdId: rnd() }), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidRestart(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "Restart", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidSetFirmwareMode(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "ExitBoot", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidBootWriteBlock(addr, size, hex_data, timeout) {
	let ret = await hidCommand(jsonToArray({Command: "BootWrite", Addr: addr, Size: size, Data: hex_data, CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function hidBootCheckFirmware(timeout) {
	let ret = await hidCommand(jsonToArray({Command: "BootCheckFirmware", CmdId: rnd()}), timeout);

	if (ret) {
		return arrayToJson(ret);
    }

	return { Error: 'USB command error' };
}

async function firmwareDownload(serial, timeout) {
	return new Promise((resolve) => {
		let ret = false;
		let req = new XMLHttpRequest();
		let tmr = setTimeout(() => { req.abort(); resolve(ret) }, timeout);
		
		req.responseType = "arraybuffer";
		req.open('GET', 'https://wallet.security-arts.com/firmware.php?&rnd=' + Math.random() + '&serial=' + serial, true);
		req.onload = () => {
			ret = req.response;
			clearTimeout(tmr);
			resolve(ret);
		};
		
		req.onerror = () =>	{
			clearTimeout(tmr);
			resolve(ret);
		};
		
		req.send();
	});
}

function firmwareVersion(serial, timeout) {
	return new Promise((resolve) => {
		let req = new XMLHttpRequest();
		let ret = { 'FirmwareVersion': 0.0 };
		let tmr = setTimeout(() => {req.abort(); resolve(ret)}, timeout);
		
		req.responseType = 'json';
		req.open('GET', 'https://wallet.security-arts.com/firmware.php?version=true&serial=' + serial + '&rnd=' + Math.random(), true);
		req.onload = () =>	{
			clearTimeout(tmr);
			try 
			{
				ret = JSON.parse(req.response.data);
				resolve(ret);
			} catch(e) {
				resolve(ret)
			}
		};
		
		req.onerror = () =>	{
			clearTimeout(tmr);
			resolve(ret);
		};
		
		req.send();
	});
}
//-------------------------------------  Boot functions  ------------------------------------------------------------------

