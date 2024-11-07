const { v4: uuidv4 } = require('uuid');

function generateUniqueName() {
    return `User_${uuidv4()}`;
}

module.exports = generateUniqueName;