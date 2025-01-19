editor;
keyword = '';
page = 1;

$(document).ready(function() {
    $('.menu .main').removeClass('active');
    $('#recruitment-management').addClass('active');
    
    activateMenuWhenReady('#recruitment-management');

    search();

    $(document).on('submit.woEvent', '.search', function(event) {
        event.preventDefault();

        keyword = $(this).find('input').val();
        page = 1;

        search();
    });

    $(document).on('click.woEvent', 'form.edit-recruitment .x-btn', function(event) {
        event.stopPropagation();

        $('.edit-recruitment-container').slideUp();
    });

    $('.edit-recruitment').on('submit', function(event) {
        event.preventDefault(); // Ngăn chặn hành động submit mặc định

        const recruitment = {
            id: $(this).data('recruitmentid'),
            position: $('#position').val(),
            department: $('#department').val(),
            location: $('#location').val(),
            quantity: $('#quantity').val(),
            salary_range: $('#salary_range').val(),
            experience_required: $('#experience_required').val(),
            application_deadline: $('#application_deadline').val(),
            detail: editor.getData(),
        };

        let hasError = false; // Biến kiểm tra lỗi

        // Kiểm tra các trường và thêm class .warning-border nếu trống
        for (let key in recruitment) {
            if (key !== 'detail' && !recruitment[key]) {
                $(`#${key}`).addClass('warning-border');
                hasError = true;
            }
        }

        // Nếu có lỗi, hiển thị thông báo và ngăn submit
        if (hasError) {
            showNotification('Vui lòng điền đầy đủ thông tin.');
            return; // Ngăn không cho form submit nếu có lỗi
        }

        showConfirm('Xác nhận lưu', 'Xác nhận', function(result) {
            if (result) {
                editRecruitment(recruitment);
            }
        });
    });

    $(document).on('click.woEvent', '.delete-btn', function(event) {
        event.stopPropagation();

        const id = $(this).data('recruitmentid');
        
        showConfirm('Xác nhận xóa bài tuyển dụng này', 'Xác nhận', function(result) {
            if(result) {
                deleteRecruitment(id);
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
    const { data } = await apiWithAccessToken(`recruitments?page=${page}`);

    showRecruitments(data)
}

function showRecruitments(recruitments) {
    if (page == 1) {
        $('.recruitment-items').empty();
    }

    for (let i = 0; i < recruitments.length; i++) {
        let recruitment_item = `
        <li class="recruitment-item row" data-recruitmentid="${recruitments[i].id}">
            <div class="info col">
                <h3 class="position">${recruitments[i].position}</h3>
                <span class="department"><strong>Bộ phận:</strong> ${recruitments[i].department}</span>
                <span class="application-deadline"><strong>Hạn ứng tuyển:</strong>  ${formatDate(recruitments[i].application_deadline)}</span>
            </div>
            <div class="action col flex-end gap-8">
                <a href="/admin/edit-recruitment?position=${recruitments[i].position}&id=${recruitments[i].id}" class="spa-action action-btn edit-btn warning-bg"><ion-icon name="settings-outline"></ion-icon> Chỉnh sửa</a>
                <button class="delete-btn danger-bg row center" type="button" data-recruitmentid="${recruitments[i].id}"><ion-icon name="trash-outline"></ion-icon> Xóa</button>
            </div>
        </li>
        `;

        $('.recruitment-items').append(recruitment_item)
    }
}

async function deleteRecruitment(id) {
    const { message } = await apiWithAccessToken('recruitment', 'DELETE', { recruitment_id: id })

    if (!message) return;

    showNotification(message)

    $('li.recruitment-item[data-recruitmentid="' + id + '"]').remove();
}