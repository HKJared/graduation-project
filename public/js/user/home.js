$(document).ready(function() {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#home_nav').addClass('active');
    updateUnderline();

    setTitle('Trang chủ')
});