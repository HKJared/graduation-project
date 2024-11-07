var intervalId = null;
$(document).ready(async function() {
    refreshToken();

    setInterval(function() {
        refreshToken();
    }, 840000);


    if (admin_info != {}) {
        const response = await getAdminInfo();
        if (response.admin) {
            admin_info = response.admin;
            $(document).trigger('AdminUpdated', [admin_info]);
            setAdminInfo(admin_info);
        }
    }

    const currentHref = window.location.href;
    updateViewBasedOnPath(currentHref);

    // ẩn nav
    $(document).on('click', '.sidebar-toggle', function() {
        $('nav').toggleClass('hidden');
        $('main').toggleClass('shifted');
    });

    // Xử lý sự kiện cuộn cho .nav-item
    $(document).on('click', '.nav-item', function(event) {
        event.preventDefault();

        const hash = $(this).attr('href');
        scrollToElementInMainBody(hash);

        // Cập nhật active class cho nav-item
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        // Cập nhật underline
        updateUnderlinePosition();
    });

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

//hàm xử lí giao diện
function updateViewBasedOnPath(href) {
    // Tạo URL từ href và bảo toàn tất cả các phần của URL
    const newUrl = new URL(href, window.location.origin);
    
    // Cập nhật thanh địa chỉ mà không tải lại trang
    window.history.pushState({}, '', newUrl.toString());

    // Gọi hàm xử lý giao diện với URL đầy đủ (bao gồm pathname, search, hash)
    if (newUrl.pathname == '/admin/' || newUrl.pathname == '/admin') {
        getElementByHref('/admin/dashboard')
    } else {
        getElementByHref(newUrl.pathname + newUrl.search + newUrl.hash);
    }
}

function getElementByHref(href) {
    if (href == '/admin/' || href == '/admin') {
        href = '/admin/home';
    }

    href = href.replace('/admin', '');

    const token = localStorage.getItem('wiseowlAdminAccessToken');

    fetch(`/api/admin/element${href}`, {
        method: 'GET',
        headers: {
            "authentication": token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        $(document).off('.wiseowlEvent');
        $('.main-body').html(html);
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

function activateMenuWhenReady(selector) {
    const intervalDuration = 100; // Thời gian lặp lại kiểm tra (ms)

    // Xóa lớp active ở tất cả các phần tử nav-item
    $('.menu .main').removeClass('active');

    // Kiểm tra sự tồn tại của phần tử trong DOM
    const checkElementExists = setInterval(function() {
        if ($(selector).length > 0) {
            // Nếu phần tử đã tồn tại, dừng lắng nghe và thêm lớp active
            $(selector).addClass('active');
            clearInterval(checkElementExists);
        }
    }, intervalDuration);
}

function updateActiveNavItem() {
    const fullQuery = window.location.search;
    let isActiveFound = false;

    $('.nav-item').each(function() {
        const dataQuery = $(this).attr('data-search-query');
        if (dataQuery && fullQuery.includes(dataQuery)) {
            $(this).addClass('active');
            isActiveFound = true;
        } else {
            $(this).removeClass('active');
        }
    });

    // Nếu không có phần tử nào phù hợp, thêm active cho phần tử "Tất cả"
    if (!isActiveFound) {
        $('.nav-item[data-search-query=""]').addClass('active');
    }

    // Cập nhật underline
    updateUnderlinePosition();
}

// Hàm cuộn đến phần tử trong .main-body với khoảng cách cách 60px từ trên cùng
function scrollToElementInMainBody(hash) {
    const targetElement = $(hash);
    if (targetElement.length) {
        const mainBody = $('.main-body');
        const offsetTop = targetElement.offset().top - mainBody.offset().top - 60;
        mainBody.animate({ scrollTop: mainBody.scrollTop() + offsetTop }, 500);
    }
}

// Cập nhật vị trí của underline
function updateUnderlinePosition() {
    const $activeItem = $('.nav-item.active');
    const underline = $('.underline');
    
    if ($activeItem.length) {
        const position = $activeItem.position();
        underline.css({
            'width': $activeItem.outerWidth() + 'px',
            'left': position.left + 'px'
        });
    }
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
    `);

    $('body').addClass('logged-in');
}

// hàm gọi API
function logout() {
    const token = localStorage.getItem('wiseowlAdminRefreshToken');
    // renderLoading(); 
    fetch('/api/logout', {
        method: 'POST',
        headers: {
            "authentication": token,
            "Content-Type": "application/json" 
        }
    })
    .then(response => {
        return response.json().then(result => {
            if (!response.ok) {
                // removeLoading();
                localStorage.removeItem('wiseowlAdminAccessToken');
                localStorage.removeItem('wiseowlAdminRefreshToken');
                window.location.href = '/admin/'
                throw new Error('Network response was not ok');
            }
            return result;
        });
    })
    .then(result => {
        // removeLoading();
        localStorage.removeItem('wiseowlAdminAccessToken');
        localStorage.removeItem('wiseowlAdminRefreshToken');
        window.location.href = '/login'
    })
    .catch(error => {
        // removeLoading();
        console.error('There was a problem with the fetch operation:', error);
    });
}

function refreshToken() {
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
                showNotification('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
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

async function getAdminInfo() {
    const token = localStorage.getItem('wiseowlAdminAccessToken');
    if (!token) {
        return null
    }

    try {
        const response = await fetch(`/api/admin/info`, {
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