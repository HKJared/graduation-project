keyword = '';
page = 1;
loading = false;

$(document).ready(function() {
    $('.menu .main').removeClass('active');
    $('#request-management').addClass('active');
    
    activateMenuWhenReady('#request-management');

    search();

    $(document).on('click.woEvent', '.row-table', function() {
        var subRequest = $(this).find('.sub-request');
        var icon = $(this).find('i');
        
        if (subRequest.is(':visible')) {
            subRequest.slideUp();
            icon.removeClass('rotate-180');
        } else {
            subRequest.slideDown();
            icon.addClass('rotate-180');
        }
    });

    $(document).on('submit.woEvent', '.search', function(event) {
        event.preventDefault();

        keyword = $('.search-text').val();
        page = 1;
        search();
    });

    $(document).on('click.woEvent', 'button.complete', function(event) {
        event.stopPropagation();

        const request_id = $(this).attr('data-requestid');

        showConfirm('Xác nhận đã xử lí yêu cầu liên hệ.', "Xác nhận", function(result) {
            if (result) {
                updateRequest(request_id);
            }
        });
    });

    $(document).on('click.woEvent', '.see-more-container button', function(event) {
        event.stopPropagation();

        page++;
        search();
    });
});

async function search() {
    renderLoading();

    const { data } = await apiWithAccessToken(`requests?page=${page}`)

    showRequests(data)
}

function showRequests(data) {
    if (page == 1) {
        $('.requests-container ul').empty();
    }

    if (!data.length) {
        if (page == 1) {
            const noResultHTML = `<div class="no-result">
                <h2>Không có bài viết nào phù hợp</h2>
                <span>Vui lòng thử tìm kiếm khác</span> 
            </div>`;

            $('.requests-container ul').append(noResultHTML);
        }

        return
    }
 
    for (let i = 0; i < data.length; i++) {
        let requestHTML = `
            <li class="row-table request-item" data-requestid="${data[i].id}" style="display: none">
                <div class="request row">
                    <i class="fa-solid fa-caret-down"></i>
                    <div class="id center">
                        <span>${data[i].id}  </span>
                    </div>
                    <div class="fullname center">
                        <span><strong>${data[i].fullname}</strong></span>
                    </div>
                    <div class="message center">
                        <span>${data[i].message}</span>
                    </div>
                    <div class="status center">
                        <span class="center ${data[i].status ? 'success-bg' : 'warning-bg'}">${data[i].status ? 'Đã xử lí' : 'Đang xử lí'}</span>
                    </div>
                </div>
                <ul class="sub-request">
                    <li><strong>Email:</strong> ${data[i].email}</li>
                    <li><strong>Số điện thoại:</strong> ${data[i].phone_number}</li>
                    <li><strong>Nội dung:</strong> ${data[i].message}</li>
                    ${data[i].status ? '' : '<li class="change-status" style="margin-top: 24px"><button type="button" class="complete" data-requestid="' + data[i].id + '">Xác nhận đã xử lí</button></li>'}
                </ul>
            </li>
        `;

        let $requestHTML = $(requestHTML);
        $('.request-items').append($requestHTML);
        $requestHTML.slideDown();
    }

    loading = false;
}

async function updateRequest(request_id) {
    const { message } = await apiWithAccessToken('request', 'PUT', { request_id: request_id });

    if (!message) return;

    showNotification(message);

    const $requestItem = $(`.request-item[data-requestid="${request_id}"]`);
    
    if ($requestItem.length) {
        // Cập nhật trạng thái hiển thị
        const $status = $requestItem.find('.status span');
        $status
            .removeClass('warning-bg')
            .addClass('success-bg')
            .text('Đã xử lí');
        
        // Ẩn nút "Xác nhận đã xử lí"
        $requestItem.find('.change-status').remove();

        // Thêm logic hiển thị khác nếu cần
        console.log(`Request ${request_id} has been updated.`);
    } else {
        console.warn(`Request with ID ${request_id} not found.`);
    }
}