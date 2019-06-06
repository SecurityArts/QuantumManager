const bitcoinNetworks = {
    bitcoin: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'bc',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x00,
        scriptHash: 0x05,
        wif: 0x80,
        dustThreshold: 546 // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
    },
    testnet: {
        messagePrefix: '\x18Bitcoin Signed Message:\n',
        bech32: 'tb',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394
        },
        pubKeyHash: 0x6f,
        scriptHash: 0xc4,
        wif: 0xef,
        dustThreshold: 546
    },

    litecoin: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bip32: {
            public: 0x019da462,
            private: 0x019d9cfe
        },
        pubKeyHash: 0x30,
        scriptHash: 0x32,
        scriptHash2: 0x05, // old '3' prefix. available for backward compatibility.
        wif: 0xb0,
        dustThreshold: 0 // https://github.com/litecoin-project/litecoin/blob/v0.8.7.2/src/main.cpp#L360-L365
    },
    litecoin_testnet: {
        messagePrefix: '\x19Litecoin Signed Message:\n',
        bip32: {
            public: 0x019da462,
            private: 0x019d9cfe
        },
        pubKeyHash: 0x6f,
        scriptHash: 0x3a,
        scriptHash2: 0xc4,
        wif: 0xef,
        dustThreshold: 0
    },

    dogecoin: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip32: {
            public: 0x02facafd,
            private: 0x02fac398
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
        dustThreshold: 0 // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
    },
    dogecoin_testnet: {
        messagePrefix: '\x19Dogecoin Signed Message:\n',
        bip32: {
            public: 0x02facafd,
            private: 0x02fac398
        },
        pubKeyHash: 0x71,
        scriptHash: 0xc4,
        wif: 0xf1,
        dustThreshold: 0 // https://github.com/dogecoin/dogecoin/blob/v1.7.1/src/core.h#L155-L160
    },

    dash: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x4c,
        scriptHash: 0x10,
        wif: 0xcc,
        dustThreshold: 5460 // https://github.com/dashpay/dash/blob/v0.12.0.x/src/primitives/transaction.h#L144-L155
    },
    dash_testnet: {
        messagePrefix: '\x19DarkCoin Signed Message:\n',
        bip32: {
            public: 0x043587cf,
            private: 0x04358394
        },
        pubKeyHash: 0x8c,
        scriptHash: 0x13,
        wif: 0xef,
        dustThreshold: 5460 // https://github.com/dashpay/dash/blob/v0.12.0.x/src/primitives/transaction.h#L144-L155
    },

    pivx: {
        messagePrefix: '\x19Pivx Signed Message:\n',
        bip32: {
            public: 0x0488ade4, //??????????????
            private: 0x0488b21e, //????????????
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x0d,
        wif: 0xd4
    },

    pivx_testnet: {
        messagePrefix: '\x19Pivx Signed Message:\n',
        bip32: {
            public: 0x0488ade4, //??????????????
            private: 0x0488b21e, //????????????
        },
        pubKeyHash: 0x8b,
        scriptHash: 0x13,
        wif: 0xef
    },

    btg: {
        messagePrefix: '\x1CBitcoinGold Signed Message:\n',
        bech32: 'bc',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x26,
        scriptHash: 0x17,
        wif: 0x80,
        dustThreshold: 546 // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
    },

    dgb: {
        messagePrefix: '\x19DigiByte Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x05,
        wif: 0x80,
        dustThreshold: 546 // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
    },

    xsn: {
        messagePrefix: '\x15XSN Signed Message:\n',
        bip32: {
            public: 0x0488b21e,
            private: 0x0488ade4
        },
        pubKeyHash: 0x4c,
        scriptHash: 0x10,
        wif: 0xcc,
        dustThreshold: 0
    },
    xsn_testnet: {
        messagePrefix: '\x15XSN Signed Message:\n',
        bip32: {
            public: 0x0488b21e, //?????????????
            private: 0x0488ade4 //?????????????
        },
        pubKeyHash: 0x8c,
        scriptHash: 0x13,
        wif: 0xef,
        dustThreshold: 546 // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
    },

    zcash: {
        messagePrefix: '\x18Zcash Signed Message:\n',
        bip32: {
            public: 0x0488B21E,
            private: 0x0488ADE4,
        },
        pubKeyHash: 0x1CB8,
        scriptHash: 0x1CBD,
        wif: 0x80,
    },
    zcash_testnet: {
        messagePrefix: '\x18Zcash Signed Message:\n',
        bip32: {
            public: 0x043587CF,
            private: 0x04358394,
        },
        pubKeyHash: 0x1D25,
        scriptHash: 0x1CBA,
        wif: 0xEF,
    },
};

module.exports = bitcoinNetworks;