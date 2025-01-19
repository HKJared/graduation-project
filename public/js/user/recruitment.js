$(document).ready(async function() {
    $(".nav-item").removeClass("active");
    updateUnderline();

    const { data } = await userApi('recruitments');
    // console.log(data)
    if (data && data.length > 0) showRecruitments(data);

    $(document).on('click.woEvent', '.show-detail', function() {
        const $recruitmentItem = $(this).closest('.recruitment');
        $recruitmentItem.find('.detail').slideDown();
    });

    $(document).on('click.woEvent', '.btn-hide', function() {
        $(this).closest('.detail').slideUp();
    });

    $(document).on('click.woEvent', '.btn-apply', function() {
        const recruitment_id = $(this).data('recruitmentid');
        const position = $(this).closest('.recruitment').find('.title-recruitment').text();
        $('#apply-form').data('recruitmentid', recruitment_id);
        $('#apply-form').find('h2').html(`Ứng tuyển vị trí: ${ position }`);
        $('.apply-container').show();
        $('.blur__container').show();
    });

    $(document).on('click.woEvent', '.x-btn', function() {
        $('#apply-form input').val('');
        $('.apply-container').hide();
        $('.blur__container').hide();
    });

    $(document).on('submit.woEvent', '#apply-form', function(event) {
        event.preventDefault();

        const recruitment_application = {
            recruitment_id: $(this).data('recruitmentid'),
            fullname: $('#fullname').val(),
            email: $('#email').val(),
            phone_number: $('#phone_number').val(),
            cv_link: $('#cv_link').val()
        };

        let hasError = false; // Biến kiểm tra lỗi

        // Kiểm tra các trường và thêm class .warning-border nếu trống
        for (let key in recruitment_application) {
            if (key !== 'detail' && !recruitment_application[key]) {
                $(`#${key}`).addClass('warning-border');
                hasError = true;
            }
        }

        // Nếu có lỗi, hiển thị thông báo và ngăn submit
        if (hasError) {
            showNotification('Vui lòng điền đầy đủ thông tin.');
            return; // Ngăn không cho form submit nếu có lỗi
        }

        createRecruitmentApplication(recruitment_application);
    });
});

function showRecruitments(recruitments) {
    const $container = $('.recruitments-container.left');

    $container.empty();

    recruitments.forEach(recruitment => {
        const $recruitmentDiv = $(`
            <div class="recruitment col">    
                <h1 class="title-recruitment">${recruitment.position}</h1>
                <div>
                    <div class="card-item">
                        <div class="row">
                            <div class="col-4 row center card-item-content">
                                <div class="icon-card-item">
                                    <ion-icon name="cash-outline"></ion-icon>
                                </div>
                                <div class="row col">
                                    <p data-translate="recruitments_text2">Mức lương</p>
                                    <h3>${recruitment.salary_range}</h3>
                                </div>
                            </div>
                            <div class="col-4 row center card-item-content">
                                <div class="icon-card-item">
                                    <ion-icon name="location-outline"></ion-icon>
                                </div>
                                <div class="row col">
                                    <p data-translate="recruitments_text3">Địa điểm</p>
                                    <h3>${recruitment.location}</h3>
                                </div>
                            </div>
                            <div class="col-4 row center card-item-content">
                                <div class="icon-card-item">
                                    <ion-icon name="hourglass-outline"></ion-icon>
                                </div>
                                <div class="row col">
                                    <p data-translate="recruitments_text4">Kinh nghiệm</p>
                                    <h3>${recruitment.experience_required} năm</h3>
                                </div>
                            </div>
                        </div>
                        <div class="row" style="margin-top: 20px;">
                            <i class="fa-solid fa-briefcase" aria-hidden="true" style="margin-right: 12px;"></i>
                            <p><strong data-translate="recruitments_text5">Phòng ban:</strong> ${recruitment.department}</p>
                        </div>
                        <div class="row" style="margin-top: 10px;">
                            <i class="fa-solid fa-user" aria-hidden="true" style="margin-right: 12px;"></i>
                            <p><strong data-translate="recruitments_text6">Số lượng tuyển:</strong> ${recruitment.quantity}</p>
                        </div>
                        <div class="row" style="margin-top: 10px;">
                            <i class="fa fa-calendar" aria-hidden="true" style="margin-right: 12px;"></i>
                            <p><strong data-translate="recruitments_text7">Hạn nộp hồ sơ:</strong> ${formatDate(recruitment.application_deadline)}</p>
                        </div>
                        <div class="row" style="margin-top: 20px; gap:20px;">
                            <button class="btn-apply" data-recruitmentid="${recruitment.recruitment_id}" data-translate="recruitments_text8">Ứng tuyển ngay</button>
                            <button class="show-detail" data-translate="recruitments_text9">Xem chi tiết</button>
                        </div>
                    </div>
                </div>
                <div class="card-item detail" style="margin-top: 20px; display: none;">
                    <button class="btn-hide">Ẩn</button>
                    ${recruitment.detail}    
                </div>
            </div>
        `);

        $container.append($recruitmentDiv);
    });
}


//                 <% for (let i = 0; i < recruitments.length; i++) { %>
//                     <div class="recruitment col">    
//                         <h1 class="title-recruitment"><%- recruitments[i].position %></h1>
//                         <div>
//                             <div class="card-item">
//                                 <div class="row">
//                                     <div class="col-4 row center card-item-content">
//                                         <div class="icon-card-item">
//                                             <i class="fa fa-usd" aria-hidden="true"></i>
//                                         </div>
//                                         <div class="row col">
//                                             <p data-translate="recruitments_text2">Mức lương</p>
//                                             <h3><%- recruitments[i].salary_range %></h3>
//                                         </div>
//                                     </div>
//                                     <div class="col-4 row center card-item-content">
//                                         <div class="icon-card-item">
//                                             <i class="fa fa-map-marker" aria-hidden="true"></i>
//                                         </div>
//                                         <div class="row col">
//                                             <p data-translate="recruitments_text3">Địa điểm</p>
//                                             <h3><%- recruitments[i].location %></h3>
//                                         </div>
//                                     </div>
//                                     <div class="col-4 row center card-item-content">
//                                         <div class="icon-card-item">
//                                             <i class="fa fa-hourglass" aria-hidden="true"></i>
//                                         </div>
//                                         <div class="row col">
//                                             <p data-translate="recruitments_text4">Kinh nghiệm</p>
//                                             <h3><%- recruitments[i].experience_required %> năm</h3>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div class="row" style="margin-top: 20px;">
//                                     <i class="fa-solid fa-briefcase" aria-hidden="true" style="margin-right: 12px;"></i>
//                                     <p><strong data-translate="recruitments_text5">Phòng ban:</strong> <%- recruitments[i].department %></p>
//                                 </div>
//                                 <div class="row" style="margin-top: 10px;">
//                                     <i class="fa-solid fa-user" aria-hidden="true" style="margin-right: 12px;"></i>
//                                     <p><strong data-translate="recruitments_text6">Số lượng tuyển:</strong> <%- recruitments[i].quantity %></p>
//                                 </div>
//                                 <div class="row" style="margin-top: 10px;">
//                                     <i class="fa fa-calendar" aria-hidden="true" style="margin-right: 12px;"></i>
//                                     <p><strong data-translate="recruitments_text7">Hạn nộp hồ sơ:</strong> <%- formatDate(recruitments[i].application_deadline) %></p>
//                                 </div>
//                                 <div class="row" style="margin-top: 20px; gap:20px;">
//                                     <button class="btn-apply" data-recruitmentid="<%- recruitments[i].recruitment_id %>" data-translate="recruitments_text8">Ứng tuyển ngay</button>
//                                     <button class="show-detail" data-translate="recruitments_text9">Xem chi tiết</button>
//                                 </div>
//                             </div>
//                         </div>
//                         <div class="card-item detail" style="margin-top: 20px; display: none;">
//                             <button class="btn-hide">Ẩn</button>
//                             <%- recruitments[i].detail %>    
//                         </div>
//                     </div>
//                 <% } %>
