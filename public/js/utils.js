$(document).ready(function() {
    // Xóa lớp cảnh báo khi thay đổi ô input
    $(document).on('input', 'input, textarea', function() {
        $(this).removeClass('danger-border')
    });

    $(document).on('click', '.wo-select', function(event) {
        event.stopPropagation();

        if ($(this).hasClass('unchangeable')) {
            return
        }
        
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

    $(document).on('click', '.wo-toggle label', function() {
        const label = $(this);
        const checkbox = label.prev('input[type="checkbox"]');
        
        // Chuyển đổi trạng thái checkbox
        checkbox.trigger('click');
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

    $(document).on('click', '.to-top-btn', function(event) {
        event.stopPropagation();

        $('.main-body, body').animate({scrollTop: 0}, 700);
    });
});

function checkUserLogin() {
    const token = localStorage.getItem('wiseowlUserRefreshToken');

    if (token) {
        return true;
    }

    return false
}

function renderLoading() {}

function removeLoading() {}

function createEditor(placeholder = '', content) {
    CKEDITOR.ClassicEditor
        .create(document.getElementById("editor"), {
            toolbar: {
                items: [
                    'bold', 'italic', 'strikethrough', 'underline',
                    'bulletedList', 'numberedList',
                    'fontSize', 'fontFamily', 'fontColor',
                    'alignment',
                    'link', 'uploadImage', 'blockQuote', 'codeBlock',
                    'specialCharacters'
                ],
                shouldNotGroupWhenFull: true
            },
            list: {
                properties: {
                    styles: true,
                    startIndex: true,
                    reversed: true
                }
            },
            placeholder: placeholder, // Thiết lập placeholder
            fontFamily: {
                options: [
                    'default',
                    'Arial, Helvetica, sans-serif',
                    'Courier New, Courier, monospace',
                    'Georgia, serif',
                    'Lucida Sans Unicode, Lucida Grande, sans-serif',
                    'Tahoma, Geneva, sans-serif',
                    'Times New Roman, Times, serif',
                    'Trebuchet MS, Helvetica, sans-serif',
                    'Verdana, Geneva, sans-serif'
                ],
                supportAllValues: true
            },
            fontSize: {
                options: [10, 12, 14, 16, 18, 20, 22],
                supportAllValues: true
            },
            fontColor: {
                default: '#222E3C' // Màu chữ mặc định
            },
            htmlSupport: {
                allow: [
                    {
                        name: /.*/,
                        attributes: true,
                        classes: true,
                        styles: true
                    }
                ]
            },
            htmlEmbed: {
                showPreviews: true
            },
            removePlugins: [
                'AIAssistant',
                'CKBox',
                'CKFinder',
                'EasyImage',
                'MultiLevelList',
                'RealTimeCollaborativeComments',
                'RealTimeCollaborativeTrackChanges',
                'RealTimeCollaborativeRevisionHistory',
                'PresenceList',
                'Comments',
                'TrackChanges',
                'TrackChangesData',
                'RevisionHistory',
                'Pagination',
                'WProofreader',
                'MathType',
                'SlashCommand',
                'Template',
                'DocumentOutline',
                'FormatPainter',
                'TableOfContents',
                'PasteFromOfficeEnhanced',
                'CaseChange'
            ],
            contentsCss: [
                'body { font-size: 14px; color: #222E3C; font-family: Arial, sans-serif; line-height: 1.5; }'
            ]
        })
        .then(newEditor => {
            removeLoading();
            editor = newEditor;
            if (content) {
                editor.setData(content)
            }
        })
        .catch(error => {
            removeLoading();
            console.error(error);
        });
}

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

function validatePhoneNumber(phoneNumber) {
    // Xóa tất cả khoảng trắng khỏi số điện thoại
    phoneNumber = phoneNumber.replace(/\s+/g, '');

    // Kiểm tra độ dài của số điện thoại (thường là 10 chữ số)
    if (phoneNumber.length !== 10) {
        return false;
    }

    // Đầu số hợp lệ ở Việt Nam
    const validPrefixes = [
        "032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098",  // Viettel
        "070", "076", "077", "078", "079", "089",                                           // Mobifone
        "081", "082", "083", "084", "085", "088", "091", "094",                            // Vinaphone
        "056", "058", "092",                                                              // Vietnamobile
        "099", "059",                                                                    // Gmobile
        "087"                                                                           // Itelecom
    ];

    // Lấy 3 ký tự đầu của số điện thoại để kiểm tra
    const prefix = phoneNumber.substring(0, 3);

    // Kiểm tra xem đầu số có hợp lệ không
    if (!validPrefixes.includes(prefix)) {
        return false;
    }

    // Nếu qua được tất cả các kiểm tra, số điện thoại là hợp lệ
    return true;
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

function hasAnyPermission(permissions, requiredPermissions) {
    return requiredPermissions.some(reqPerm => 
        permissions.some(permission => permission.name === reqPerm)
    );
}

function convertImageFileToBase64URL(file) {
    return new Promise((resolve, reject) => {
        // Kiểm tra nếu không phải file hoặc không phải file ảnh
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('The provided file is not an image.'));
            return;
        }

        const reader = new FileReader();

        // Thành công, trả về Base64 URL
        reader.onload = function (event) {
            resolve(event.target.result); // Base64 URL
        };

        // Xử lý lỗi
        reader.onerror = function (error) {
            reject(new Error('Error reading the file: ' + error.message));
        };

        // Đọc file dưới dạng Data URL (Base64 URL)
        reader.readAsDataURL(file);
    });
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

function formatDatetime(isoDatetime) {
    // Chuyển chuỗi ISO thành đối tượng Date
    const date = new Date(isoDatetime);

    // Chuyển đổi sang giờ Việt Nam (GMT+7)
    const vietnamTime = new Date(date.getTime());

    // Lấy các thành phần ngày, tháng, năm, giờ, phút, giây
    const day = String(vietnamTime.getDate()).padStart(2, '0');
    const month = String(vietnamTime.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = vietnamTime.getFullYear();
    const hours = String(vietnamTime.getHours()).padStart(2, '0');
    const minutes = String(vietnamTime.getMinutes()).padStart(2, '0');
    const seconds = String(vietnamTime.getSeconds()).padStart(2, '0');

    // Trả về chuỗi định dạng "dd/mm/yyyy hh:mm:ss"
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}