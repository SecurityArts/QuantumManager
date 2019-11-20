"use strict";


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
		rows += `<tr style="background-color: ${colors[i & 1]}"><td>${i++}</td><td>${item.name}</td><td>${item.symbol}</td><td>$${price}</td><td>$${cap}</td><td>$${volume}</td><td>${change}%</td></tr>`;
	});
			
	$('#table_market_data_body').html(rows);
	uiShowSection('market');
}

async function marketGetData() {
	
	$('#table_market_data_body').html('');
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
	}).catch(() => null);
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

