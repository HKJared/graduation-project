$(document).ready(function () {
    var path = window.location.pathname;

    updateViewBasedOnPath(path);

    $(document).on('click', '#login', function (event) {
        event.stopPropagation();
        window.history.pushState({}, '', '/login');
        updateViewBasedOnPath('/login');
    });

    $(document).on('click', '#register', function (event) {
        event.stopPropagation();
        window.history.pushState({}, '', '/register');
        updateViewBasedOnPath('/register');
    });

    // Xử lý sự kiện popstate khi người dùng nhấn quay lại hoặc tiến tới
    window.addEventListener('popstate', function (event) {
        updateViewBasedOnPath(window.location.pathname);
    });

    // Xử lí các sự kiện của form đăng nhập, đăng ký
    $(document).on('submit', '#loginForm', function (event) {
        event.preventDefault();

        var username = $(this).find('#username_login').val();
        var password = $(this).find('#password_login').val();

        if (!checkUserName(username)) {
            $('#loginForm #username_login').addClass('warning-border');
            return;
        }

        if (!checkPassword(password)) {
            $('#loginForm #password_login').addClass('warning-border');
            return;
        }

        const account = {
            username: username,
            password: password
        };

        login(account);
    });

    $(document).on('submit', '#inputPhoneNumberForm', function (event) {
        event.preventDefault();

        const phone_number = $(this).find('#phone_number_signin').val();

        if (!validatePhoneNumber(phone_number)) {
            $('#phone_number_signin').addClass('warning-border');
            showNotification('Số điện thoại không hợp lệ, vui lòng kiểm tra lại.');
            return;
        }

        showConfirm(`Chúng tôi sẽ gửi mã xác nhận đến số điện thoại ${phone_number}`, 'Gửi mã xác nhận', '', function (result) {
            if (result) {
                sentOTPtoPhoneNumber(phone_number);
            }
        });
    });

    $(document).on('click', '#togglePasswordRegister', function () {
        var passwordInput = $(this).closest('form').find('#password_register');
        var eyeIcon = $(this).find('i');
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            eyeIcon.removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            passwordInput.attr('type', 'password');
            eyeIcon.removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $(document).on('click', '#togglePasswordLogin', function () {
        var passwordInput = $(this).closest('form').find('#password_login');
        var eyeIcon = $(this).find('i');
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            eyeIcon.removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            passwordInput.attr('type', 'password');
            eyeIcon.removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    // nút quay lại
    $(document).on('click', '.back-btn', function(event) {
        event.stopPropagation();

        updateViewBasedOnPath(path)
    });

    // Xử lí các sự kiện của form xác minh số điện thoại
    $(document).on('input', '.otp-input', function () {
        var otpInputs = $('.otp-input');
        var index = otpInputs.index(this);
    
        // Chuyển sang ô tiếp theo nếu ô hiện tại đã được nhập
        if ($(this).val().length === 1 && index < otpInputs.length - 1) {
            otpInputs.eq(index + 1).focus();
        } else if ($(this).val().length === 0 && index > 0) {
            otpInputs.eq(index - 1).focus();
        }
    
        checkOtpInputs();
    });
    
    $(document).on('keydown', '.otp-input', function (e) {
        e.preventDefault();
        var otpInputs = $('.otp-input');
        var index = otpInputs.index(this);
    
        // Nếu nhấn phím Backspace
        if (e.key === "Backspace") {
            // Nếu ô hiện tại rỗng và không phải ô đầu tiên, chuyển sang ô trước đó
            if ($(this).val() == '' && index > 0) {
                otpInputs.eq(index - 1).val('').focus(); // Chuyển sang ô trước đó và xóa nội dung
            }

            if ($(this).val() != '' ) {
                $(this).val('')
            }
        } else if (e.key.length === 1 && e.key.match(/[0-9]/)) { // Chỉ cho phép nhập số
            // Nếu ô hiện tại không rỗng thì không cho nhập thêm
            if ($(this).val() === '') {
                $(this).val(e.key); // Gán giá trị cho ô hiện tại
                // Chuyển sang ô tiếp theo
                if (index < otpInputs.length - 1) {
                    otpInputs.eq(index + 1).focus(); // Chuyển sang ô tiếp theo
                }
            } else {
                // Nếu ô hiện tại đã có giá trị, tự động chuyển sang ô tiếp theo và gán giá trị
                otpInputs.eq(index + 1).val(e.key).focus(); // Chuyển sang ô tiếp theo và gán giá trị vừa nhập
            }
        } else  if (e.key === "Enter") { // Nếu nhấn phím Enter
            // Gửi biểu mẫu
            $('#otp-verification-form').submit(); // Thay đổi 'otp-verification-form' thành ID của biểu mẫu thực tế của bạn
        }
    });
    
    
    $(document).on('focus', '.otp-input', function () {
        var otpInputs = $('.otp-input');
        var index = otpInputs.index(this);
    
        // Đảm bảo chỉ chuyển focus khi ô hiện tại rỗng
        if ($(this).val() === '') {
            // Tìm ô rỗng đầu tiên bên trái và chuyển focus
            for (var i = index - 1; i >= 0; i--) {
                if (otpInputs.eq(i).val() === '') {
                    otpInputs.eq(i).focus();
                    break;
                }
            }
        }
    });

    $(document).on('submit', '#otp-verification-form', function (event) {
        event.preventDefault();

        var otp = '';
        $('.otp-input').each(function () {
            otp += $(this).val();
        });

        if (otp.length < 6) {
            return
        }
        
        const phone_verification_id = $(this).data('phone-verification-id');
        phoneVerification(phone_verification_id, otp);
    });

    // kiểm tra điều kiện tài khoản khi nhập
    $(document).on('input', '#username_register',function() {
        checkUsernameCondition($(this).val());
    });

    // Kiểm tra điều kiện mật khẩu khi nhập
    $(document).on('input', '#password_register',function() {
        checkPasswordCondition($(this).val());
    });

    $(document).on('submit', '#registerForm',function (event) {
        event.preventDefault();

        const account = {
            username: $('#username_register').val(),
            password: $('#password_register').val(),
            phone_verification_id: $(this).data('phone-verification-id'),
            role_id: 2
        }
        createUser(account);
    });

    $(document).on('click', '.submit-step3-btn', function (event) {
        event.stopPropagation();
        window.history.pushState({}, '', '/login');
        updateViewBasedOnPath('/login');
    });

    $(document).on('click', '.resend-btn', function (event) {
        event.stopPropagation();

        const phone_number = $('#otp-verification-form').data('phone-number');

        sentOTPtoPhoneNumber(phone_number);
    });
});


// các hàm xử lí giao diện
function updateViewBasedOnPath(path) {
    $('.container').removeClass('hidden');
    $('.verification-container').remove();

    if (window.innerWidth <= 768) {
        if (path === '/login') {
            $('.sign-in').css('z-index', 2);
            $('.sign-up').css('z-index', 1);
        } else if (path === '/register') {
            $('.sign-in').css('z-index', 1);
            $('.sign-up').css('z-index', 2);
        }
        return;
    }

    $('.verification-container').css('display', 'none');

    $('.container input').val('');
    $('.container').css('display', 'flex');

    if (path === '/login') {
        document.title = 'Đăng nhập';
        $('#container').addClass('active');
    } else if (path === '/register') {
        document.title = 'Đăng ký';
        $('#container').removeClass('active');
    }
}

function checkUserName(user_name) {
    if (!user_name || user_name == '') {
        showNotification('Vui lòng nhập tên đăng nhập');
        return false;
    }

    if (user_name.includes(' ')) {
        showNotification('Tên đăng nhập không được có khoảng trống');
        return false;
    }

    return true;
}

function checkPassword(password) {
    if (!password || password == '') {
        showNotification('Vui lòng nhập mật khẩu');
        return false;
    }

    if (password.length < 8) {
        showNotification('Mật khẩu cần tối thiểu 8 kí tự');
        return false;
    }

    if (password.includes(' ')) {
        showNotification('Mật khẩu không được có khoảng trống');
        return false;
    }

    return true;
}

function checkOtpInputs() {
    var otpInputs = $('.otp-input');
    var allFilled = true;
    var continueBtn = $('.submit-step1-btn');

    otpInputs.each(function () {
        if ($(this).val().length !== 1) {
            allFilled = false;
            return false; // Thoát khỏi vòng lặp each
        }
    });    

    // Nếu tất cả các ô đã được nhập đầy đủ thì bật nút "Tiếp theo"
    if (allFilled) {
        continueBtn.css('opacity', '1');
        continueBtn.css('cursor', 'pointer');
        continueBtn.prop('disabled', false);
    } else {
        continueBtn.css('opacity', '0.7');
        continueBtn.css('cursor', 'not-allowed');
        continueBtn.prop('disabled', true);
    }
}

function checkUsernameCondition(username) {
    const usernameCondition = $('#username-condition');
    const registerButton = $('#register-btn');
    let valid = true;

    // Kiểm tra độ dài và không có khoảng trống
    if (username.length >= 8 && username.length <= 20 && !username.includes(' ')) {
        usernameCondition.addClass('valid');
    } else {
        usernameCondition.removeClass('valid');
        valid = false;
    }

    // Hiển thị nút đăng ký nếu tất cả các điều kiện đều thỏa mãn
    if (valid && checkPasswordCondition($('#password_register').val())) {
        registerButton.css('opacity', '1');
        registerButton.css('cursor', 'pointer');
    } else {
        registerButton.css('opacity', '0.7');
        registerButton.css('cursor', 'not-allowed');
    }
}

function checkPasswordCondition(password) {
    const conditionLength = $('#condition-length');
    const conditionLowercase = $('#condition-lowercase');
    const conditionUppercase = $('#condition-uppercase');
    const conditionNumber = $('#condition-number');
    const registerButton = $('#register-btn');
    let valid = true;

    // Kiểm tra độ dài mật khẩu
    if (password.length >= 8 && password.length <= 16) {
        conditionLength.addClass('valid');
    } else {
        conditionLength.removeClass('valid');
        valid = false;
    }

    // Kiểm tra chứa ký tự viết thường
    if (/[a-z]/.test(password)) {
        conditionLowercase.addClass('valid');
    } else {
        conditionLowercase.removeClass('valid');
        valid = false;
    }

    // Kiểm tra chứa ký tự viết hoa
    if (/[A-Z]/.test(password)) {
        conditionUppercase.addClass('valid');
    } else {
        conditionUppercase.removeClass('valid');
        valid = false;
    }

    // Kiểm tra chứa ít nhất một số
    if (/\d/.test(password)) {
        conditionNumber.addClass('valid');
    } else {
        conditionNumber.removeClass('valid');
        valid = false;
    }

    // Hiển thị nút đăng ký nếu tất cả các điều kiện đều thỏa mãn
    if (valid && $('#username-condition').hasClass('valid')) {
        registerButton.css('opacity', '1');
        registerButton.css('cursor', 'pointer');
    } else {
        registerButton.css('opacity', '0.7');
        registerButton.css('cursor', 'not-allowed');
    }

    return valid;
}

function showOtpVerificationContainer(phone_number, phone_verification_id, countdown_time = 60) {
    $('.otp-verification-container').remove();

    let verificationContainerHTML = `
    <div class="otp-verification-container verification-container col">
        <div class="header full-width row">
            <div class="back-container center full-width full-height">
                <button class="back-btn"><i class="fa-solid fa-arrow-left-long"></i></button>
            </div>
            <div class="title-container span-container">
                <span class="title">Xác minh số điện thoại</span>
            </div>
        </div>
        <div class="body col full-height full-width">
            <div class="message span-container">
                <span>Chúng tôi đã gửi mã xác nhận đến số điện thoại ${phone_number}, vui lòng theo dõi tin nhắn.</span>
            </div>
            <form class="col" data-phone-verification-id="${phone_verification_id}" data-phone-number="${phone_number}" id="otp-verification-form">
                <div class="otp-input-container full-width row">
                    <input type="number" maxlength="1" class="otp-input center" />
                    <input type="number" maxlength="1" class="otp-input center" />
                    <input type="number" maxlength="1" class="otp-input center" />
                    <input type="number" maxlength="1" class="otp-input center" />
                    <input type="number" maxlength="1" class="otp-input center" />
                    <input type="number" maxlength="1" class="otp-input center" />
                </div>
                <div class="countdown-container row gap-4 center">
                    <div>Vui lòng chờ <span class="countdown-val">${countdown_time}</span> giây để gửi lại.</div>
                    <button type="button" class="resend-btn hidden">Gửi lại</button>
                </div>
                <div class="action-btn center full-width">
                    <button type="submit" class="submit-step1-btn center full-width" data-phone-verification-id="${phone_verification_id}">Tiếp theo</button>
                </div>
            </form>
        </div>
    </div>
    `;

    $('body').append(verificationContainerHTML);

    // Ẩn container chính
    $('.container').addClass('hidden');

    // Hiển thị container xác minh
    document.title = 'Xác minh số điện thoại';
    $('.otp-verification-container').css('display', 'flex');

    // Thực hiện đếm ngược
    const countdownDisplay = $('.countdown-val');
    const resendButton = $('.resend-btn');
    let timer = countdown_time;
    const countdownInterval = setInterval(() => {
        timer--;
        countdownDisplay.text(timer);

        if (timer <= 0) {
            clearInterval(countdownInterval);
            countdownDisplay.text('0');
            resendButton.removeClass('hidden'); // Hiển thị nút Gửi lại mã
        }
    }, 1000);
}

function showCreateAccountContainer(phone_verification_id) {
    let createAccountContainerHTML = `
        <div class="account-container verification-container col">
            <div class="header full-width row">
                <div class="back-container center full-width full-height">
                    <button class="back-btn"><i class="fa-solid fa-arrow-left-long"></i></button>
                </div>
                <div class="title-container span-container">
                    <span class="title">Thiết lập tài khoản</span>
                </div>
            </div>
            <div class="body col full-height full-width">
                <div class="mesage span-container">
                    <span>Thiết lập tài khoản để hoàn tất việc đăng ký.</span>
                </div>
                <form class="col" action="" id="registerForm" data-phone-verification-id="${phone_verification_id}">
                    <div class="account-input-container full-width col">
                        <input type="text" id="username_register" placeholder="Tên tài khoản">
                        <div class="condition-container">
                            <span id="username-condition">Tên tài khoản phải có 8-20 ký tự, không được có khoảng trống</span>
                        </div>
                        <div class="input-container">
                            <input class="full-width" type="password" id="password_register" placeholder="Mật khẩu">
                            <span class="eye-icon" id="togglePasswordRegister"><i class="fa fa-eye-slash"></i></span>
                        </div>
                        <div class="condition-container col">
                            <span id="condition-length">Mật khẩu có từ 8-16 ký tự</span>
                            <span id="condition-lowercase">Chứa ít nhất một ký tự viết thường</span>
                            <span id="condition-uppercase">Chứa ít nhất một ký tự viết hoa</span>
                            <span id="condition-number">Chứa ít nhất một số</span>
                        </div>
                    </div>
                    <div class="action-btn center full-width">
                        <button type="submit" class="submit-step2-btn center full-width" id="register-btn">Đăng ký</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    $('body').append(createAccountContainerHTML);
    // Xóa container khác
    $('.otp-verification-container').remove();

    document.title = 'Thiết lập tài khoản'
    $('.account-container').css('display', 'flex');
}

function showCompeleteContainer() {
    let completeContainerHTML = `
    <div class="complete-container verification-container col">
        <div class="header full-width row">
            <div class="back-container center full-width full-height">
                <button class="back-btn"><i class="fa-solid fa-arrow-left-long"></i></button>
            </div>
            <div class="title-container span-container">
                <span class="title">Hoàn thành</span>
                
            </div>
        </div>
        <div class="complete-icon-container center">
            <div class="complete-icon center"><i class="fa-solid fa-check"></i></div>
        </div>
        <div class="body col full-height full-width">
            <div class="mesage span-container">
                <span>Bạn đã đăng ký tài khoản thành công</span>
            </div>
            <div class="action-btn center full-width">
                <button class="submit-step3-btn center full-width">Đi đến trang đăng nhập</button>
            </div>
        </div>
    </div>
    `;

    $('body').append(completeContainerHTML);
    
    // Ẩn container khác
    $('.account-container').remove();

    document.title = 'Hoàn thành';
    // Truyền dữ liệu và show

    $('.complete-container').css('display', 'flex');
}


// các hàm gọi api
function sentOTPtoPhoneNumber(phone_number) {
    const access_token = localStorage.getItem('wiseowlUserAccessToken');
    renderLoading();
    fetch('/api/phone-verification', {
        method: 'POST',
        headers: {
            "authentication": access_token,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ phone_number: phone_number })
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                removeLoading();
                showNotification(result.message);
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        removeLoading();
        const countdown_time = result.countdown_time;
        const phone_verification_id = result.phone_verification_id;
        showOtpVerificationContainer(phone_number, phone_verification_id, countdown_time);
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function phoneVerification(phone_verification_id, otp) {
    const access_token = localStorage.getItem('wiseowlUserAccessToken');
    renderLoading();
    fetch('/api/phone-verification', {
        method: 'PUT',
        headers: {
            "authentication": access_token,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({
            phone_verification_id: phone_verification_id,
            otp_code: otp
        })
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                removeLoading();
                showNotification(result.message);
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        removeLoading();
        showCreateAccountContainer(phone_verification_id);
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function createUser(account) {
    const access_token = localStorage.getItem('wiseowlUserAccessToken');
    renderLoading();
    fetch('/api/user', {
        method: 'POST',
        headers: {
            "authentication": access_token,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ account: account })
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                removeLoading();
                showNotification(result.message);
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        removeLoading();
        showCompeleteContainer();
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function login(account){
    renderLoading();
    fetch('/api/user/login', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ account: account })
    })
    .then(response => response.json().then(data => {
        if (!response.ok) {
            showNotification(data.message);
            throw new Error('Network response was not ok');
        }
        return data;
    }))
    .then(result => {
        localStorage.setItem('wiseowlUserAccessToken', result.access_token);
        localStorage.setItem('wiseowlUserRefreshToken', result.refresh_token);

        window.location.href = '/';
    })
    .catch(error => {
        removeLoading();
        console.error('There was a problem with your fetch operation:', error);
    });
}