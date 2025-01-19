$(document).ready(function() {
    $(".nav-item").removeClass("active");
    updateUnderline();

    $('.sent-request').on('click', function() {
        // Lấy các giá trị từ form
        var name = $('#name').val();
        var email = $('#email').val();
        var phoneNumber = $('#phone_number').val();
        var message = $('#message').val();

        // Kiểm tra các trường bắt buộc
        var missingInfo = false;

        // Kiểm tra và thêm class danger-border cho các trường trống
        if (!name) {
            $('#name').addClass('danger-border');
            missingInfo = true;
        }

        if (!email) {
            $('#email').addClass('danger-border');
            missingInfo = true;
        }

        if (!phoneNumber) {
            $('#phone_number').addClass('danger-border');
            missingInfo = true;
        }

        if (!message) {
            $('#message').addClass('danger-border');
            missingInfo = true;
        }

        if (missingInfo) {
            showNotification('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        // Tạo object chứa dữ liệu form
        var request = {
            fullname: name,
            email: email,
            phone_number: phoneNumber,
            message: message
        };
        fetch(`/api/request`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ request: request })
        })
        .then(response => response.json().then(data => {
            if (!response.ok) {
                showNotification('Gửi tin nhắn không thành công, vui lòng thử lại hoặc liên hệ với chúng tôi qua hotline.');
                throw new Error('Network response was not ok');
            }
            return data;
        }))
        .then(result => {
            showNotification(result.message);

            $('#name').val('');
            $('#email').val('');
            $('#phone_number').val('');
            $('#message').val('');
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
    });
});