$(document).ready(function() {
    $('#username, #password').on('input', function() {
        $(this).val($(this).val().replace(/\s+/g, ''));
    });

    $(document).on('submit', '#login_form', function(event) {
        event.preventDefault();

        const username = getUsername();

        if (!username) {
            return
        }

        const password = getPassword();

        if (!password) {
            return
        }

        const account = {
            username: username,
            password: password
        }

        login(account);
    });
});

function getUsername() {
    const $usernameInput = $('#username')
    const username = $usernameInput.val();

    if (!username || username == '') {
        $usernameInput.addClass('warning-border');
        showNotification('Vui lòng nhập tài khoản.')
        return null
    } 

    if (username.length < 8) {
        $usernameInput.addClass('warning-border');
        showNotification('Tài khoản dài tối tiểu 8 ký tự.');
        return null
    }

    return username
}

function getPassword() {
    const $passwordInput = $('#password')
    const password = $passwordInput.val();

    if (!password || password == '') {
        $passwordInput.addClass('warning-border');
        showNotification('Vui lòng nhập tài khoản.')
        return null
    } 

    if (password.length < 8) {
        $passwordInput.addClass('warning-border');
        showNotification('Tài khoản dài tối tiểu 8 ký tự.');
        return null
    }

    return password
}

function login(account) {
    // renderLoading();
    fetch('/api/admin/login', {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({ account: account })
    })
    .then(response => response.json().then(data => {
        if (!response.ok) {
            // removeLoading();
            showNotification(data.message);
            throw new Error('Network response was not ok');
        }
        return data;
    }))
    .then(result => {
        // removeLoading();
        localStorage.setItem('wiseowlAdminAccessToken', result.access_token);
        localStorage.setItem('wiseowlAdminRefreshToken', result.refresh_token);

        setTimeout(function() {
            window.location.href = '/admin/';
        }, 500);
    })
    .catch(error => {
        // removeLoading();
        console.error('There was a problem with your fetch operation:', error);
    });
}