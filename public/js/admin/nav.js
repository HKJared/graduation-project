$(document).ready(async function() {
    await refreshToken();

    if (!permissions.length) {
        const response = await apiWithRefreshToken('role-permissions', 'GET');
        if (response && response.permissions) {
            permissions = response.permissions;
            
            displayNavByPermissions(permissions);
            // Phát ra sự kiện tùy chỉnh 'permissionsUpdated' sau khi permissions đã được cập nhật
            $(document).trigger('permissionsUpdated', [permissions]);
        }
    }

    if (admin_info != {}) {
        const response = await apiWithAccessToken('info', 'GET');
        if (response.admin) {
            admin_info = response.admin;
            $(document).trigger('AdminUpdated', [admin_info]);
            setAdminInfo(admin_info);
        }
    }

    

    $(document).on('click', '.logout-btn', function() {
        localStorage.removeItem('wiseowlAdminRefreshToken');
        localStorage.removeItem('wiseowlAdminAccessToken');
 
        clearDataAdmin();
 
        window.location.href = '/admin/login'
     });
});

// Hàm xử lí giao diện
function displayNavByPermissions(permissions) {
    const $menu = $('ul.menu');

    const navMap = {
        "Quản lý Quản Trị Viên": {
            icon: "fa-user-gear",
            permissions: [2, 3, 4],
            partial: "admin-management"  // Tên file EJS partial
        },
        "Quản lý Người Dùng": {
            icon: "fa-user-group",
            permissions: [5], // Thêm các id liên quan nếu có
            partial: "user-management"
        },
        "Quản Lý Bài Tập Hệ Thống": {
            icon: "fa-gears",
            permissions: [6, 7, 8, 9, 10, 11],
            partial: "system-exercise-management"
        },
        "Quản Lý Yêu Cầu Liên Hệ": {
            icon: "fa-clipboard-question",
            permissions: [13, 14],
            partial: "request-management"
        },
        "Quản Lý Tuyển Dụng": {
            icon: "fa-users-viewfinder",
            permissions: [15, 16, 17],
            partial: "recruitment-management"
        }
    };

    $.each(navMap, function(key, value) {
        if (permissions.some(p => value.permissions.includes(p.id))) {
            $menu.append(`
                <li class="col has-sub-menu">
                    <a href="/admin/${value.partial}" id="${value.partial}" class="main item-center row gap-16 spa-action">
                        <div class="title row gap-8 item-center">
                            <div class="title__icon center">
                                <i class="fa-solid ${value.icon}"></i>
                            </div>
                            <span>${key}</span>
                        </div>
                    </a>
                </li>
            `);
        }
    });
}

async function refreshToken() {
    const token = localStorage.getItem('wiseowlAdminRefreshToken');
    fetch('/api/admin/refresh-token', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authentication": token
        }
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                localStorage.removeItem('wiseowlAdminAccessToken');
                localStorage.removeItem('wiseowlAdminRefreshToken');
                showNotification('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');

                setTimeout(function() {
                    window.location.href = '/admin/login'
                }, 2000);
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        // Lưu token mới vào localStorage
        localStorage.setItem('wiseowlAdminAccessToken', result.access_token);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// hàm cập nhật người dùng (đã đăng nhập/ chưa đăng nhập)
function setAdminInfo(admin_info) {
    if (!admin_info) {
        return
    }

    $('.avatar__container').empty().append(`
        <a href="/admin/profile" class="full-height full-width center spa-action" style="background-color: var(--color-black-100)">            
            <img src="${ admin_info.avatar_url }" alt="" srcset="${ admin_info.avatar_url }, ${ admin_info.avatar_url }" 
                 onerror="this.onerror=null; this.src='/images/logo-oval.png';">
        </a>
        <div class="tooltip__container">
                <div class="tooltip__box">
                    <div class="tooltip__triangle"></div>
                    <div class="tooltip__content col">
                        <a href="/admin/profile" class="tooltip-item spa-action center">Tài Khoản Của Tôi</a>
                        <button class="tooltip-item logout-btn">Đăng Xuất</button>
                    </div>
                </div>
            </div>
        </a>
    `);

    $('body').addClass('logged-in');
}