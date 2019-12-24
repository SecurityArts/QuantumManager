"use strict";

async function firmwareGetUpdateFile(serial, timeout = 10000) {
	return new Promise((resolve) => {

		let ret = false;
		let req = new XMLHttpRequest();
		let tmr = setTimeout(() => {req.abort(); resolve(ret)}, timeout);

		req.responseType = 'arraybuffer';
		req.open('GET', 'https://wallet.security-arts.com/firmware.php?&rnd=' + rnd() + '&serial=' + serial, true);
		req.onload = () => {
			clearTimeout(tmr);
			ret = req.response;
			resolve(ret);
		};

		req.onerror = () =>	{
			clearTimeout(tmr);
			resolve(ret);
		};

		req.send();
	});
}

function firmwareGetUpdateVersion(serial, timeout = 5000) {
	return new Promise((resolve) => {

		let req = new XMLHttpRequest();
		let ret = {'FirmwareVersion': 0.0};
		let tmr = setTimeout(() => {req.abort(); resolve(ret)}, timeout);

		req.responseType = 'json';
		req.open('GET', 'https://wallet.security-arts.com/firmware.php?version=true&rnd=' + rnd() + '&serial=' + serial, true);
		req.onload = () => {
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