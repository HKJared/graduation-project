$(document).ready(function() {
    setTimeout(function () {
        const $logoContainer = $('.logo__container');
    
        $logoContainer.removeClass('fullscreen');
    }, 1000);

    // Lắng nghe sự kiện click vào nav-item để cập nhật vị trí của underline
    $('.nav-item').on('click', function (event) {
        event.preventDefault();

        // Loại bỏ class active khỏi tất cả nav-item
        $('.nav-item').removeClass('active');

        // Thêm class active vào mục đã nhấp
        $(this).addClass('active');

        // Cập nhật vị trí underline
        updateUnderline();
    });
})

function updateUnderline() {
    const $activeItem = $('.nav-item.active');
    const $underline = $('.underline-bg');

    if ($activeItem.length && $underline.length) {
        // Lấy tọa độ và kích thước của mục active
        const itemOffset = $activeItem.position();
        const itemWidth = $activeItem.outerWidth();

        // Tính toán vị trí để căn giữa underline-bg với nav-item
        const leftPosition = itemOffset.left + (itemWidth / 2) - (189 / 2);

        // Cập nhật vị trí và chiều rộng của underline-bg
        $underline.css({
            width: 189,
            left: leftPosition
        });
    }
}


