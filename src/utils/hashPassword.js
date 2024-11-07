const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// // console.log(hashPassword('wiseowl@admin004370'));

module.exports = hashPassword;