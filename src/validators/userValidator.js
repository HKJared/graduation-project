// Kiểm tra email có hợp lệ hay không
function isValidEmail(email) {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
}

// Kiểm tra số điện thoại có hợp lệ hay không (dành cho Việt Nam)
function isValidPhoneNumber(phoneNumber) {
    const phoneRegex = /^(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phoneNumber);
}

// Kiểm tra mật khẩu có hợp lệ hay không
// Quy tắc: ít nhất 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
}

// Kiểm tra tên tài khoản có hợp lệ hay không
function isValidUsername(username) {
    return username && username.length >= 8 && username.length <= 30;
}

// Hàm kiểm tra dữ liệu người dùng
function validateUserData(userData) {
    const errors = [];

    if (!userData.email || !isValidEmail(userData.email)) {
        errors.push("Email không hợp lệ");
    }

    if (!userData.phone || !isValidPhoneNumber(userData.phone)) {
        errors.push("Số điện thoại không hợp lệ");
    }

    if (!userData.password || !isValidPassword(userData.password)) {
        errors.push("Mật khẩu phải ít nhất 8 ký tự, bao gồm cả chữ hoa, chữ thường và chữ số");
    }

    if (!userData.username || !isValidUsername(userData.username)) {
        errors.push("Tên tài khoản phải từ 8 đến 30 ký tự");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

// Xuất các hàm để có thể sử dụng ở các phần khác của dự án
module.exports = {
    isValidEmail,
    isValidPhoneNumber,
    isValidPassword,
    isValidUsername,
    validateUserData
};