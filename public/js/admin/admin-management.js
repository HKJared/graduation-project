//set view
$(document).ready(async function () {
  $(".menu .main").removeClass("active");
  $("#admin-management").addClass("active");

  activateMenuWhenReady("#admin-management");

  setView();

  //  Lấy page, keyword từ params
  const url = window.location.href;
  const urlParams = new URLSearchParams(new URL(url).search);
  page = 1;
  keyword = "";
  itemsPerPage = 15;

  $(document).on("adminsUpdated.woEvent", function (e, admins) {
    showAdmins(admins);
  });

  const response = await apiWithAccessToken('roles');
  if (response && response.roles) {
      roles = response.roles

      $(document).trigger('updatedRoles', [roles])
  }

  search();

  let debounceTimeout;
  $(document).on("input.woEvent", ".search__container input", function () {
    keyword = $(this).val();
    page = 1;

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(function () {
      search(keyword); // Gọi hàm search với keyword
    }, 500);
  });

  $(document).on("click.woEvent", ".add-admin-btn.action-btn", function () {
    showAddAndUpdateAdmin();
  });

  $(document).on("click.woEvent", ".add-update__container .x-btn", function () {
    $(".add-update__container").remove();
  });

  $(document).on("change.woEvent", "#avatar_url", function (event) {
    const fileInput = event.target;
    const previewImage = $(this)
      .closest(".relative")
      .find(".preview-image img");

    // Kiểm tra nếu có tệp được chọn
    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();

      // Khi đọc tệp hoàn tất
      reader.onload = function (e) {
        // Thay đổi URL của ảnh
        previewImage.attr("src", e.target.result);
      };

      // Đọc tệp dưới dạng Data URL
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      // Nếu không có tệp, trả về ảnh mặc định
      previewImage.attr("src", "/images/dark-user.png");
    }
  });

  $(document).on("click.woEvent", ".edit-admin-btn", async function () {
    const adminId = $(this).data("admin-id");

    // Gọi API để lấy thông tin chi tiết của admin
    const { admin } = await apiWithAccessToken(`admin?id=${adminId}`);

    // Hiển thị popup chỉnh sửa với dữ liệu admin
    showAddAndUpdateAdmin(admin);
  });

  $(document).on("submit.woEvent", ".add-update__form", async function (e) {
    e.preventDefault(); // Ngừng hành động submit mặc định

    // Lấy dữ liệu từ form
    const $form = $(this);
    const username = $("#username").val().trim();
    const password = $("#password").val().trim();
    const fullname = $("#fullname").val().trim();
    const email = $("#email").val().trim() || null;
    const phone_number = $("#phone_number").val().trim() || null;
    const role_id = Number($('#role_id').attr("data-val"))
    
    const adminId = $form.data("admin-id");

    let valid = true;

    // Xóa class danger-border trước đó
    $(".wo-input input").removeClass("danger-border");

    // Kiểm tra username
    if (username.length < 8) {
      valid = false;
      showStackedNotification("Tài khoản phải có ít nhất 8 ký tự.", "er1");
      $("#username").addClass("danger-border");
    }

    // Kiểm tra password nếu không có adminId (form thêm)
    if (
      !adminId &&
      (password.length < 8 ||
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password))
    ) {
      valid = false;
      showStackedNotification(
        "Mật khẩu phải có ít nhất 8 ký tự, chứa ít nhất một chữ cái thường, một chữ cái hoa và một số.",
        "er2"
      );
      $("#password").addClass("danger-border");
    }

    // Kiểm tra fullname
    if (!fullname) {
      valid = false;
      showStackedNotification("Họ và tên không được để trống.", "er3");
      $("#fullname").addClass("danger-border");
    }

    // Nếu có lỗi, hiển thị thông báo và dừng lại
    if (!valid) {
      return;
    }
    
    const data = {
      username,
      password,
      fullname,
      email,
      phone_number,
      role_id,
      avatar_url: null,
    };

    if (adminId) {
      data.id = adminId
    }
    // await submitFormData(data); // Ví dụ gửi dữ liệu
    showConfirm('Xác nhận lưu thông tin tài khoản quản trị viên', 'Xác nhận', async function(result) {
      if (result) {

        if ($('#avatar_url')[0].files.length > 0) {
          let formData = new FormData();
    
          formData.append('files', $('#avatar_url')[0].files[0]);
          formData.append('keys[]', `avatar_url`);
    
          const response = await upload(formData);
    
          data.avatar_url = response.avatar_url || null
        }

        if (adminId) {
          updateAdminAccount(data);
        } else {
          addAdminAccount(data)
        }
      }
    })
  });

  $(document).on("click.woEvent", ".delete-admin-btn", async function (e) {
    const id = $(this).attr("data-admin-id");

    showConfirm("Xác nhận xóa tài khoản quản trị viên", "Xác nhận", function(result) {
      if (result) {
        deleteAdminAccount(id)
      }
    })
  });
});

async function search() {
  const { admins, totalPages } = await apiWithAccessToken(
    `admins?keyword=${keyword}&page=${page}&itemsPerPage=15`
  );

  $(document).trigger("adminsUpdated", [admins]);
}

function setView() {
  const $container = $(".admin__container");

  $container.append(`
        <div class="action-header row flex-box item-center">
            <div class="search__container flex-1 relative">
                <div class="wo-input">
                    <input type="text" name="" id="" placeholder="Tìm kiếm quản trị viên">
                </div>
                <span class="absolute center"><ion-icon name="search-outline"></ion-icon></span>
            </div>
            <div class="row gap-16 item-center">
                <button class="add-admin-btn action-btn add-btn row gap-4 item-center"><ion-icon name="add-outline"></ion-icon> Thêm</button>
                <a href="/admin/permission-management" class="action-btn add-btn spa-action item-center row gap-4">Quản lý phân quyền</a>
            </div>
        </div>

        <div class="admin-table full-width">
            <table class="full-width col">
                <thead>
                    <tr class="row item-center">
                        <th>STT</th>
                        <th>Họ và tên</th>
                        <th>Tên tài khoản</th>
                        <th>Chức vụ</th>
                        <th>Ngày sinh</th>
                        <th>Email</th>
                        <th>Số điện thoại</th>
                        <th>Giới tính</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    
                    
                </tbody>
            </table>
        </div>    
    `);
}

function showAdmins(admins) {
  const $tableBody = $(".admin-table tbody");
  $tableBody.empty();

  if (!admins || !admins.length) {
    $tableBody.append(`
            <div>
                ${createAlertNotFoundComponent("Không có dữ liệu phù hợp")}
            </div>    
        `);

    return;
  }

  let bodyHTML = "";

  admins.forEach((admin, index) => {
    bodyHTML += `
            <tr class="row item-center">
                <td>${(page - 1) * itemsPerPage + index + 1}</td>
                <td>
                    <div class="row gap-16 item-center">
                        <img src="${
                          admin.avatar_url || "/images/dark-user.png"
                        } " alt="">
                        <span>${admin.fullname}</span>
                    </div>
                </td>
                <td>${admin.username}</td>
                <td>${admin.role_name}</td>
                <td>${admin.date_of_birth || ""}</td>
                <td>${admin.email || ""}</td>
                <td>${admin.phone_number || ""}</td>
                <td>${admin.gender || ""}</td>
                <td>
                    <div class="row full-width flex-end full-width gap-8">
                        
                        <button class="edit-admin-btn row gap-4 warning" data-admin-id="${
                          admin.id
                        }" title="Chỉnh sửa thông tin quản trị viên"><ion-icon name="create-outline"></ion-icon></button>
                        <button class="delete-admin-btn danger" data-admin-id="${admin.id}" title="Xóa tài khoản"> <ion-icon name="trash-outline"></ion-icon></button>
                    </div>
                </td>
            </tr>
        `;
  });

  $tableBody.append(bodyHTML);
}

function showAddAndUpdateAdmin(admin) {
  const $container = $(".admin__container");

  const role_options = [];

  roles.map(role => { 
    role_options.push({ value: role.id, text: role.name, is_selected: role.id == admin?.role_id ? 1 : 0})
  });

  if (!admin) {
    role_options[0].is_selected = 1
  }

  $container.append(`
          <div class="blur__container add-update__container center" style="display: flex">
          <div class="add-update__box panel" style="min-width: 520px">
              <div class="panel__header row flex-box item-center">
              <span>${
                admin ? "Chỉnh sửa" : "Thêm"
              } tài khoản Quản trị viên</span>
              <button class="x-btn" style="height: 24px; width: 24px; font-size: 24px">
                  <ion-icon name="close-outline"></ion-icon>
              </button>
              </div>
              <div class="panel__body">
              <form action="" class="add-update__form col gap-16" ${
                admin?.id ? "data-admin-id=" + admin?.id : ""}>
                  <div class="avatar-edit__container center">
                  <div
                      class="relative"
                      style="
                      height: 94px;
                      width: 94px;
                      border-radius: 47px;
                      border: 1px dashed #e5e5e5;
                      overflow: hidden;
                      "
                  >
                      <div class="preview-image full-height full-width">
                          <img src="${
                            admin?.avatar_url
                          }" alt="" onerror="this.src='/images/dark-user.png'">
                      </div>
                      <label
                      for="avatar_url"
                      class="absolute full-width full-height center"
                      >
                      <span class="warning"><ion-icon name="create-outline"></ion-icon></span>
                      </label>
                      <input type="file" id="avatar_url" accept="image/*"/>
                  </div>
                  </div>
                  <div class="row gap-16">
                    <div class="col gap-2 edit-row flex-1">
                    <div class="edit-label">
                        <label for="" class="row gap-4">Tài khoản <span>*</span></label>
                    </div>
                    <div class="wo-input">
                        <input type="text" id="username" value="${
                          admin?.username || ""
                        }"/>
                    </div>
                    </div>
                    <div class="col gap-2 edit-row flex-1">
                    <div class="edit-label">
                        <label for="" class="row gap-4">Mật khẩu <span>*</span></label>
                    </div>
                    <div class="wo-input">
                        <input type="${admin ? "password" : "text"}" id="password" value="${admin ? "******" : ""}" ${admin ? "disabled" : ""}/>
                    </div>
                    </div>
                  </div>
                  <div class="col gap-2 edit-row">
                  <div class="edit-label">
                      <label for="" class="row gap-4">Họ và tên <span>*</span></label>
                  </div>
                  <div class="wo-input">
                      <input type="text" id="fullname"  value="${
                        admin?.fullname || ""
                      }"/>
                  </div>
                  </div>
                  <div class="col gap-2 edit-row">
                  <div class="edit-label">
                      <label for="" class="row gap-4">Chức vụ <span>*</span></label>
                  </div>
                    ${ createSelectComponent(role_options, 'role_id') }
                  </div>
                  <div class="row gap-16">
                      <div class="col gap-2 edit-row flex-1">
                      <div class="edit-label">
                          <label for="" class="row gap-4">Email</label>
                      </div>
                      <div class="wo-input">
                          <input type="text" id="email"  value="${
                            admin?.email || ""
                          }"/>
                      </div>
                    </div>
                    <div class="col gap-2 edit-row flex-1">
                      <div class="edit-label">
                          <label for="" class="row gap-4">Số điện thoại</label>
                      </div>
                      <div class="wo-input">
                          <input type="text" id="phone_number"  value="${
                            admin?.phone_number || ""
                          }"/>
                      </div>
                    </div>
                  </div>
                  <button style="height: 32px; margin-top: 16px" class="action-btn add-btn" type="submit" >Lưu</button>
              </form>
              </div>
          </div>
          </div>
          `);
}

async function addAdminAccount(admin) {
  const response = await apiWithAccessToken('admin', 'POST', { account: admin })

  if (response && response.message) {
    showNotification(response.message);
    search(keyword);
    $(".add-update__container").remove();
  }
}

async function updateAdminAccount(admin) {
  const response = await apiWithAccessToken('admin', 'PUT', { account: admin })

  if (response && response.message) {
    showNotification(response.message);
    search(keyword);
    $(".add-update__container").remove();
  }
}

async function deleteAdminAccount(id) {
  const response = await apiWithAccessToken('admin', 'DELETE', { id: id })

  if (response && response.message) {
    showNotification(response.message);
    search(keyword);
  }
}
