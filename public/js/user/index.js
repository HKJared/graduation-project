$(document).ready(async function() {
    if (localStorage.getItem('wiseowlUserAccessToken')) {
        refreshToken();

        setInterval(function() {
            refreshToken();
        }, 840000);

        const response = await getUserInfo();

        if (response.user) {
            user_info = response.user;
            $(document).trigger('userUpdated', [user_info]);
            setUserInfo(user_info);
        }
    }

    hideFullScreen();

    // Lấy element mới từ thẻ a.spa-action vừa được click
    $(document).on('click', '.spa-action', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const href = $(this).attr('href');
        // Kết hợp base URL hiện tại với href mới để tạo URL đầy đủ
        const fullUrl = new URL(href, window.location.origin + window.location.pathname);
        
        updateViewBasedOnPath(fullUrl.toString());
    });

    // Xử lý sự kiện popstate khi người dùng nhấn quay lại hoặc tiến tới
    $(window).on('popstate', function() {
        getElementByHref(window.location.pathname);
    });
});

// Hàm xử lý giao diện
function updateViewBasedOnPath(href) {
    // Tạo URL từ href và bảo toàn tất cả các phần của URL
    const newUrl = new URL(href, window.location.origin);
    
    // Cập nhật thanh địa chỉ mà không tải lại trang
    window.history.pushState({}, '', newUrl.toString());

    // Gọi hàm xử lý giao diện với URL đầy đủ (bao gồm pathname, search, hash)
    if (newUrl.pathname == '/' || newUrl.pathname == '') {
        getElementByHref('/home')
    } else {
        getElementByHref(newUrl.pathname + newUrl.search + newUrl.hash);
    }
}

function getElementByHref(href) {
    if (href == '/' || href == '') {
        href = '/home';
    }
    
    fetch(`/api/user/element${href}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        $(document).off('.woEvent');
        $('.main-body').html(html);

        $('html, body').animate({
            scrollTop: $('body').offset().top // hoặc giá trị mong muốn
        }, 500);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// hàm cập nhật người dùng (đã đăng nhập/ chưa đăng nhập)
function setUserInfo(user) {
    if (!user) {
        return
    }

    $('.avatar__container').empty().append(`
        <a href="/user/profile" class="full-height full-width center spa-action">            
            <img src="${ user.avatar_url }" alt="" srcset="${ user.avatar_url }, ${ user.avatar_url }" 
                 onerror="this.onerror=null; this.src='${ user.avatar_url }';">
        </a>
    `);

    $('body').addClass('logged-in');
}

// hàm gọi api
function refreshToken() {
    const token = localStorage.getItem('wiseowlUserRefreshToken');
    fetch('/api/user/refresh-token', {
        method: 'GET',
        headers: {
            "Content-Type": "application/json",
            "authentication": token
        }
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                localStorage.removeItem('wiseowlUserAccessToken');
                localStorage.removeItem('wiseowlUserRefreshToken');
                showNotification('Phiên đang nhập đã hết hạn, vui lòng đăng nhập lại.');
                setTimeout(function() {
                    window.location.href = '/'
                }, 2000)
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        localStorage.setItem('wiseowlUserAccessToken', result.access_token);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

async function getUserInfo() {
    const token = localStorage.getItem('wiseowlUserRefreshToken');
    if (!token) {
        return null
    }

    try {
        const response = await fetch(`/api/user/info`, {
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
    }
}