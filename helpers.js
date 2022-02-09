// import 'big.js';
const Big = require('big.js');

module.exports = {
    forex: function(base, curr, amount) {
        let pairs = {
            'EURBGN': 1.9545,
        };
        // console.log('aa ', base, curr, pairs[ base + curr ]);
        return new Big( pairs[ base + curr ] ).times(amount).toNumber();
    }
};