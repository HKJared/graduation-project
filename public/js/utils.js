$(document).ready(function() {
    // Xóa lớp cảnh báo khi thay đổi ô input
    $(document).on('input', 'input, textarea', function() {
        $(this).removeClass('danger-border')
    });

    $(document).on('click', '.wo-select', function(event) {
        event.stopPropagation();
        
        if ($(this).hasClass('focus')) {
            $(this).removeClass('focus');
            $(this).find('.option__list').slideUp();
            return
        }

        $('.wo-select').removeClass('focus');
        $(this).addClass('focus');

        $('.option__list').slideUp();
        
        $(this).find('.option__list').slideDown();
    });

    $(document).on('click', '.wo-select .option__list li', function(event) {
        event.stopPropagation();
    
        const text = $(this).find('span').text();
        const val = $(this).attr('data-option-val');
    
        $(this).siblings().removeClass('selected');
        $(this).addClass('selected');
    
        const woSelect = $(this).closest('.wo-select');
        woSelect.removeClass('focus').attr('data-val', val);
        woSelect.find('.selected-text').text(text);
        $(this).closest('.option__list').slideUp();
    
        // Phát ra sự kiện 'change'
        woSelect.trigger('change');
    });

    //Đếm ký tự
    $(document).on('input', '.wo-input input, .wo-textarea textarea', function() {
        const maxChars = $(this).next('.char-count').text().split('/')[1]; // Lấy số ký tự tối đa
        const currentLength = $(this).val().length;
        $(this).next('.char-count').text(`${currentLength}/${maxChars}`);
    
        if (currentLength >= maxChars) {
            $(this).val($(this).val().substring(0, maxChars)); // Giới hạn ký tự
            $(this).next('.char-count').text(`${maxChars}/${maxChars}`);
        }
    });
});

function renderLoading() {}

function removeLoading() {}

function showNotification(message) {
    let notificationHTML = `
    <div id="notification" class="notification center fixed">
        <span id="notificationText">${message}</span>
    </div>
    `;

    $('body').append(notificationHTML);

    $('#notification').show();

    setTimeout(() => {
        setTimeout(() => {
            $('#notification').addClass('right-slide');
        }, 10);
    }, 10);
    setTimeout(() => {
        $('#notification').removeClass('right-slide'); 
        setTimeout(() => {
            $('#notification').hide();
            $('#notification').remove();
        }, 500);
    }, 3000); 
}

function showStackedNotification(message, id) {
    // Kiểm tra nếu container chưa tồn tại thì thêm vào body
    if ($('.notification-container').length === 0) {
        $('body').append('<div class="notification-container"></div>');
    }

    // Kiểm tra xem thông báo với id đã tồn tại chưa
    let $notification = $(`#${id}`);

    if ($notification.length == 0) {
        // Tạo thông báo mới
        let notificationHTML = `
        <div id="${id}" class="notification-item">
            <span class="notification-text">${message}</span>
            <button class="close-btn center absolute"><ion-icon name="close-outline"></ion-icon></button>
        </div>
        `;

        // Thêm thông báo vào container
        $('.notification-container').append(notificationHTML);

        // Lấy phần tử thông báo vừa thêm
        $notification = $(`#${id}`);

        // Hiệu ứng xuất hiện
        $notification.show().addClass('right-slide');

        // Xử lý khi click vào nút close
        $notification.find('.close-btn').click(function() {
            $notification.removeClass('right-slide');
            $notification.css('opacity', 0); // Giảm độ mờ về 0
            setTimeout(() => {
                $notification.remove(); // Xóa thông báo khỏi DOM sau khi hoàn tất hiệu ứng
            }, 500); // Thời gian khớp với thời gian hiệu ứng giảm độ mờ
        });

        // Tự động xóa thông báo sau 10 giây
        setTimeout(() => {
            if ($notification.length) {
                $notification.removeClass('right-slide');
                $notification.css('opacity', 0); // Giảm độ mờ về 0
                setTimeout(() => {
                    $notification.remove(); // Xóa thông báo khỏi DOM sau khi hoàn tất hiệu ứng
                }, 500); // Thời gian khớp với thời gian hiệu ứng giảm độ mờ
            }
        }, 10000); // 10 giây
    } else {
        // Nếu thông báo đã tồn tại, thêm lớp zoom-scale để thực hiện hiệu ứng co lại
        $notification.addClass('zoom-scale');
        
        // Xóa lớp zoom-scale sau khi hiệu ứng hoàn tất
        setTimeout(() => {
            $notification.removeClass('zoom-scale');
        }, 1000); // Thời gian khớp với thời gian của hiệu ứng co lại
    }
}

function showConfirm(message, confirmBtnText, callback) {
    if ($('.confirm-container').length > 0) {
        return; // Nếu có, thoát hàm và không tạo thêm hộp thoại
    }

    let confirmContainerHTML = `
    <div class="confirm-container blur__container center">
        <div class="confirm">
            <div class="confirm-body col">
                <div class="confirm-content col gap-4">
                    <span>${message}</span>
                </div>
                <div class="confirm-action row gap-24">
                    <button class="cancel-btn center">Hủy bỏ</button>
                    <button class="confirm-btn center">${confirmBtnText}</button>
                </div>
            </div>
        </div>
    </div>
    `;

    $('body').append(confirmContainerHTML);

    $('.confirm-container').css('display', 'flex');

    $('.confirm-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(true); // Người dùng nhấp vào Confirm
    });

    $('.cancel-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(false); // Người dùng nhấp vào Cancel
    });
}

function showConfirmWithNotice(message, confirmBtnText, notice, callback) {
    if ($('.confirm-container').length > 0) {
        return; // Nếu có, thoát hàm và không tạo thêm hộp thoại
    }

    let confirmContainerHTML = `
    <div class="confirm-container blur__container center">
        <div class="confirm">
            <div class="confirm-body col">
                <div class="confirm-content col gap-4">
                    <span>${message}</span>
                </div>
                <div class="notice-content">
                    <p>${ notice }</p>
                </div>
                <div class="confirm-action row gap-24">
                    <button class="cancel-btn center">Hủy bỏ</button>
                    <button class="confirm-btn center">${confirmBtnText}</button>
                </div>
            </div>
        </div>
    </div>
    `;

    $('body').append(confirmContainerHTML);

    $('.confirm-container').css('display', 'flex');

    $('.confirm-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(true); // Người dùng nhấp vào Confirm
    });

    $('.cancel-btn').off('click').on('click', function() {
        $('.confirm-container').remove();
        if (callback) callback(false); // Người dùng nhấp vào Cancel
    });
}

function addProgressBar(percentage = 30) {
    if (!$('#progress-container').length) {
        const progressBarHTML = `
            <div id="progress-container" style="position: fixed; top: 0; left: 0; width: 100%; height: 3.5px; background-color: #f5f5f5; z-index: 99999;">
                <div id="progress-bar" style="width: 0; height: 100%; background-color: var(--color-primary); transition: width 0.5s ease;"></div>
            </div>
        `;
        $('body').append(progressBarHTML); 
    } 

    $('#progress-bar').css('width', percentage + '%');
}

function removeProgressBar() {
    $('#progress-bar').css('width', '100%');

    setTimeout(function() {
        $('#progress-container').remove();
    }, 700)
}

function hideFullScreen() {
    $(".process-bar__fill").css("width", "100%");

    setTimeout(function () {
        // Di chuyển top lên và bot xuống
        $(".top__full-screen").css("transform", "translateY(-100%)");
        $(".bot__full-screen").css("transform", "translateY(100%)");

        setTimeout(function () {
            $(".full-screen").remove();
            $(".logo__container").removeClass('hide')
            
            // Lấy element từ server khi vừa load lại trang
            const currentHref = window.location.href;
            updateViewBasedOnPath(currentHref);
        }, 700);
    }, 2000);
}

function countUp(element, start, end, duration) {
    var startTime = null;
    var range = end - start;
    var stepTime = 10; // Thời gian mỗi bước (ms)
    var increment = range / (duration / stepTime); // Bước gia tăng mỗi lần

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = timestamp - startTime;
        var currentValue = start + increment * (progress / duration);
        
        if (progress < duration) {
            $(element).text(Math.round(currentValue)); // Cập nhật giá trị vào phần tử
            requestAnimationFrame(animate); // Gọi lại hàm animate cho đến khi đạt đích
        } else {
            $(element).text(end); // Đảm bảo kết thúc tại giá trị cuối cùng
        }
    }
    
    requestAnimationFrame(animate); // Bắt đầu animation
}

// Hàm tạo mảng các tháng gần nhất
function getLastSixMonths() {
    const months = [];
    const currentDate = new Date();
    
    // Lấy từng tháng trong 6 tháng gần đây
    for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Thêm 0 ở trước nếu cần
        const year = date.getFullYear();
        months.push(`${month}/${year}`);
    }
    return months;
}

async function upload(formData) {
    addProgressBar(20);
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            showNotification(result.message);
            throw new Error('Network response was not ok');
        }

        return result; // Trả về kết quả sau khi upload thành công
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return null; // Trả về null nếu có lỗi
    }
}