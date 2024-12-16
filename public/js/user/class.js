$(document).ready(async function () {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#class_nav').addClass('active');
    updateUnderline();

    setTitle('Lớp học');
});