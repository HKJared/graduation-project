//set view
$(document).ready(function() {
    $('.menu .main').removeClass('active');
    $('#admin-management').addClass('active');
    
    activateMenuWhenReady('#admin-management');

    setView();

    //  Lấy page, keyword từ params
    const url = window.location.href;
    const urlParams = new URLSearchParams(new URL(url).search);
    page = 1;
    keyword = '';
    itemsPerPage = 15;

    $(document).on('adminsUpdated.woEvent', function(e, admins) {
        showAdmins(admins);
    });

    search();

    let debounceTimeout;
    $(document).on('input.woEvent', '.search__container input', function() {
        keyword = $(this).val();
        page = 1;

        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function () {
            search(keyword); // Gọi hàm search với keyword
        }, 500);
    })
});

async function search() {
    const { admins, totalPages } = await apiWithAccessToken(`admins?keyword=${ keyword }&page=${page}&itemsPerPage=15`);

    $(document).trigger('adminsUpdated', [admins])
}

function setView() {
    const $container = $('.admin__container');

    $container.append(`
        <div class="action-header row flex-box item-center">
            <div class="search__container flex-1 relative">
                <div class="wo-input">
                    <input type="text" name="" id="" placeholder="Tìm kiếm quản trị viên">
                </div>
                <span class="absolute center"><ion-icon name="search-outline"></ion-icon></span>
            </div>
            <div class="row gap-16 item-center">
                <button class="add-admin-btn action-btn add-btn row gap-4 item-center"><ion-icon name="add-outline"></ion-icon> Thêm</button>
                <a href="/admin/permission-management" class="action-btn add-btn spa-action item-center row gap-4">Quản lý phân quyền</a>
            </div>
        </div>

        <div class="admin-table full-width">
            <table class="full-width col">
                <thead>
                    <tr class="row item-center">
                        <th>STT</th>
                        <th>Họ và tên</th>
                        <th>Tên tài khoản</th>
                        <th>Chức vụ</th>
                        <th>Ngày sinh</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Giới tính</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    
                    
                </tbody>
            </table>
        </div>    
    `)
}

function showAdmins(admins) {
    const $tableBody = $('.admin-table tbody');
    $tableBody.empty()
    
    if (!admins || !admins.length) {
        $tableBody.append(`
            <div>
                ${ createAlertNotFoundComponent('Không có dữ liệu phù hợp') }
            </div>    
        `)

        return
    }

    let bodyHTML =''

    admins.forEach((admin, index) => {
        bodyHTML += `
            <tr class="row item-center">
                <td>${ (page - 1)*itemsPerPage + index + 1 }</td>
                <td>
                    <div class="row gap-16 item-center">
                        <img src="${admin.avater_url|| "/images/dark-user.png"} " alt="">
                        <span>${admin.fullname}</span>
                    </div>
                </td>
                <td>${admin.username}</td>
                <td>${admin.role_name}</td>
                <td>${admin.date_of_birth || ''}</td>
                <td>${admin.email || ''}</td>
                <td>${admin.phone_number || ''}</td>
                <td>${admin.gender || ''}</td>
                <td>
                    <div class="row full-width flex-end full-width gap-8">
                        <button class="disable-btn row gap-4 danger" title="Vô hiệu hóa tài khoản"><ion-icon name="lock-closed-outline"></ion-icon></button>
                        <button class="edit-role-btn row gap-4 warning" title="Chỉnh sửa chức vụ"><ion-icon name="create-outline"></ion-icon></button>
                        <button class="delete-admin-btn danger" title="Xóa tài khoản"> <ion-icon name="trash-outline"></ion-icon></button>
                    </div>
                </td>
            </tr>
        `
    });

    $tableBody.append(bodyHTML)
}

