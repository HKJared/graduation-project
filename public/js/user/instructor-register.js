$(document).ready(function () {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#class_nav').addClass('active');
    updateUnderline();

    setTitle('Đăng ký trở thành giảng viên');

    setView();

    // Xử lý sự kiện cuộn cho .nav-item
    $(document).on('click.woEvent', '.sub_nav-item', function(event) {
        event.preventDefault();

        const hash = $(this).attr('href');
        scrollToElementInBody(hash);

        // Cập nhật active class cho nav-item
        $('.sub_nav-item').removeClass('active');
        $(this).addClass('active');
    });

    // hiển thị thông tin định danh sau khi nhập đủ thông tin gian hàng
    $(document).on('input.woEvent change.woEvent', '#lecturer_info input', function() {
        let allFilled = true;
    
        $('#lecturer_info input').each(function() {
            if ($(this).val() === '') {
                allFilled = false;
                return false;
            }
        });
    
        if (allFilled) {
            $('#lecturer_iden .info-container').slideDown(); // Hiển thị info-container của form thông tin thuế
            $('#lecturer_iden .condition').slideUp(); // Ẩn dòng thông báo yêu cầu
        } else {
            $('#lecturer_iden .info-container').slideUp(); // Ẩn info-container của form thông tin thuế
            $('#lecturer_iden .condition').slideDown(); // Hiển thị dòng thông báo yêu cầu
        }
    });

    // Hiển thị ảnh được chọn
    $(document).on('change.woEvent', 'input[type="file"]', function() {
        const input = this;
        const previewContainer = $(this).siblings('.preview-image');
        const btn = $(this).siblings('.upload-btn')
    
        // Clear previous preview
        previewContainer.empty();
    
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create an image element and set its source
                const img = $('<img>').attr('src', e.target.result);

                const removeBtn = $('<button class="remove-img center" title="Xóa ảnh này"><ion-icon name="close-outline"></ion-icon></button>');
                
                // Append the image to the preview container
                previewContainer.append(img).append(removeBtn);
                previewContainer.css('display', 'flex');
                btn.hide();
            };
    
            // Read the file as a Data URL (base64 encoded)
            reader.readAsDataURL(input.files[0]);
        }
    });

    $(document).on('change.woEvent', '#teaching_certificate', function () {
        var file = this.files[0]; // Lấy file đã chọn
        if (file) {
            var fileName = file.name;
            $('#file-name').text(fileName);

            // Hiển thị preview
            if (file.type.startsWith('image/')) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $('#preview-image').attr('src', e.target.result).show();
                    $('#preview-pdf').hide(); // Ẩn PDF
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                var reader = new FileReader();
                reader.onload = function (e) {
                    $('#preview-pdf').attr('src', e.target.result).show();
                    $('#preview-image').hide(); // Ẩn hình ảnh
                };
                reader.readAsDataURL(file);
            } else {
                // Nếu không phải ảnh hay PDF
                $('#preview-image, #preview-pdf').hide();
            }
        }
    });

    // cho phép đăng ký khi đã nhập đầy đủ thông tin
    $(document).on('input.woEvent change.woEvent', '.main input', function() {
        let allFilled = true;
    
        // Kiểm tra tất cả các input trong .main
        $('.main input').each(function() { 
            if ($(this).val() == '') {
                allFilled = false;
                return false; // Thoát vòng lặp sớm nếu tìm thấy input rỗng
            }
        });
    
        // Thay đổi trạng thái của nút submit-btn
        if (allFilled) {
            $('.submit-container .submit-btn').css({
                'opacity': '1',
                'cursor': 'pointer'
            }).attr('title', '').removeClass('not-allowed');
        } else {
            $('.submit-container .submit-btn').css({
                'opacity': '0.7',
                'cursor': 'not-allowed'
            }).attr('title', 'Hãy điền đầy đủ thông tin để có thể đăng ký').addClass('not-allowed');
        }
    });

    // xóa ảnh trong input và ảnh hiển thị mẫu
    $(document).on('click.woEvent', '.remove-img', function() {
        const previewContainer = $(this).parent('.preview-image');
        const btn = previewContainer.siblings('.upload-btn');
        const input = previewContainer.siblings('input[type="file"]');
    
        // Clear the preview and show the upload button again
        previewContainer.empty();
        previewContainer.css('display', 'none');
        input.val('');
        input.trigger('change');
        btn.show();
    });

    $(document).on('click.woEvent', '.submit-container .cancel-btn', function(event) {
        event.stopPropagation();

        showConfirm('Xác nhận hủy bỏ các thông tin đã điền', 'Xác nhận', function(result) {
            if(result) {
                updateViewBasedOnPath('/class')
            }
        })
    });

    $(document).on('click.woEvent', '.submit-container .submit-btn', async function(event) {
        event.stopPropagation();
        
        // Kiểm tra nếu cursor của nút submit là not-allowed
        if ($(this).css('cursor') === 'not-allowed') {
            return;
        }

        const phoneNumber = $('#phone_number').val();
        const idValue = $('#id_value').val();
        
        if (!validateInputs(phoneNumber, idValue)) {
            return;
        }

        const formData = createFormData();
        
        // Chờ upload hoàn tất
        const response = await upload(formData);
    
        // Kiểm tra kết quả upload
        if (!response) {
            return; // Trả về nếu upload ảnh bị lỗi
        }
        
        // Tiếp tục xử lý nếu upload thành công
        const instructor = {
            email: $('#email').val(),
            phone_number: phoneNumber,
            teaching_levels: $('input[name="teaching_levels"]:checked').val(),
            teaching_certificate_url:  response.teaching_certificate
        };
        
        const instructor_identification = {
            id_type: $('input[name="id_type"]:checked').val(),
            id_value: idValue,
            fullname: $('#fullname').val(),
            id_image_url: response.id_image, 
            id_image_with_person_url: response.id_image_with_person
        };

        const body = {
            instructor, instructor_identification
        }

        const { code, instructor_registor } = await userApi('instructor-register', 'POST', body);

        if (code && instructor_registor) {
            user_info.instructor = instructor_registor.instructorData;
            user_info.identification = instructor_registor.identificationData;
            const $container = $('.user__container');

            const message = 'Đăng ký thành công. Chúng tôi sẽ kiểm duyệt thông tin bạn cung cấp và gửi thông báo phản hồi đến bạn một cách sớm nhất';
            const buttons = [
                {
                    href: '/class',
                    text: 'Quay về trang lớp học',
                    is_main: 0
                },
                {
                    href: '/info#instructor',
                    text: 'Xem thông tin đăng ký',
                    is_main: 1
                }
            ]

            $container.empty().append(createAlertSuccessComponent(message, buttons))
        }
    });
});

function setView() {
    const $container = $('.user__container');
    
    if (!user_info || !user_info.id) {
        $container.append(createNotLoggedInComponent());
    } else if (user_info.instructor) {
        if (user_info.instructor.is_approved) {
            const message = 'Bạn đã đăng ký trước đó và đã được phê duyệt.'
            const buttons = [
                {
                    href: '/class',
                    text: 'Quay về trang lớp học',
                    is_main: 1
                }
            ]

            $container.append(createAlertSuccessComponent(message, buttons));
        } else {
            const message = 'Bạn đã đăng ký trước đó, chúng tôi đang trong quá trình kiểm duyệt thông tin bạn cung cấp.'
            const buttons = [
                {
                    href: '/class',
                    text: 'Quay về trang lớp học',
                    is_main: 0
                },
                {
                    href: '/info#instructor',
                    text: 'Xem thông tin đăng ký',
                    is_main: 1
                }
            ]

            $container.append(createAlertSuccessComponent(message, buttons));
        }
    } else {
        $container.append(`
            <div class="nav row full-width center">
                <a href="#lecturer_info" class="sub_nav-item active">Thông tin Giảng dạy</a>
                <a href="#lecturer_iden" class="sub_nav-item">Thông tin Định danh</a>
            </div>
            <div id="lecturer_info" class="col full-width gap-24">
                <div class="title full-width">
                    <h2 class="container full-width">Thông tin giảng dạy</h2>
                </div>
                <div class="info-container full-width col gap-24">
                    <div class="row row-info gap-16">
                        <label for="email"><span>* </span>Email</label>
                        <div class="wo-input">
                            <input type="text" id="email">
                            <span class="char-count">0/100</span>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="phone_number"><span>* </span>Số điện thoại</label>
                        <div class="wo-input">
                            <input type="text" id="phone_number">
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="id_type"><span>* </span>Cấp bậc giảng dạy</label>
                        <div class="row gap-16" id="teaching_levels">
                            <label class="row gap-4 item-center">
                                <input type="radio" name="teaching_levels" value="THPT" checked> THPT
                            </label>
                            <label class="row gap-4 item-center">
                                <input type="radio" name="teaching_levels" value="Cao đẳng"> Cao đẳng
                            </label>
                            <label class="row gap-4 item-center">
                                <input type="radio" name="teaching_levels" value="Đại học"> Đại học
                            </label>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for=""><span>* </span>Chứng chỉ giảng dạy</label>
                        <div class="col gap-4">
                            <label class="teaching_certificate-btn center" for="teaching_certificate">Chọn file</label>
                            <span id="file-name"></span>
                            <input type="file" id="teaching_certificate" accept="application/pdf, image/*">
                            <img id="preview-image" style="display: none; max-width: 300px; margin-top: 10px;" alt="Preview">
                            <embed id="preview-pdf" type="application/pdf" style="display: none; width: 100%; height: 500px; margin-top: 10px;">
                            <p class="suggest">Chứng chỉ giảng dạy có thể là ảnh hoặc file pdf</p>
                        </div>
                    </div>
                </div>
            </div>
            <div id="lecturer_iden" class="col full-width gap-24">
                <div class="title full-width">
                    <h2 class="container full-width">Thông tin Định danh</h2>
                </div>
                <div class="info-container full-width col gap-24"  style="display: none;">
                    <div class="row row-info gap-16">
                        <label for="id_type"><span>* </span>Hình thức định danh</label>
                        <div class="row gap-16" id="id_type">
                            <label class="row gap-4 item-center">
                                <input type="radio" name="id_type" value="CCCD" checked> CCCD
                            </label>
                            <label class="row gap-4 item-center">
                                <input type="radio" name="id_type" value="CMND"> CMND
                            </label>
                            <label class="row gap-4 item-center">
                                <input type="radio" name="id_type" value="Hộ chiếu"> Hộ chiếu
                            </label>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="id_value"><span>* </span>Mã định danh</label>
                        <div class="wo-input">
                            <input type="text" id="id_value"  placeholder="Số CCCD/CMND/Hộ chiếu">
                            <span class="char-count">0/12</span>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="fullname"><span>* </span>Họ và tên</label>
                        <div class="wo-input">
                            <input type="text" id="fullname"  placeholder="Theo CCCD/CMND/Hộ chiếu">
                            <span class="char-count">0/100</span>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="id_image"><span>* </span>Hình chụp của thẻ</label>
                        <div class="preview-image-container row">
                            <div class="preview-image">
                                
                            </div>
                            <input type="file" id="id_image" accept="image/*">
                            <label class="upload-btn center" for="id_image"><ion-icon name="add-outline"></ion-icon></label>
                            <div class="updoad-des"></div>
                        </div>
                    </div>
                    <div class="row row-info gap-16">
                        <label for="id_image_with_person"><span>* </span>Hình chụp bạn đang cầm thẻ</label>
                        <div class="preview-image-container row">
                            <div class="preview-image">
                            </div>
                            <input type="file" id="id_image_with_person" accept="image/*">
                            <label class="upload-btn center" for="id_image_with_person"><ion-icon name="add-outline"></ion-icon></label>
                            <div class="upload-des"></div>
                        </div>
                    </div>
                </div>
                <span class="condition">Vui lòng điền đầy đủ Thông tin Giảng dạy</span>
            </div>
            <div class="submit-container row full-width center gap-16">
                <button class="cancel-btn">Hủy</button>
                <button class="submit-btn not-allowed" title="Hãy điền đầy đủ thông tin để có thể đăng ký">Đăng ký</button>
            </div> 
        `);
    }
}

// Hàm cuộn đến phần tử trong .main-body với khoảng cách cách 60px từ trên cùng
function scrollToElementInBody(hash) {
    const targetElement = $(hash);
    if (targetElement.length) {
        const offsetTop = targetElement.offset().top - 60; // Vị trí đích trừ khoảng cách
        $('html, body').animate({ scrollTop: offsetTop }, 500); // Cuộn cả html và body
    }
}

function createFormData() {
    let formData = new FormData();

    let teachingCertificateFile = $('#teaching_certificate')[0].files[0];
    let idImageFile = $('#id_image')[0].files[0];
    let idImageWithPersonFile = $('#id_image_with_person')[0].files[0];

    if (teachingCertificateFile) {
        formData.append('files', teachingCertificateFile);
        formData.append('keys[]', 'teaching_certificate');
    }

    if (idImageFile) {
        formData.append('files', idImageFile);
        formData.append('keys[]', 'id_image');
    }

    if (idImageWithPersonFile) {
        formData.append('files', idImageWithPersonFile);
        formData.append('keys[]', 'id_image_with_person');
    }

    return formData;
}

function validateInputs(phoneNumber, idValue) {
    // Kiểm tra số điện thoại
    if (!validatePhoneNumber(phoneNumber)) {
        $('#phone_number').addClass('warning-border');
        showNotification('Số điện thoại không hợp lệ');
        return false;
    }

    // Kiểm tra mã định danh (phải đủ 12 ký tự)
    if (idValue.length !== 12) {
        $('#id_value').addClass('warning-border');
        showNotification('Mã định danh phải đủ 12 ký tự');
        return false;
    }

    return true;
}