$(document).ready(function() {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    updateUnderline();
    
    setView();

    updateUserNav();

    setTitle('Thông tin tài khoản')

    $(document).on('click.woEvent', '.user-spa-action', function(event) {
        event.preventDefault();

        const href = $(this).attr('href');
        history.pushState(null, '', href);

        $('.user-spa-action').removeClass('active');
        $(this).addClass('active');
        
        updateUserNav()
    });

    $(document).on('click.woEvent', '.user-nav-item', function(event) {
        event.preventDefault();

        const href = $(this).attr('href');
        
        $('.user-nav-item').removeClass('active');
        $(this).addClass('active');
        $('.account_panel').css('display', 'none');

        $(href).css('display', 'flex');
    });
});

$(document).ready(function() {
    $(document).on('userUpdated.woEvent', function() {
        setView();

        updateUserNav();
    });

    // hàm ở mục đổi mật khẩu
    $(document).on('click.woEvent', '.eye-icon', function(event) {
        event.stopPropagation();

        var passwordInput = $(this).siblings('input');
        var eyeIcon = $(this).find('i');
        if (passwordInput.attr('type') === 'password') {
            passwordInput.attr('type', 'text');
            eyeIcon.removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            passwordInput.attr('type', 'password');
            eyeIcon.removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });

    $(document).on('input.woEvent', '#new_password',function() {
        if (checkPasswordCondition($(this).val())) {
            $('#change_password .submit-btn').addClass('allowed')
        } else {
            $('#change_password .submit-btn').removeClass('allowed')
        }
    });

    // Đổi mật khẩu
    $(document).on('submit.woEvent', '#change_password form', function(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!$(this).find('.submit-btn').hasClass('allowed')) {
            return
        }

        let oldPassword = $('#old_password').val();
        let newPassword = $('#new_password').val();
        let confirmPassword = $('#confim_new_password').val();

        // Basic validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            if (!oldPassword) {
                $('#old_password').addClass('warning-border');
            }
            if (!newPassword) {
                $('#new_password').addClass('warning-border');
            }
            if (!confirmPassword) {
                $('#confim_new_password').addClass('warning-border');
            }

            showStackedNotification('Vui lòng nhập đầy đủ thông tin.', 'noFullInfo');
            return;
        }

        if (newPassword == oldPassword) {
            $('#new_password, #old_password').addClass('warning-border');

            showStackedNotification('Mật khẩu cũ và mật khẩu mới không được trùng nhau.', 'difOldInfo');
            return;
        }

        if (newPassword !== confirmPassword) {
            $('#new_password, #confim_new_password').addClass('warning-border');

            showStackedNotification('Mật khẩu mới và xác nhận mật khẩu không trùng khớp.', 'difNewInfo');
            return;
        }

        showConfirm('Xác nhận đổi mật khẩu.', 'Xác nhận', async function(result) {
            if (result) {
                const body = {
                    old_password: oldPassword,
                    new_password: newPassword
                }
                const { message, code } = await userApi('change-password', 'PUT', body);

                if (code) {
                    showNotification(message);
                }
            }
        })
    });

    // Tải lên ảnh đại diện mới
    $(document).on('change.woEvent', '#avatar_url',function() {
        const file = this.files[0];
        if (file) {
            // Tạo URL tạm thời để hiển thị ảnh
            const imageUrl = URL.createObjectURL(file);
    
            // Cập nhật URL vào thẻ img
            $('.edit-avatar__container img').attr('src', imageUrl);
            
            // Hiện nút xóa
            $('.edit-avatar__container button').removeClass('hide');
        }
    });

    //  Cập nhật thông tin tài khoản
    $(document).on('submit.woEvent', '#profile form', async function(event) {
        event.stopPropagation();
        event.preventDefault();

        const $form = $(this);
        const fullname = $form.find('input.fullname').val()

        if (fullname == '') {
            showStackedNotification('Tên tài khoản không được để trống.', 'er_fullname');
            $form.find('input.fullname').addClass('danger-border');

            return
        }

        // tìm trong form các phần tử có class như bảng yêu cầu
        const info = {
            avatar_url: null,
            fullname: $form.find('input.fullname').val(),
            email: $form.find('input.email').val(),
            phone_number: $form.find('input.phone_number').val(),
            gender: $form.find('.gender input:checked').val(),
            date_of_birth: $form.find('input.date_of_birth').val() || null,
        }

        if ($('#avatar_url').length && $('#avatar_url')[0].files.length > 0) {
            const formData = new FormData();
        
            const file = $('#avatar_url')[0].files[0];
            formData.append('files[]', file);
            formData.append('keys[]', 'avatar_url');

            const response = await upload(formData);
            info.avatar_url = response.avatar_url || null
        }

        const { message, newInfo } = await userApi('info', 'PUT', {info})

        if (message && newInfo) {
            showNotification(message);
            user_info = newInfo
            $(document).trigger('userUpdated', [user_info]);
        }
    });

    // Tải lên chứng chỉ giảng dạy
    $(document).on('change.woEvent', '#teaching_certificate', function () {
        var file = this.files[0]; // Lấy file đã chọn
        const $container = $(this).closest('.edit-main');
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            if (file.type.startsWith('image/')) {
                // Hiển thị ảnh, ẩn PDF
                $container.find('img').attr('src', fileUrl).show();
                $container.find('embed').hide();
            } else if (file.type === 'application/pdf') {
                // Hiển thị PDF, ẩn ảnh
                $container.find('embed').attr('src', fileUrl + "#toolbar=0&navpanes=0").show();
                $container.find('img').hide();
            }
        
            // Cập nhật URL vào thẻ a
            $container.find('a').attr('href', fileUrl);
        
            // Hiện nút xóa nếu có
            $container.find('button').removeClass('hide');
        }
    });

    // Tải lên ảnh định danh
    $(document).on('change.woEvent', '.image-action__container input',function() {
        const file = this.files[0];
        if (file) {
            // Tạo URL tạm thời để hiển thị ảnh
            const imageUrl = URL.createObjectURL(file);
    
            // Cập nhật URL vào thẻ img
            $(this).closest('.preview-image-container').find('img').attr('src', imageUrl);
            $(this).closest('.preview-image-container').find('a').attr('href', imageUrl);

            // Hiện nút xóa
            $(this).closest('.preview-image-container').find('button').removeClass('hide');
        }
    });

    // Xóa ảnh tải lên
    $(document).on('click.woEvent', '.edit-main .remove-image-btn', function() {
        const backup_url = $(this).attr('data-backup-url');
        const $container = $(this).closest('.edit-main');
    
        // Kiểm tra phần mở rộng của URL
        const fileExtension = backup_url.split('.').pop().toLowerCase();
    
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
            // Nếu là ảnh
            $container.find('img').attr('src', backup_url).show();
            $container.find('embed').hide();
        } else if (fileExtension == 'pdf') {
            // Nếu là PDF
            $container.find('embed').attr('src', backup_url + "#toolbar=0&navpanes=0").show();
            $container.find('img').hide();
        }
    
        // Cập nhật URL vào thẻ a
        $container.find('a').attr('href', backup_url);

        // Xóa file trong input
        $container.find('input[type="file"]').val('');
    
        // Ẩn nút xóa
        $(this).addClass('hide');
    });

    // Cập nhật thông tin giảng dạy
    $(document).on('submit.woEvent', '#instructor_info form', async function(event) {
        event.stopPropagation();
        event.preventDefault();

        const $form = $(this);

        // tìm trong form các phần tử có class như bảng yêu cầu
        const instructor = {
            email: $form.find('input.email').val(),
            phone_number: $form.find('input.phone_number').val(),
            teaching_levels: $form.find('.teaching_levels input:checked').val(),
            teaching_certificate_url: null,
        }

        if ($('input#teaching_certificate').length && $('input#teaching_certificate')[0].files.length > 0) {
            const formData = new FormData();
        
            const file = $('input#teaching_certificate')[0].files[0];
            formData.append('files[]', file);
            formData.append('keys[]', 'teaching_certificate_url');

            const response = await upload(formData);
            instructor.teaching_certificate_url = response.teaching_certificate_url || null;
        }

        const { message, newInfo } = await userApi('instructor', 'PUT', {instructor})

        if (message && newInfo) {
            showNotification(message);
            user_info = newInfo
            $(document).trigger('userUpdated', [user_info]);
        }
    });

    // Cập nhật thông tin định danh
    $(document).on('submit.woEvent', '#instructor_iden form', async function(event) {
        event.stopPropagation();
        event.preventDefault();

        const $form = $(this);

        // tìm trong form các phần tử có class như bảng yêu cầu
        const instructor_identification = {
            id_type: $form.find('input[name="id_type"]:checked').val(),
            id_value: $form.find('input#id_value').val(),
            fullname: $form.find('input.fullname').val(),
            id_image_url: null,
            id_image_with_person_url: null,
        }

        if ($('input#id_image').length && $('input#id_image')[0].files.length > 0 || $('input#id_image_with_person').length && $('input#id_image_with_person')[0].files.length > 0) {
            const formData = new FormData();
        
            if ($('input#id_image').length && $('input#id_image')[0].files.length > 0) {
                const file = $('input#id_image')[0].files[0];
                formData.append('files[]', file);
                formData.append('keys[]', 'id_image_url');
            }

            if ($('input#id_image_with_person').length && $('input#id_image_with_person')[0].files.length > 0) {
                const file = $('input#id_image_with_person')[0].files[0];
                formData.append('files[]', file);
                formData.append('keys[]', 'id_image_with_person_url');
            }

            const response = await upload(formData);
            instructor_identification.id_image_url = response.id_image_url || null;
            instructor_identification.id_image_with_person_url = response.id_image_with_person_url || null;
        }

        console.log(instructor_identification)

        const { message, newInfo } = await userApi('instructor-identification', 'PUT', {instructor_identification})

        if (message && newInfo) {
            showNotification(message);
            user_info = newInfo
            $(document).trigger('userUpdated', [user_info]);
        }
    });
});

function setView() {
    const $container = $('.user__container');

    $container.empty();

    if (!user_info || !user_info.id) {
        window.location.href = '/login'
    } else {
        $container.append(`
            <div class="user-nav__container">
                <div class="user-nav col">
                    <div class="user-info item-center row gap-8">
                        <div class="user-avatar">
                            <img src="${ user_info.avatar_url || "/images/dark-user.png" }" alt="">
                        </div>
                        <div class="user-account__container col gap-4">
                            <span id="fullname">${ user_info.fullname || "" }</span>
                            <span id="username">${ user_info.username || "" }</span>
                        </div>
                    </div>
                    <div class="user-nav-items hide-on-mobile col">
                        <div class="item">
                            <a href="/info#account" class="user-spa-action row item-center gap-8" id="account">
                                <div class="icon center"><ion-icon name="person"></ion-icon></div>
                                <span>Tài khoản của tôi</span>
                            </a>
                        </div>
                        ${ user_info.instructor && user_info.identification ?
                            `<div class="item">
                                <a href="/info#instructor" class="user-spa-action row item-center gap-8" id="instructor">
                                    <div class="icon center"><ion-icon name="id-card"></ion-icon></div>
                                    <span>Thông tin giảng viên</span>
                                </a>
                            </div>`
                            :
                            ''
                        }
                        <div class="item">
                            <a href="/info#notifications" class="user-spa-action row item-center gap-8" id="notifications">
                                <div class="icon center"><ion-icon name="notifications"></ion-icon></div>
                                <span>Thông Báo</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="sub-body flex-1">
                
            </div>  
        `);
    }
}

function createAccountContainer() {
    const canEdit = user_info.provider ? 0 : 1;
    return `
        <div class="account__container col gap-16 full-width">
            <div class="item-box full-width">
                <div class="item-box__form full-width row gap-24">
                    <a href="#profile" class="sub_nav-item user-nav-item row item-center active">Thông tin tài khoản</a>
                    <a href="#change_password" class="sub_nav-item user-nav-item row item-center ">Đổi mật khẩu</a>
                    <a href="#notification_setting" class="sub_nav-item user-nav-item row item-center hide-on-mobile">Cài đặt thông báo</a>
                </div>
            </div>
            <div id="profile" class="account_panel col full-width">
                <div class="panel__header row">
                    <div class="title col">
                        <h3>Thông tin tài khoản</h3>
                        <span>Quản lý thông tin tài khoản</span>
                    </div>
                </div>
                <div class="panel__box  full-width">
                    <form class="edit-form update-info full-width flex-layout">
                        <div class="edit-form col gap-24">
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Tên đăng nhập</label>
                                </div>
                                <div class="edit-main flex-1">
                                    <div class="wo-input row full-width">
                                        <input type="text" class="username full-width full-height" value="${ user_info.username || "" }" disabled>
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Tên tài khoản</label>
                                </div>
                                <div class="edit-main  flex-1">
                                    <div class="wo-input row full-width">
                                        <input type="text" class="fullname full-width full-height" value="${ user_info.fullname || "" }">
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Email</label>
                                </div>
                                <div class="edit-main flex-1">
                                    <div class="wo-input row full-width">
                                        <input type="text" class="email full-width full-height" value="${ user_info.email || "" }">
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Số điện thoại</label>
                                </div>
                                <div class="edit-main flex-1 row gap-16">
                                    <div class="wo-input row full-width">
                                        <input type="text" class="phone_number full-width full-height" value="${ user_info.phone_number || "" }">
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Giới tính</label>
                                </div>
                                <div class="edit-main flex-1">
                                    <div class="gender row gap-24 item-center">
                                        <label for="gender_1" class="row gap-4">
                                            <input type="radio" name="gender" id="gender_1" value="Nam" ${ user_info.gender == 'Nam' ? 'checked' : '' }>
                                            <div>Nam</div>
                                        </label>
                                        <label for="gender_2" class="row gap-4">
                                            <input type="radio" name="gender" id="gender_2" value="Nữ" ${ user_info.gender == 'Nữ' ? 'checked' : '' }>
                                            <div>Nữ</div>
                                        </label>
                                        <label for="gender_3" class="row gap-4">
                                            <input type="radio" name="gender" id="gender_3" value="Khác" ${ user_info.gender == 'Khác' ? 'checked' : '' }>
                                            <div>Khác</div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="edit-row item-center row gap-16">
                                <div class="edit-label">
                                    <label for="" class="row">Ngày sinh</label>
                                </div>
                                <div class="edit-main flex-1">
                                    <div class="wo-input row full-width">
                                        <input type="date" class="date_of_birth full-width full-height" value="${ 
                                            user_info.date_of_birth ? 
                                            new Date(user_info.date_of_birth).toISOString().split('T')[0] : "" 
                                        }">
                                    </div>
                                </div>
                            </div>
                            <div class="full-width center">
                                <button class="submit-btn">Lưu</button>
                            </div>
                        </div>
                        <div class="edit-avatar__container">
                            <div class="col item-center gap-16">
                                <div class="avatar">
                                    <img src="${ user_info.avatar_url || "/images/dark-user.png" }" alt="">
                                </div>
                                <div class="">
                                    <input type="file" name="" id="avatar_url" style="display: none;" accept="image/*">
                                    <label for="avatar_url">Chọn ảnh</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>        
            </div>
            <div id="change_password" class="account_panel col full-width" style="display: none;">
                <div class="panel__header col gap-4">
                    <div class="title">
                        <h3>Đổi mật khẩu</h3>
                    </div>
                    <div class="suggest">
                        ${ canEdit ?
                            '<span>Vui lòng không cung cấp mật khẩu cho người khác để đảm bảo yếu tố bảo mật.</span>'
                            :
                            '<span>Tài khoản đăng nhập bằng ' + user_info.provider + ' sẽ không thể đổi mật khẩu.</span>'
                        }
                        
                    </div>
                </div>
                <div class="panel__box col full-width gap-16">
                    <form class="edit-form ${ canEdit ? '' : 'disabled' } full-width col gap-24">
                        <div class="edit-row item-center flex-layout gap-16">
                            <div class="edit-label item-center">
                                <label for="" class="row">Mật khẩu cũ</label>
                            </div>
                            <div class="edit-main  flex-1">
                                <div class="wo-input row full-width">
                                    <input type="password" id="old_password" ${ canEdit ? '' : 'disabled' }>
                                    <span class="eye-icon" id="toggleOldPassword"><i class="fa fa-eye-slash"></i></span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center flex-layout gap-16">
                            <div class="edit-label item-center">
                                <label for="" class="row">Mật khẩu mới</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="wo-input row full-width">
                                    <input type="password" id="new_password" ${ canEdit ? '' : 'disabled' }>
                                    <span class="eye-icon" id="toggleNewPassword"><i class="fa fa-eye-slash"></i></span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center flex-layout gap-16">
                            <div class="edit-label item-center">
                                <label for="" class="row">Xác nhận mật khẩu mới</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="wo-input row full-width">
                                    <input type="password" id="confim_new_password" ${ canEdit ? '' : 'disabled' }>
                                    <span class="eye-icon" id="toggleConfirmNewPassword"><i class="fa fa-eye-slash"></i></span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center flex-layout gap-16">
                            <div class="edit-label"></div>
                            <div class="edit-main flex-1">
                                <div class="condition-container col">
                                    <span id="condition-length">Mật khẩu mới phải có từ 8-16 ký tự</span>
                                    <span id="condition-lowercase">Chứa ít nhất một ký tự viết thường</span>
                                    <span id="condition-uppercase">Chứa ít nhất một ký tự viết hoa</span>
                                    <span id="condition-number">Chứa ít nhất một số</span>
                                </div>
                            </div>
                        </div>
                        <div class="full-width center">
                            <button type="submit" class="submit-btn" ${ canEdit ? '' : 'not-allowed' }>Lưu</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="notification_setting" class="account_panel col full-width" style="display: none;">
                <div class="waiting__container full-width center">
                    <div class="waiting-wrapper">
                        <div class="waiting set_1"></div>
                        <div class="waiting set_2"></div>
                        <div class="waiting set_3"></div>
                        <div class="waiting set_4"></div>
                        <div class="waiting set_5"></div>
                    </div>
                </div>
            </div>
        </div>
    `
}

function createInstructorContainer() {
    const instructor = user_info.instructor;
    const identification = user_info.identification;

    if (!instructor || !identification) {
        return ''
    }

    // Kiểm tra thời gian có đủ 6 tháng kể từ lần cập nhật cuối không
    const now = new Date();
    const verifiedAt = new Date(identification.verified_at);
    const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000; // 6 tháng tính theo mili giây
    const canEdit = !identification.verified_at || (now - updatedAt >= sixMonths);

    return `
        <div class="instructor__container col gap-16 full-width">
            <div class="item-box full-width">
                <div class="item-box__form full-width row gap-24">
                    <a href="#instructor_info" class="sub_nav-item user-nav-item row item-center active">Thông tin giảng dạy</a>
                    <a href="#instructor_iden" class="sub_nav-item user-nav-item row item-center ">Thông tin định danh</a>
                </div>
            </div>
            <div id="instructor_info" class="account_panel col full-width">
                <div class="panel__header col gap-4">
                    <div class="title col">
                        <h3>Thông tin giảng dạy</h3>
                    </div>
                    <div class="suggest">
                        <span>Thông tin định danh chỉ được thay đổi sau mỗi 6 tháng tính từ lúc được xác thực.</span>
                    </div>
                </div>
                <div class="panel__box flex-layout full-width">
                    <form class="edit-form col gap-24">
                        <div class="edit-row item-center row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Số điện thoại</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="wo-input row full-width">
                                    <input type="text" class="phone_number full-width full-height" value="${ instructor.phone_number }">
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Email</label>
                            </div>
                            <div class="edit-main  flex-1">
                                <div class="wo-input row full-width">
                                    <input type="text" class="email full-width full-height" value="${ instructor.phone_number }">
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Cấp bậc giảng dạy</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="teaching_levels row gap-24 item-center">
                                    <label for="teaching_levels_1" class="row gap-4">
                                        <input type="radio" name="teaching_levels" id="teaching_levels_1" value="Đại học" ${ instructor.teaching_levels == 'Đại học' ? 'checked' : '' }>
                                        <div>Đại học</div>
                                    </label>
                                    <label for="teaching_levels_2" class="row gap-4">
                                        <input type="radio" name="teaching_levels" id="teaching_levels_2" value="Cao đẳng" ${ instructor.teaching_levels == 'Cao đẳng' ? 'checked' : '' }>
                                        <div>Cao đẳng</div>
                                    </label>
                                    <label for="teaching_levels_3" class="row gap-4">
                                        <input type="radio" name="teaching_levels" id="teaching_levels_3" value="THPT" ${ instructor.teaching_levels == 'THPT' ? 'checked' : '' }>
                                        <div>THPT</div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row teaching_certificate__container row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Chứng chỉ giảng dạy</label>
                            </div>
                            <div class="edit-main relative row gap-16 flex-1">
                                <div class="preview-image">
                                    <embed
                                        src="${instructor.teaching_certificate_url + "#toolbar=0&navpanes=0" }"
                                        type="application/pdf"
                                        style="${instructor.teaching_certificate_url.endsWith('.pdf') ? '' : 'display: none;'} width: calc(100% + 16px); height: calc(100% + 8px); overflow: hidden;" alt="Teaching Certificate">
                                    <img src="${instructor.teaching_certificate_url}" style="${instructor.teaching_certificate_url.endsWith('.pdf') ? 'display: none;' : ''}" alt="Teaching Certificate">
                                </div>
                                <div class="image-action__container absolute row gap-16 center">
                                    <input type="file" id="teaching_certificate" accept="application/pdf, image/*" ${canEdit ? '' : 'disabled'}>
                                    <a href="${ instructor.teaching_certificate_url }" class="center success" target="_blank" title="Xem"><ion-icon name="eye-outline"></ion-icon></a>
                                    <label class="upload-btn center warning ${canEdit ? '' : 'not-allowed'}" for="teaching_certificate" title="Thêm mới"><ion-icon name="create-outline"></ion-icon></label>
                                    <button type="button" class="remove-image-btn danger hide" title="Xóa ảnh" data-backup-url="${ instructor.teaching_certificate_url }"><ion-icon name="close-outline"></ion-icon></button>
                                </div>
                            </div>
                        </div>
                        <span class="more-info center ${ instructor.is_approved ? 'success' : 'warning' }">
                        ${ instructor.is_approved ? 'Đã phê duyệt' : 'Chờ phê duyệt' }
                        </span>
                        <div class="full-width center">
                            <button type="submit" class="submit-btn">Lưu</button>
                        </div>
                    </form>
                </div>        
            </div>
            <div id="instructor_iden" class="account_panel col full-width" style="display: none;">
                <div class="panel__header col gap-4">
                    <div class="title">
                        <h3>Thông tin định danh</h3>
                    </div>
                    <div class="suggest">
                        <span>Thông tin định danh chỉ được thay đổi sau mỗi 6 tháng tính từ lúc được xác thực.</span>
                    </div>
                </div>
                <div class="panel__box col full-width gap-16">
                    <form class="edit-form ${canEdit ? '' : 'disabled'} full-width col gap-24">
                        <div class="edit-row item-center row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Hình thức định danh</label>
                            </div>
                            <div class="edit-main row item-center gap-16 flex-1">
                                <label class="row gap-4 item-center">
                                    <input type="radio" name="id_type" value="CCCD" ${identification.id_type == 'CCCD' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                                    <span>CCCD</span>
                                </label>
                                <label class="row gap-4 item-center">
                                    <input type="radio" name="id_type" value="CMND" ${identification.id_type == 'CMND' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                                    <span>CMND</span>
                                </label>
                                <label class="row gap-4 item-center">
                                    <input type="radio" name="id_type" value="Hộ chiếu" ${identification.id_type == 'Hộ chiếu' ? 'checked' : ''} ${canEdit ? '' : 'disabled'}>
                                    <span>Hộ chiếu</span>
                                </label>
                            </div>
                        </div>
                        <div class="edit-row item-center flex-layout gap-16">
                            <div class="edit-label item-center">
                                <label for="" class="row">Mã định danh</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="wo-input row full-width">
                                    <input type="password" id="id_value" value="${identification.id_value}" ${canEdit ? '' : 'disabled'}>
                                    <span class="eye-icon" id="toggleIdValue"><ion-icon name="eye-off-outline"></ion-icon></span>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row item-center row gap-16">
                            <div class="edit-label">
                                <label for="" class="row">Họ và tên</label>
                            </div>
                            <div class="edit-main flex-1">
                                <div class="wo-input row full-width">
                                    <input type="text" class="fullname full-width full-height" value="${identification.fullname}" ${canEdit ? '' : 'disabled'}>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row row row-info gap-16">
                            <div class="edit-label">
                                <label for="">Hình chụp của thẻ</label>
                            </div>
                            <div class="edit-main preview-image-container relative row flex-1">
                                <div class="preview-image">
                                    <img src="${ identification.id_image_url }" alt="">
                                </div>
                                <div class="image-action__container absolute center row gap-16">
                                    <input type="file" id="id_image" accept="image/*" ${canEdit ? '' : 'disabled'}>
                                    <a href="${ identification.id_image_url }" class="success" target="_blank"><ion-icon name="eye-outline"></ion-icon></a>
                                    <label class="upload-btn warning center ${canEdit ? '' : 'not-allowed'}" for="id_image"><ion-icon name="create-outline"></ion-icon></label>
                                    <button type="button" class="remove-image-btn hide danger" title="Xóa ảnh" data-backup-url="${ identification.id_image_url }"><ion-icon name="close-outline"></ion-icon></button>
                                </div>
                            </div>
                        </div>
                        <div class="edit-row row row-info gap-16">
                            <div class="edit-label">
                                <label for="">Hình chụp bạn đang cầm thẻ</label>
                            </div>
                            <div class="edit-main preview-image-container row relative flex-1">
                                <div class="preview-image">
                                    <img src="${ identification.id_image_with_person_url }" alt="" ${canEdit ? '' : 'disabled'}>
                                </div>
                                <div class="image-action__container absolute center row gap-16">
                                    <input type="file" id="id_image_with_person" accept="image/*">
                                    <a href="${ identification.id_image_with_person_url }" class="success" target="_blank"><ion-icon name="eye-outline"></ion-icon></a>
                                    <label class="upload-btn warning center ${canEdit ? '' : 'not-allowed'}" for="id_image_with_person"><ion-icon name="create-outline"></ion-icon></label>
                                    <button type="button" class="remove-image-btn hide danger" title="Xóa ảnh" data-backup-url="${ identification.id_image_with_person_url }"><ion-icon name="close-outline"></ion-icon></button>
                                </div>
                            </div>
                        </div>
                        <span class="more-info center ${ identification.is_verified ? 'success' : 'warning' }">
                        ${ identification.is_verified ? 'Đã xác thực' : 'Chờ xác thực' }
                        </span>
                        <div class="full-width center">
                            <button type="submit" class="submit-btn ${canEdit ? '' : 'not-allowed'}">Lưu</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `
}

function createNotificationContainer() {
    return `
    
    `
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

function updateUserNav() {
    const hash = window.location.hash;
    const $sub_body = $('.user__container .sub-body');

    switch(hash) {
        case '#account':
            $sub_body.empty().append(createAccountContainer());
            $('.user-spa-action').removeClass('active');
            $(hash).addClass('active');
            break;
        case '#instructor':
            $sub_body.empty().append(createInstructorContainer());
            $('.user-spa-action').removeClass('active');
            $(hash).addClass('active');
            break;
        case '#notifications':
            $sub_body.empty().append(createNotificationContainer());
            $('.user-spa-action').removeClass('active');
            $(hash).addClass('active');
            break;
        default:
            $sub_body.empty().append(createPageNotPoundComponent());
            $('.user-spa-action').removeClass('active');
            break
    }
}