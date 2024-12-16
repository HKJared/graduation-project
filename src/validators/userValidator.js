// Các thông điệp lỗi
const ERROR_MESSAGES = {
    INVALID_EMAIL: "Email không hợp lệ.",
    INVALID_PHONE: "Số điện thoại không hợp lệ.",
    INVALID_PASSWORD: "Mật khẩu phải ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số.",
    INVALID_USERNAME: "Tên tài khoản phải từ 8 đến 30 ký tự và không chứa khoảng trắng."
};

// Kiểm tra email có hợp lệ hay không
function isValidEmail(email) {
    return email ? true : false;
}

// Kiểm tra số điện thoại có hợp lệ hay không (dành cho Việt Nam)
function isValidPhoneNumber(phoneNumber) {
    const phoneRegex = /^(03|05|07|08|09|01[2|6|8|9])[0-9]{8}$/; // Số điện thoại Việt Nam
    return phoneRegex.test(phoneNumber);
}

// Kiểm tra mật khẩu có hợp lệ hay không
// Quy tắc: ít nhất 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}

// Kiểm tra tên tài khoản có hợp lệ hay không
// Quy tắc: 8-30 ký tự, không chứa khoảng trắng
function isValidUsername(username) {
    return username && username.length >= 8 && username.length <= 30 && !/\s/.test(username);
}

// Hàm kiểm tra dữ liệu người dùng
function validateUserData(userData) {
    const errors = [];

    if (!userData.email || !isValidEmail(userData.email)) {
        errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }

    if (!userData.phone || !isValidPhoneNumber(userData.phone)) {
        errors.push(ERROR_MESSAGES.INVALID_PHONE);
    }

    if (!userData.password || !isValidPassword(userData.password)) {
        errors.push(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    if (!userData.username || !isValidUsername(userData.username)) {
        errors.push(ERROR_MESSAGES.INVALID_USERNAME);
    }

    return {
        isValid: errors.length === 0,
        errors: errors.join(' ')
    };
}

// Xuất các hàm và thông điệp lỗi để sử dụng ở các phần khác của dự án
module.exports = {
    ERROR_MESSAGES,
    isValidEmail,
    isValidPhoneNumber,
    isValidPassword,
    isValidUsername,
    validateUserData
};