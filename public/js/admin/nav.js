$(document).ready(async function() {
    if (!permissions.length) {
        const response = await getPermissions();
        if (response && response.permissions) {
            permissions = response.permissions;
            
            displayNavByPermissions(permissions);
            // Phát ra sự kiện tùy chỉnh 'permissionsUpdated' sau khi permissions đã được cập nhật
            $(document).trigger('permissionsUpdated', [permissions]);
        }
    }
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

// Hàm gọi API
async function getPermissions() {
    const token = localStorage.getItem('wiseowlAdminAccessToken');
    renderLoading();
    
    try {
        const response = await fetch(`/api/admin/role-permissions`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "authentication": token
            }
        });

        const result = await response.json();

        if (!response.ok) {
            showNotification(result.message);
            throw new Error('Network response was not ok');
        }

        return result; 
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    } finally {
        removeLoading();
    }
}