$(document).ready(async function () {
  // Thêm lớp active vào nav-item tương ứng
  $(".nav-item").removeClass("active");
  $("#practice_nav").addClass("active");
  updateUnderline();

  setTitle("Chủ đề luyện tập");

  if (!topics.length) {
    const response = await userApi("topics");

    if (response && response.topics) {
      topics = response.topics;
    }
  }

  const url = window.location.href;
  const urlParams = new URLSearchParams(new URL(url).search);
  const exerciseId = urlParams.get("id");

  const response = await userApi(`exercise-result?exercise_id=${exerciseId}`);
  const { exercise_result } = response || {};

  showResult(exercise_result);

  $(document).on("click.woEvent", ".preview-question-item", function () {
    // Lấy id của câu hỏi
    const order = $(this).attr("id").split("_")[2];
    // console.log(order)
    // Cuộn đến phần tử #question_{order}
    const target = $(`#question_${order}`);
    if (target.length) {
      $("html, body").animate(
        {
          scrollTop: target.offset().top - 70,
        },
        800
      ); // Thời gian cuộn là 500ms
    }
  });
});

function showResult(result) {
  const $container = $(".user__container");
  $container.empty();

  if (!result) {
    $container.append(
      createAlertNotFoundComponent("Không tìm thấy thông tin bài làm của bạn.")
    );
  }

  exercise = result.exercise_data;

  $container.attr("data-exercise-id", exercise.id);
  $container.attr("data-topic-id", exercise.topic_id);

  if (exercise.type == "multiple_choice") {
    $container.attr("data-type", "multiple_choice");
    $container.append(
      createDisplayMultipleChoiceExercise(result, result.exercise_data)
    );
  } else {
    $container.attr("data-type", "code");
    $container.append(createDisplayCodeExercise(result.exercise_data));

    setupCompiler(result);
  }
}

function createDisplayMultipleChoiceExercise(result, exercise) {
  function createSubmissionCountTag() {
    return `
            <span class="row gap-4 item-center ${
              result.submission_count <= 3 ? "success" : ""
            }">${result.submission_count} lần nộp</span>
        `;
  }

  function createCompletedTag() {
    return result.is_completed
      ? `<span class="row gap-4 item-center success" title="Đã hoàn thành vào ngày ${formatDatetime(
          result.completed_at
        )}">Đã hoàn thành</span>`
      : `<span class="row gap-4 item-center warning">Chưa hoàn thành</span>`;
  }

  function createScoreTag() {
    return `<span class="row gap-4 item-center ${
      result.score >= 80 ? "success" : "warning"
    }" title="Điểm của bài làm"><ion-icon name="ribbon-outline"></ion-icon> ${
      result.score
    }</span>`;
  }

  return `
        <div class="col gap-24 full-width">
            <div class="questions_container col panel">
                <div class="panel_header row item-center gap-8">
                    <span class="center" style="padding-right: 8px; border-right: 1px solid var(--color-white-60);"><ion-icon name="clipboard-outline"></ion-icon></span>
                    <span>${exercise.title}</span>
                </div>
                <div class="panel_body col flex-1 gap-16">
                    <div class="info-overview row gap-16">
                        <span class="${exercise.level}">${exercise.level}</span>
                        <span class="row gap-4 item-center warning"><ion-icon name="medal-outline"></ion-icon> ${
                          exercise.bonus_scores
                        }</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Mô tả</h3>
                        <span>${exercise.description}</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Thông tin bài làm</h3>
                        <span>Nộp lần đầu: ${formatDatetime(
                          result.started_at
                        )}</span>
                        <div class="info-overview row gap-16">
                            ${createSubmissionCountTag()}
                            ${createCompletedTag()}
                            ${createScoreTag()}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row gap-24 full-width">
                <div class="overview__container col">
                    <div class="preview-questions_container col gap-8 panel full-width sticky-top">
                        ${createListPreviewQuestionResultComponent(
                          result.multiple_choice_data
                        )}
                    </div>
                </div>
                <div class="questions_container flex-1 col panel">
                    ${createListExerciseQuestionResultComponent(
                      result.multiple_choice_data
                    )}
                    <div class="action_container center">
                        <a href="/system-exercise?title=${exercise.title}&id=${
    exercise.id
  }" class="${
    result.is_completed ? "success-bg" : "warning-bg"
  } spa-action center" title="Làm lại">Làm lại</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createDisplayCodeExercise(exercise) {
  code_exercise = exercise.code_exercise;
  return `
       <div class="row gap-16 w-full-screen container">
            <div class="content__container col panel">
                <div class="panel_header row item-center gap-8">
                    <span class="center" style="padding-right: 8px; border-right: 1px solid var(--color-white-60);"><ion-icon name="clipboard-outline"></ion-icon></span>
                    <span>${exercise.title}</span>
                </div>
                <div class="panel_body col flex-1 gap-16">
                    <div class="info-overview row gap-16">
                        <span class="${exercise.level}">${exercise.level}</span>
                        <span class="row gap-4 item-center warning"><ion-icon name="medal-outline"></ion-icon> ${
                          exercise.bonus_scores
                        }</span>
                        <span class="row gap-4 item-center"><ion-icon name="code-working-outline"></ion-icon> ${
                          exercise.code_exercise.language
                        }</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Mô tả</h3>
                        <span>${exercise.description}</span>
                    </div>
                    <div class="col gap-8">
                        <h3>Đề bài</h3>
                        <div>${exercise.code_exercise.content}</div>
                    </div>
                </div>
            </div>
            <div class="compiler__container flex-1 col gap-16">
                <div class="editor__container flex-1 col panel">
                    <div class="panel_header col gap-8">
                        <div class="row item-center flex-box">
                            <span class="success row item-center gap-4"><ion-icon name="code-slash-outline"></ion-icon> Compiler</span>
                            <div class="row gap-8">
                                <button class="reset-btn center" data-starter-code="${
                                  exercise.code_exercise.starter_code || ""
                                }" title="Làm mới"><ion-icon name="reload-outline"></ion-icon></button>
                                <button class="submit-btn success-bg">Chấm điểm</button>
                            </div>
                        </div>
                        <div class="editor__header-main row">
                            <div class="language center" data-language="">
                                <span>${exercise.code_exercise.language}</span>
                            </div>
                        </div>
                    </div>
                    <div class="panel_body full-width flex-1 col scale-up-ver-top" style="--scale: 0.6;">
                        <textarea name="" id="editor"></textarea>
                    </div>
                </div>
            </div>
        </div> 
    `;
}

function setupCompiler() {
  // Khởi tạo CodeMirror cho phần editor
  exerciseEditor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    mode: "text/x-c++src",
    theme: "default",
    tabSize: 4,
    indentWithTabs: true,
    lineWrapping: true,
    indentUnit: 4,
    autoCloseBrackets: true,
    extraKeys: {
      Enter: function (cm) {
        // Lấy số lượng khoảng trắng cần thêm
        var tabSize = cm.getOption("tabSize");
        var indent = " ".repeat(tabSize); // Tạo chuỗi khoảng trắng
        cm.replaceSelection("\n" + indent, "end"); // Chèn newline và indent
        cm.execCommand("goLineEnd"); // Di chuyển con trỏ về cuối dòng
      },
    },
  });

  exerciseEditor.getWrapperElement().style.fontSize = ".875rem";

  $(".content__container").resizable({
    handles: "e",
    minWidth: 360,
    maxWidth: 1180,
  });
}
