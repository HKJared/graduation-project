$(document).ready(async function () {
  $(".menu .main").removeClass("active");
  $("#recruitment-management").addClass("active");

  activateMenuWhenReady("#recruitment-management");

  const url = window.location.href;
  const urlParams = new URLSearchParams(new URL(url).search);
  const recruitment_id = urlParams.get("id");

  const response = await apiWithAccessToken(`recruitment?id=${recruitment_id}`);
  const data = response?.data || null;
  showEditRecruitment(data);

  $(document).on("submit.woEvent", ".create-recruitment", function (event) {
    event.preventDefault(); // Ngăn chặn hành động submit mặc định

    const recruitment_id = $(this).attr("data-recruitment-id");

    const recruitment = {
        id: recruitment_id,
      position: $("#position").val(),
      department: $("#department").val(),
      location: $("#location").val(),
      quantity: $("#quantity").val(),
      salary_range: $("#salary_range").val(),
      experience_required: $("#experience_required").val(),
      application_deadline: $("#application_deadline").val(),
      detail: editor.getData(),
    };

    let hasError = false; // Biến kiểm tra lỗi

    // Kiểm tra các trường và thêm class .danger-border nếu trống
    for (let key in recruitment) {
      if (key !== "detail" && key !== "id" && !recruitment[key]) {
        $(`#${key}`).addClass("danger-border");
        hasError = true;
      }
    }

    // Nếu có lỗi, hiển thị thông báo và ngăn submit
    if (hasError) {
      showNotification("Vui lòng điền đầy đủ thông tin.");
      return; // Ngăn không cho form submit nếu có lỗi
    }

    showConfirm(
      "Xác nhận cập nhật thông tin bài tuyển dụng.",
      "Xác nhận",
      function (result) {
        if (result) {
          editRecruitment(recruitment);
        }
      }
    );
  });
});

async function editRecruitment(newDataRecruitment) {
  const { message } = await apiWithAccessToken("recruitment", "PUT", {
    newDataRecruitment: newDataRecruitment,
  });

  if (!message) return;

  showNotification(message);

  setTimeout(updateViewBasedOnPath("/admin/recruitment-management"), 1000);
}

function showEditRecruitment(recruitment) { console.log(recruitment)
  const $container = $(".admin__container");

  if (!recruitment) {
    $container.append(
      createAlertNotFoundComponent(
        "Không tìm thấy bài tuyển dụng cần chỉnh sửa"
      )
    );

    return;
  }

  function convertToVietnamDate(isoDate) {
    // Tạo đối tượng Date từ chuỗi ISO
    var date = new Date(isoDate);

    // Bù múi giờ Việt Nam (GMT+7)
    var vietnamTimeOffset = 7 * 60 * 60 * 1000; // 7 giờ tính bằng mili giây
    var vietnamDate = new Date(date.getTime() + vietnamTimeOffset);

    // Lấy định dạng YYYY-MM-DD
    return vietnamDate.toISOString().split('T')[0];
}

  $container.append(`
        <div class="panel col">
        <div class="panel__header">
            <span>Chỉnh sửa bài tuyển dụng</span>
        </div>
        <div class="panel__body">
            <form class="create-recruitment col" data-recruitment-id="${recruitment.id}">
                <label for="position">Vị trí tuyển dụng<span>*</span></label>
                <input type="text" id="position" value="${recruitment.position}">
                <div class="row gap-16">
                    <div class="left-row col flex-1">
                        <label for="department">Phòng ban</label>
                        <input type="text" id="department" value="${recruitment.department}">
                    </div>
                    <div class="right-row col flex-1">
                        <label for="location">Địa điểm làm việc<span>*</span></label>
                        <input type="text" id="location" value="${recruitment.location}">
                    </div>
                </div>
                <div class="row gap-16">
                    <div class="left-row col flex-1">
                        <label for="quantity">Số lượng tuyển<span>*</span></label>
                        <input type="number" id="quantity" min="1" max="" value="${recruitment.quantity}">
                    </div>
                    <div class="right-row col flex-1">
                        <label for="salary_range">Khoảng lương<span>*</span></label>
                        <input type="text" name="" id="salary_range" placeholder="xx - xx triệu" value="${recruitment.salary_range}">
                    </div>
                </div>
                <div class="row gap-16">
                    <div class="left-row col flex-1">
                        <label for="experience_required">Yêu cầu kinh nghiệm (năm)<span>*</span></label>
                        <input type="number" id="experience_required" min="0" value="${recruitment.experience_required}">
                    </div>
                    <div class="right-row col flex-1">
                        <label for="application_deadline">Hạn nộp hồ sơ<span>*</span></label>
                        <input type="date" name="" id="application_deadline" value="${convertToVietnamDate(recruitment.application_deadline)}">
                    </div>
                </div>
                <label for="detail">Chi tiết</label>
                <div class="editor-container">
                    <textarea name="" id="editor"></textarea>
                </div>
                <button type="submit" class="submit-recruitment">Lưu bài tuyển dụng</button>
            </form>
        </div>
    </div>
        `);

  createEditor("Chi tiết bài tuyển dụng", recruitment.detail);
}
