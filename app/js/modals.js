'use strict';

function sleep(ms) {
    return new Promise(resolve => {setTimeout(resolve, ms)});
}

async function modalYesNo(textCancel, textYes, textTitle, textBody) {
	return new Promise((resolve) => {
	
		let ret = false;

		if (textCancel == '') {
			$("#modal_yes_no_cancel").hide();
		} else {
			$("#modal_yes_no_cancel").show();
		}
		
		if (textYes == '') {
			$("#modal_yes_no_ok").hide();
		} else {
			$("#modal_yes_no_ok").show();
		}
		
		$("#modal_yes_no_ok" ).unbind("click").on("click", () => {
			ret = true;
			$("#modal_dialog_yes_no").modal('hide');
		});
	  
		$("#modal_yes_no_cancel").unbind("click").on("click", () => {
			$("#modal_dialog_yes_no").modal('hide');
		});
										
		$("#modal_dialog_yes_no").unbind("hidden.bs.modal").on("hidden.bs.modal", () => {
			resolve(ret);
		});
										
		$('#modal_yes_no_ok').text(textYes);
		$('#modal_yes_no_text').text(textBody);
		$('#modal_yes_no_title').text(textTitle);
		$('#modal_yes_no_cancel').text(textCancel);		
		
		$(document).unbind("keyup").keyup((e) => {
			if (e.which === 13) {
				$("#modal_yes_no_ok").click();
			}
		});
		
		$('#modal_dialog_yes_no').modal();
	});
}

async function modalAddUser(isAdmin) {
	return new Promise((resolve) => {
		let ret = false;
		$("#modal_user_name").val("");

		if (isAdmin) {
			$("#modal_user_admin")
				.prop('checked', true)
				.prop('disabled', false);
		} else {
			$("#modal_user_admin")
				.prop('checked', false)
				.prop('disabled', true);
		}
										
		$("#modal_user_ok" ).unbind("click").on("click", () => {
			if ($("#modal_user_name").val()) {
				ret = {
					Name: $("#modal_user_name").val(),
					Admin: $("#modal_user_admin").is(':checked')
				};
			}

			$("#modal_add_user").modal('hide');
		});
	  
		$("#modal_user_cancel").unbind("click").on("click", () => {
			$("#modal_add_user").modal('hide');
		});
										
		$("#modal_add_user").unbind("hidden.bs.modal").on("hidden.bs.modal", () => {
			resolve(ret);
		}).unbind("shown.bs.modal").on("shown.bs.modal", () => {
			$("#modal_user_name").focus();
		});
										
		$(document).unbind("keyup").keyup((e) => {
			if (e.which === 13) {
				$("#modal_user_ok").click()
			}
		});

		$('#modal_add_user').modal();
	});
}


function modalAddPasswordHandleEnter(str, addEnter) {
	if (addEnter) {
		if (str.length < 2 || (str.length >= 2 && (str.lastIndexOf('\\r') !== (str.length - 2)))) {
			str += '\\r';
		}
	} else {
		if (str.length >= 2 && (str.lastIndexOf('\\r') === str.length - 2)) {
			str = str.substring(0, str.length - 2);
		}
	}

	return str;
}

async function modalAddPassword() {
	return new Promise((resolve) => {
		let ret = false;
		let addEnter = false;
										
		$('#modal_pass_data').val('');
		$('#modal_pass_name').val('');
		$('#modal_pass_login').val('');
		$('#modal_pass_data1').val('');
		$('#modal_pass_rnd_len').val('');
		$('#modal_pass_card1_num').val('');
		$('#modal_pass_card1_holder').val('');
		$('#modal_pass_card1_date').val('');
		$('#modal_pass_card1_cvv').val('');
		
		$('#modal_pass_card2_num').val('');
		$('#modal_pass_card2_date').val('');
		$('#modal_pass_card2_cvv').val('');
		
		
		$('#modal_pass_opt1').prop('checked', true);
		$('#modal_pass_opt2').prop('checked', true);
		$('#modal_pass_opt3').prop('checked', true);
		$('#modal_pass_opt4').prop('checked', false);
		$('#modal_pass_gen_enter').prop('checked', false);

		$('#modal_pass_login').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});

		$('#modal_pass_data1').unbind('change').on('change', () => {
			const userData = $('#modal_pass_login').val() + '\\t' + $('#modal_pass_data1').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});

		$('#modal_pass_gen_enter').unbind('change').on('change', () => {
			let userData = $('#modal_pass_data').val();
			addEnter = $('#modal_pass_gen_enter').is(':checked');

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		//---------------  Credit card1  --------------------------
		$('#modal_pass_card1_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_holder').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card1_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card1_num').val() + '\\t' + $('#modal_pass_card1_holder').val() + '\\t' +
							 $('#modal_pass_card1_date').val() + '\\t' + $('#modal_pass_card1_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		//---------------  Credit card1  --------------------------
		
		
		//---------------  Credit card2  --------------------------
		$('#modal_pass_card2_num').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card2_date').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		
		$('#modal_pass_card2_cvv').unbind('change').on('change', () => {
			const userData = $('#modal_pass_card2_num').val() + '\\t' +
							 $('#modal_pass_card2_date').val() + '\\t' + $('#modal_pass_card2_cvv').val();

			const handler = modalAddPasswordHandleEnter(userData, addEnter);
			$('#modal_pass_data').val(handler);
		});
		//---------------  Credit card2  --------------------------
		
		
		
		$('#modal_pass_type').unbind('change').on('change', () => {
			switch ($('#modal_pass_type').val()) {
				case 'Password':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_pass').show();
					break;
				
				case 'Random password':
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_gen_enter').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_rdn').show();
					break;
				
				case 'Login and Password':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').show();
					break;
					
				case 'Credit Card 1':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card2').hide();
					$('#modal_pass_type_credit_card1').show();
					break;
					
				case 'Credit Card 2':
					$('#modal_pass_type_rdn').hide();
					$('#modal_pass_type_pass').hide();
					$('#modal_pass_type_gen_enter').show();
					$('#modal_pass_type_log_pass').hide();
					$('#modal_pass_type_credit_card1').hide();
					$('#modal_pass_type_credit_card2').show();
					break;
			}
		}).val('Password').change();
																			
		$('#modal_pass_ok').unbind('click').on('click', () => {
			if ($('#modal_pass_name').val()) {
				ret = false;

				if ($('#modal_pass_type').val() === 'Random password' && $('#modal_pass_rnd_len').val()) {
					let options = 0;
					if ($('#modal_pass_opt1').is(':checked')) {
						options |= (1 << 0);
					}
					if ($('#modal_pass_opt2').is(':checked')) {
						options |= (1 << 1);
					}
					if ($('#modal_pass_opt3').is(':checked')) {
						options |= (1 << 2);
					}
					if ($('#modal_pass_opt4').is(':checked')) {
						options |= (1 << 3);
					}

					ret = {
						Name: $('#modal_pass_name').val(),
						Rnd: $('#modal_pass_rnd_len').val(),
						Symbols: options
					};
				} else {
					if ($('#modal_pass_data').val()){
						ret = {
							Name: $('#modal_pass_name').val(),
							Password: $('#modal_pass_data').val()
						};
					}
				}
			}
			$('#modal_pass_data').val('');
			$('#modal_pass_name').val('');
			$('#modal_add_pass').modal('hide');
		});
	  
		$('#modal_pass_cancel').unbind('click').on('click', () => {
			$('#modal_add_pass').modal('hide');
		});
										
		$('#modal_add_pass').unbind('hidden.bs.modal').on('hidden.bs.modal', () => {
			resolve(ret);
		}).unbind('shown.bs.modal').on('shown.bs.modal', () => {
			$('#modal_pass_name').focus();
		}).modal();
		
		$(document).unbind('keyup').keyup((e) => {
			if (e.which === 13) {
				$('#modal_pass_ok').click()
			}
		});
	});
}

async function modalAdd2FA(textCancel, textYes, textTitle) {
	return new Promise((resolve) => {
		let ret = false;

		$('#modal_add_2fa_type').val("U2F");
		$('#modal_add_2fa_key').val('').prop('disabled', true);
												
		$("#modal_add_2fa_ok" ).unbind("click").on("click", () => {
			ret = {
				Type: $('#modal_add_2fa_type').val(),
				Key: $('#modal_add_2fa_key').val()
			};

			$('#modal_add_2fa_key').val('');
			$("#modal_add_2fa").modal('hide');
		});
	  
		$("#modal_add_2fa_cancel").unbind("click").on("click", () => {
			$("#modal_add_2fa").modal('hide');
		}).text(textCancel);
										
		$("#modal_add_2fa").unbind("hidden.bs.modal").on("hidden.bs.modal", (e) => {
			resolve(ret);
		});
										
		$("#modal_add_2fa_type").unbind("click").on("click", () => {
			$("#modal_add_2fa_key").prop('disabled', ($('#modal_add_2fa_type').val() == 'U2F'));
		});
										
		$('#modal_add_2da_ok').text(textYes);
		$('#modal_add_2fa_title').text(textTitle);
		
		$(document).unbind("keyup").keyup((e) => {
			if (e.which === 13) {
				$("#modal_add_2da_ok").click()
			}
		});
		$('#modal_add_2fa').modal();
	});
}

async function modalAddWallet() {
	return new Promise((resolve) => {
		let ret = false;
		let segwit = ['BTC'];
		let testnet = ['BTC', 'LTC', 'DOGE', 'DASH', 'XRP', 'ZEC'];
										
		$("#modal_wallet_key")
			.val("")
			.prop('disabled', false);
			
		$("#modal_wallet_name").val("");
		$("#modal_wallet_segwit").prop('checked', false);
		$("#modal_wallet_testnet")
			.prop('checked', false)
			.prop('disabled', false);

		$("#modal_wallet_type")
			.val("BTC")
			.unbind("change").on("change", () => {
			let val = $("#modal_wallet_type").val();
											
			if (segwit.indexOf(val) >= 0) {
				$("#modal_wallet_segwit")
					.prop('checked', false)
					.prop('disabled', false);
			} else {
				$("#modal_wallet_segwit")
					.prop('checked', false)
					.prop('disabled', true);
			}
											
			if (testnet.indexOf(val) >= 0) {
				$("#modal_wallet_testnet").prop('disabled', false);
			} else {
				$("#modal_wallet_testnet")
					.prop('checked', false)
					.prop('disabled', true);
			}
		});

		$("#modal_wallet_rnd")
			.prop('checked', false)
			.unbind("click").on("click", () => {
			$("#modal_wallet_key").prop('disabled', $("#modal_wallet_rnd").is(':checked'));
		});

		$("#modal_wallet_ok" ).unbind("click").on("click", () => {
			if ($("#modal_wallet_name").val()) {
				let options = {};
				if ($("#modal_wallet_rnd").is(':checked')) options = Object.assign(options, {Rnd: true});
				if ($("#modal_wallet_segwit").is(':checked')) options = Object.assign(options, {SegWit: true});
				if ($("#modal_wallet_testnet").is(':checked')) options = Object.assign(options, {TestNet: true});
				ret = {
					Name: $("#modal_wallet_name").val(),
					Key: $("#modal_wallet_key").val(),
					Type: $("#modal_wallet_type").val(),
					Options: options
				};
			}

			$("#modal_wallet_key").val("");
			$("#modal_wallet_name").val("");
			$("#modal_add_wallet").modal('hide');
		});
	  
		$("#modal_wallet_cancel").unbind("click").on("click", () => {
			$("#modal_add_wallet").modal('hide');
		});

		$("#modal_add_wallet").unbind("hidden.bs.modal").on("hidden.bs.modal", () => {
			resolve(ret);
		});

		$("#modal_add_wallet").unbind("shown.bs.modal").on("shown.bs.modal", () => {
			$("#modal_wallet_name").focus();
		});
										
		$(document).unbind("keyup").keyup((e) => {
			if (e.which === 13) {
				$("#modal_wallet_ok").click()
			}
		});

		$('#modal_add_wallet').modal();
	});
}

function modalKbdU2fShow(title, img) {
	$('#modal_kbd_u2f_title').text(title);
	$('#modal_kbd_u2f_img').attr('src', 'img/' + img);
	$('#modal_kbd_u2f').modal({keyboard: false});
}

function modalKbdU2fHide() {
	$('#modal_kbd_u2f').modal('hide');
}

function modalWaitDevShow() {
	$('#modal_wait_dev').modal({keyboard: false});
}

function modalWaitDevHide() {
	$('#modal_wait_dev').modal('hide');
}

function modalAboutShow() {
	$('#modal_about').modal({keyboard: false});
}



//-------------------------------------  Transaction modal  ---------------------------------------------------------------
let modalTransactionVisible = false;
let modalTransactionConfirm = false;

function modalTransactionStatus(stat) {
	$('#modal_tarnsaction_status').text(stat);
}

function modalTransactionTx(tx) {
	$('#modal_tarnsaction_transaction').text(tx);
}

function modalTransactionShow(from, to, amount, fee, remainder, ticker, stat = false) {
	modalTransactionVisible = true;
	modalTransactionConfirm = false;
	
	$('#modal_tarnsaction_to').text(to);
	$('#modal_tarnsaction_from').text(from);
	$('#modal_tarnsaction_fee').text(fee + ticker);
	$('#modal_tarnsaction_amount').text(amount + ticker);
	$('#modal_tarnsaction_balance').text(remainder + ticker);
	$('#modal_tarnsaction_transaction').text('');

	if (stat) {
		$('#modal_tarnsaction_status').text(stat);
	}

	$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-down-open-big"></span>');
	$('#modal_transaction_btn_cancel').prop('disabled', true);
	$('#modal_transaction_btn_broadcast').prop('disabled', true);

	$('#modal_transaction_collapse')
		.collapse('hide')
		.unbind('hidden.bs.collapse').on('hidden.bs.collapse', () => {
		$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-down-open-big"></span>');
	})
		.unbind('shown.bs.collapse').on('shown.bs.collapse', () => {
		$('#modal_tarnsaction_collapse_btn').html('<span class="icon icon-up-open-big"></span>');
	});
	
	$('#modal_tarnsaction_copy_tx').unbind('click').on('click', () => {
		clipboard.writeText($('#modal_tarnsaction_transaction').text());
	});
	
	$('#modal_transaction').modal({keyboard: false});
}

function modalTransactionEnable() {
	$('#modal_transaction_btn_cancel').prop('disabled', false);
	$('#modal_transaction_btn_broadcast').prop('disabled', false);
}

function modalTransactionBroadcast() {
	modalTransactionConfirm = true;
	modalTransactionVisible = false;
	$('#modal_transaction').modal('hide');
}

function modalTransactionHide() {
	modalTransactionVisible = false;
	$('#modal_transaction').modal('hide');
}

async function modalTransactionWaitConfirm() {
	while (modalTransactionVisible) {
		await sleep(100);
	}

	return modalTransactionConfirm;
}

//-------------------------------------  Transaction modal  ---------------------------------------------------------------