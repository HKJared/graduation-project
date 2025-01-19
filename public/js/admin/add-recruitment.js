$(document).ready(function () {
  $(".menu .main").removeClass("active");
  $("#recruitment-management").addClass("active");

  activateMenuWhenReady("#recruitment-management");

  
  createEditor('Chi tiết bài tuyển dụng');

  $(".create-recruitment").on("submit", function (event) {
    event.preventDefault(); // Ngăn chặn hành động submit mặc định

    const recruitment = {
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
      if (key !== "detail" && !recruitment[key]) {
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
      "Xác nhận tạo bài tuyển dụng mới.",
      "Xác nhận",
      function (result) {
        if (result) {
          createRecruitment(recruitment);
        }
      }
    );
  });
});

async function createRecruitment(recruitment) {
  const { message } = await apiWithAccessToken("recruitment", "POST", {
    recruitment: recruitment,
  });

  if (!message) return

  showNotification(message)

  setTimeout(updateViewBasedOnPath('/admin/recruitment-management'), 1000)
}
