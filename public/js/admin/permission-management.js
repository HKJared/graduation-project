$(document).ready(async function() {
    $('.menu .main').removeClass('active');
    $('#admin-management').addClass('active');
    
    activateMenuWhenReady('#admin-management');

    setView();

    $(document).on('updatedRoles.woEvent', function(e, roles) {
        showRoles(roles)
    })

    const response = await apiWithAccessToken('roles');
    if (response && response.roles) {
        roles = response.roles

        $(document).trigger('updatedRoles', [roles])
    }

    $(document).on('click.woEvent', '.submit-role-permissions-btn', async function() {
        const role_id = $(this).attr('data-role-id');

        if (!role_id) {
            return
        }

        const permission_ids = $('.role_permission___container .box__body input[type="checkbox"]:checked')
        .map(function () {
            return $(this).val(); // Trả về giá trị của checkbox (permission_id)
        })
        .get();

        const {message, new_role} = await apiWithAccessToken('role-permissions', 'PUT', { id: role_id, permission_ids: permission_ids });

        if (message && new_role) {
            // Tìm phần tử trong mảng roles có id = new_role.id để cập nhật
            const existingRoleIndex = roles.findIndex(role => role.id === new_role.id);
            
            if (existingRoleIndex !== -1) {
                // Nếu tìm thấy, thay thế phần tử cũ bằng phần tử mới
                roles[existingRoleIndex] = new_role;
            } else {
                // Nếu không tìm thấy, thêm phần tử mới vào mảng roles
                roles.push(new_role);
            }

            showNotification(message)
        }
    });

    $(document).on('click.woEvent', '.manager-role-btn', function() {
        $('.role_manage___container').css('display', 'flex');

        showRoleManage(roles)
    })
});

function setView() {
    const full_permission_group = [
        {
            name: "topic",
            label: "Nhóm quyền chủ đề hệ thống",
            permissions: [
                { id: 6, name: "topic-creation", label: "Tạo chủ đề" },
                { id: 7, name: "topic-edit", label: "Sửa chủ đề" },
                { id: 8, name: "topic-delete", label: "Xóa chủ đề" },
                { id: 12, name: "topic-lock", label: "Khóa chủ đề" }
            ]
        },
        {
            name: "exercise",
            label: "Nhóm quyền bài tập hệ thống",
            permissions: [
                { id: 9, name: "exercise-creation", label: "Tạo bài tập" },
                { id: 10, name: "exercise-edit", label: "Sửa bài tập" },
                { id: 11, name: "exercise-delete", label: "Xóa bài tập" }
            ]
        },
        {
            name: "user",
            label: "Nhóm quyền người dùng",
            permissions: [
                { id: 5, name: "user-disable", label: "Vô hiệu hóa người dùng" }
            ]
        }
    ];
    
    const $permissionContainerBody = $('.role_permission___container .panel__body');

    full_permission_group.forEach(group => {
        // Tạo phần tử nhóm quyền
        const $permissionBox = $(`
            <div class="permission__box col">
                <div class="box__header row gap-8 item-center">
                    <input type="checkbox" class="header-checkbox" value="${group.name}">
                    <span>${group.label}</span>
                </div>
                <div class="box__body">
                    <ul class="col gap-2"></ul>
                </div>
            </div>
        `);

        // Lấy container ul cho các quyền
        const $permissionList = $permissionBox.find('.box__body ul');

        // Thêm các quyền vào danh sách
        group.permissions.forEach(permission => {
            const $permissionItem = $(`
                <li class="permission-item row item-center gap-8">
                    <input type="checkbox" class="item-checkbox" value="${permission.id}">
                    <span>${permission.label}</span>
                </li>
            `);
            $permissionList.append($permissionItem);
        });

        // Append nhóm quyền vào container chính
        $permissionContainerBody.append($permissionBox);

        // Thêm sự kiện cho header checkbox
        $permissionBox.find('.header-checkbox').on('change', function () {
            const isChecked = $(this).is(':checked');
            $permissionBox.find('.item-checkbox').prop('checked', isChecked);
        });

        // Thêm sự kiện cho các checkbox bên dưới
        $permissionBox.find('.item-checkbox').on('change', function () {
            const $allItems = $permissionBox.find('.item-checkbox');
            const $checkedItems = $allItems.filter(':checked');
            
            // Nếu tất cả được tích, tích vào header; nếu không, bỏ tích header
            $permissionBox.find('.header-checkbox').prop('checked', $allItems.length === $checkedItems.length);
        });
    });
}

function updateViewPermission() {
    const role_id = $('.role-items.active').attr('data-role-id');

    // Reset tất cả các checkbox trong $permissionContainerBody
    const $permissionContainerBody = $('.role_permission___container .panel__body');
    $permissionContainerBody.find('input[type="checkbox"]').prop('checked', false);

    const role = roles.find(r => r.id == role_id);

    const permissions = role.permissions;

    if (!permissions || !permissions.length) {
        $('.role_permission___container .submit-role-permissions-btn').removeAttr('data-role-id');
        return
    }
    $('.role_permission___container .submit-role-permissions-btn').attr('data-role-id', role.id);

    // Tích vào các checkbox có id trong mảng permissions
    permissions.forEach(permission => {
        $permissionContainerBody.find(`.item-checkbox[value="${permission.id}"]`).prop('checked', true);
    });

    // Cập nhật trạng thái checkbox header
    $permissionContainerBody.find('.permission__box').each(function () {
        const $box = $(this);
        const $allItems = $box.find('.item-checkbox');
        const $checkedItems = $allItems.filter(':checked');

        // Nếu tất cả checkbox con được tích, tích vào header
        $box.find('.header-checkbox').prop('checked', $allItems.length === $checkedItems.length);
    });
}

function showRoles(roles, role_active_id) {
    const $roleContainerBody = $('.role__container .panel__body');
    
    // Xóa nội dung cũ
    $roleContainerBody.empty();

    // Kiểm tra nếu danh sách rỗng
    if (!roles || !roles.length) {
        $roleContainerBody.append(createEmptyDisplay());
        return;
    }

    // Tạo danh sách ul
    const $roleList = $('<ul class="col gap-8"></ul>');

    // Tạo phần tử li từ mảng roles
    roles.forEach((role, index) => {
        const isActive = role_active_id ? role.id === role_active_id : index === 0;
        const $roleItem = $(`
            <li class="role-items row item-center full-width flex-box" data-role-id="${role.id}">
                <span>${role.name}</span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
            </li>
        `);

        // Nếu là vai trò active, thêm class active
        if (isActive) {
            $roleItem.addClass('active');
        }

        // Thêm sự kiện click cho li
        $roleItem.on('click', function () {
            if ($(this).hasClass('active')) {
                return
            }

            $('.role-items').removeClass('active'); // Bỏ class active ở tất cả các li khác
            $(this).addClass('active'); // Thêm class active cho li được click
            updateViewPermission()
        });

        $roleList.append($roleItem);
    });

    // Thêm danh sách vào container
    $roleContainerBody.append($roleList);
    updateViewPermission()
}

function showRoleManage(roles) {
    const $ulBox = $('.role_manage___box ul');
    $ulBox.empty(); // Xóa danh sách hiện tại trước khi thêm mới

    // Hàm khôi phục trạng thái ban đầu của li
    function resetRoleItem($roleItem, role) {
        const $roleName = $('<span></span>').text(role.name);

        // Nút "Sửa"
        const $editBtn = $('<button class="warning"><ion-icon name="create-outline"></ion-icon></button>').on('click', function () {
            enterEditMode($roleItem, role);
        });

        // Nút "Xóa"
        const $deleteBtn = $('<button class="danger"><ion-icon name="trash-outline"></ion-icon></button>').on('click', async function () {
            const success = await deleteRole(role.id);
            if (success) {
                $roleItem.remove();
            }
        });

        // Gói các nút vào div
        const $actionBtns = $('<div class="row gap-8"></div>').append($editBtn).append($deleteBtn);

        // Khôi phục nội dung li
        $roleItem.empty().append($roleName).append($actionBtns).addClass('role-item').data('role-id', role.id);
    }

    // Hàm chuyển li sang chế độ chỉnh sửa
    function enterEditMode($roleItem, role) {
        const $input = $('<input type="text" class="role-input row item-center flex-1" />').val(role.name);
        const $submitBtn = $('<button class="success"><ion-icon name="checkmark-outline"></ion-icon></button>').on('click', async function () {
            const updatedName = $input.val().trim();

            if (!updatedName) {
                showNotification("Tên không được để trống!", "error");
                return;
            }

            if (updatedName === role.name) {
                resetRoleItem($roleItem, role);
                return;
            }

            const success = await updateRole(role.id, updatedName);
            if (success) {
                role.name = updatedName; // Cập nhật tên trong mảng roles
                resetRoleItem($roleItem, role);
                showNotification("Cập nhật thành công!", "success");
            } else {
                showNotification("Cập nhật thất bại!", "error");
            }
        });

        $roleItem.empty().append($input).append($submitBtn);
    }

    // Hàm thêm chức vụ mới
    function createNewRoleItem() {
        const $roleItem = $('<li class="row item-center flex-box gap-16"></li>');

        const $input = $('<input type="text" class="role-input row item-center flex-1" placeholder="Nhập tên chức vụ mới" />');
        const $submitBtn = $('<button class="success"><ion-icon name="checkmark-outline"></ion-icon></button>').on('click', async function () {
            const newRoleName = $input.val().trim();

            if (!newRoleName) {
                showNotification("Tên không được để trống!", "error");
                return;
            }

            const success = await createRole(newRoleName);
            if (success) {
                const newRole = { id: Date.now(), name: newRoleName }; // Mock ID, thay bằng từ server nếu có
                roles.push(newRole);
                resetRoleItem($roleItem, newRole);
                createNewRoleItem();
                showNotification("Tạo thành công!", "success");
            } else {
                showNotification("Tạo thất bại!", "error");
            }
        });

        $roleItem.append($input).append($submitBtn);
        $ulBox.append($roleItem);
    }

    // Tạo danh sách roles
    roles.forEach(role => {
        const $roleItem = $('<li class="row item-center flex-box gap-16"></li>');
        resetRoleItem($roleItem, role);
        $ulBox.append($roleItem);
    });

    // Thêm ô nhập mới ở cuối
    createNewRoleItem();
}

async function deleteRole(id) {
    const { message } = await apiWithAccessToken('role', 'DELETE', { id });

    if (message) {
        showNotification(message);

        // Tìm role-item tương ứng
        const $roleItem = $(`.role_manage___box ul .role-item[data-role-id="${id}"]`);

        // Kiểm tra nếu role-item đang active
        const isActive = $roleItem.hasClass('active');

        // Xóa phần tử khỏi DOM
        $roleItem.remove();

        // Nếu role bị xóa đang active, chuyển active sang role đầu tiên
        if (isActive) {
            const $firstItem = $('.role_manage___box ul .role-item').first();
            $firstItem.addClass('active');
        }

        // Xóa role khỏi danh sách roles
        const index = roles.findIndex(role => role.id === id);
        if (index !== -1) roles.splice(index, 1);

        return true;
    }

    return false;
}

async function updateRole(id, name) {
    const { message, new_role } = await apiWithAccessToken('role', 'PUT', { id, name });

    if (message && new_role) {
        const existingRoleIndex = roles.findIndex(role => role.id === new_role.id);
            
        if (existingRoleIndex !== -1) {
            // Nếu tìm thấy, thay thế phần tử cũ bằng phần tử mới
            roles[existingRoleIndex] = new_role;
        } else {
            // Nếu không tìm thấy, thêm phần tử mới vào mảng roles
            roles.push(new_role);
        }

        showNotification(message);

        showRoles(roles, new_role.id);
        return true
    }
    return false
}

async function createRole(name) {
    const { message, new_role } = await apiWithAccessToken('role', 'POST', {name});

    if (message && new_role) {
        roles.push(new_role);

        showRoles(roles, new_role.id);

        showNotification(message)
        return true
    }

    return false
}