'use strict';

const Decimal = require('decimal.js');

function bigNumMult(a, b) {

	try {
		a = new Decimal(a);
		b = new Decimal(b);
	} catch (err) {
		return 0;
	}

	a = a.times(b);

	if (a.toHexadecimal().length > 32) return 0;
	return a;
}

function bigNumDiv(a, b) {

	try {
		a = new Decimal(a);
		b = new Decimal(b);
	} catch (err) {
		return 0;
	}

	a = a.div(b);

	if (a.toHexadecimal().length > 32) return 0;
	return a;
}

function bigNumAdd(a, b) {

	try {
		a = new Decimal(a);
		b = new Decimal(b);
	} catch (err) {
		return 0;
	}

	a = a.add(b);

	if (a.toHexadecimal().length > 32) return 0;
	return a;
}

function bigNumSub(a, b) {

	try {
		a = new Decimal(a);
		b = new Decimal(b);
	} catch (err) {
		return 0;
	}

	a = a.sub(b);

	if (a.toHexadecimal().length > 32) return 0;
	return a;
}

function bigNumPow(a, b) {

	try {
		a = new Decimal(a);
		b = new Decimal(b);
	} catch (err) {
		return 0;
	}

	a = a.pow(b);

	if (a.toHexadecimal().length > 32) return 0;
	return a;
}

function bigNum(a) {

	let num;

	try {
		num = new Decimal(a);
	} catch (err) {
		num = 0;
	}

	return num;
}


function bigNumToStr(a, digits = 18) {
	a = a.toFixed(digits);

	if (a.indexOf('.') !== -1) {

		while (a[a.length - 1] === '0') {
			a = a.slice(0, -1);
		}
	}

	if (a[a.length - 1] === '.') {
		a = a.slice(0, -1);
	}

	return a;
}

function bigNumToHex(a) {
	return a.toHexadecimal();
}

