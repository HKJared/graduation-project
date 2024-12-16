// set view
$(document).ready(function() {
    // Thêm lớp active vào nav-item tương ứng
    $('.nav-item').removeClass('active');
    $('#compiler_nav').addClass('active');
    updateUnderline();

    setTitle('Compiler')

    // Khởi tạo CodeMirror cho phần editor
    editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
        mode: "text/x-c++src",
        theme: "default",
        tabSize: 4,
        indentWithTabs: true,
        lineWrapping: true,
        indentUnit: 4,
        autoCloseBrackets: true,
        extraKeys: {
            "Enter": function(cm) {
                // Lấy số lượng khoảng trắng cần thêm
                var tabSize = cm.getOption("tabSize");
                var indent = " ".repeat(tabSize); // Tạo chuỗi khoảng trắng
                cm.replaceSelection("\n" + indent, "end"); // Chèn newline và indent
                cm.execCommand("goLineEnd"); // Di chuyển con trỏ về cuối dòng
            }
        }
    });
    // Khởi tạo CodeMirror cho ô input (nếu cần)
    inputEditor = CodeMirror.fromTextArea(document.getElementById("input"), {
        mode: "text/plain",
        theme: "default",
        tabSize: 4,
        lineWrapping: true
    });
    // Khởi tạo CodeMirror cho ô output (chỉ để hiển thị output, không sửa được)
    outputEditor = CodeMirror.fromTextArea(document.getElementById("output"), {
        mode: "text/plain",
        theme: "default",
        tabSize: 4,
        lineWrapping: true,
        readOnly: true               // Chỉ đọc
    });

    editor.getWrapperElement().style.fontSize = ".875rem";
    inputEditor.getWrapperElement().style.fontSize = ".875rem";
    outputEditor.getWrapperElement().style.fontSize = ".875rem";

    editor.setValue('#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}');
});

// xử lí sự kiện
$(document).ready(function () {
    // Sự kiện thay đổi ngôn ngữ trong .language__select
    $('.language__select').on('change.woEvent', function() {
        const modes = {
            "Cpp": "text/x-c++src",
            "Java": "text/x-java",
            "Pascal": "text/x-pascal",
            "Python": "text/x-python"
        };

        const sampleCode = {
            "Cpp": '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
            "Java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
            "Pascal": `program HelloWorld;\nbegin\n    Writeln('Hello, World!');\nend.`,
            "Python": 'print("Hello, World!")'
        };

        var selectedLang = $(this).attr('data-val');
        var mode = modes[selectedLang] || "text/plain"; 

         // Cập nhật đuôi file trong span
        const fileExtension = {
            "Cpp": ".cpp",
            "Java": ".java",
            "Pascal": ".pas",
            "Python": ".py"
        };

        // Cập nhật giá trị của span chứa đuôi file
        $('.file_name span').text(fileExtension[selectedLang] || "");

        // Cập nhật chế độ mode cho CodeMirror
        editor.setOption("mode", mode);

        // Lấy giá trị hiện tại từ editor
        var currentCode = editor.getValue().trim();
        var sample = sampleCode[selectedLang] || "";

        // Kiểm tra nếu editor trống hoặc currentCode có nằm trong các đoạn code mẫu
        if (currentCode === "" || Object.values(sampleCode).includes(currentCode)) {
            // Nạp code mẫu tương ứng
            editor.setValue(sample);
        }
    });

    // Ví dụ sự kiện cho nút Run Code
    $('.run-code-btn').on('click.woEvent', function (event) {
        event.preventDefault();

        if ($(this).hasClass('not-allowed')) {
            return
        }

        runCode();
    });

    // Sự kiện Stop Code
    $('.stop-code-btn').on('click.woEvent', function () {
        
    });

    // Sự kiện khi checkbox "Tự động căn lề" thay đổi
    $('#auto-indent').on('change.owEvent', function() {
        const isChecked = $(this).is(':checked');
        editor.setOption("indentWithTabs", isChecked); // Sử dụng tab nếu checked
        editor.setOption("indentUnit", isChecked ? 4 : 0); // Đặt kích thước indent (4 hoặc 2 khoảng trắng)
    });

    // Sự kiện khi checkbox "Tự động đóng ngoặc" thay đổi
    $('#auto-close').on('change.owEvent', function() {
        editor.setOption("autoCloseBrackets", $(this).is(':checked'));
    });

    // Xử lý nút Tạo File Mới
    $('.new-file-btn').on('click.owEvent', function () {
        createNewFile();
    });

    // Xử lý nút Upload File
    $('.upload-file-btn').on('click.owEvent', function () {
        uploadFile();
    });

    // Xử lý nút Download File
    $('.download-file-btn').on('click.owEvent', function () {
        downloadFile();
    });

    // Xử lý nút Upload Input
    $('.upload-input-btn').on('click.owEvent', function () {
        uploadFileInput();
    });

    // Xử lý nút Clear Input
    $('.input__container .clear-btn').on('click.owEvent', function () {
        inputEditor.setValue('')
    });

    // Xử lý nút Clear Output
    $('.output__container .clear-btn').on('click.owEvent', function () {
        outputEditor.setValue('')
    });
});

// Hàm để chạy code
async function runCode() {
    const code = editor.getValue();
    const input = inputEditor.getValue();
    const lang = $('.language__select').attr('data-val');
    const currentOutput = outputEditor.getValue();

    // Thêm lớp CSS cho nút khi đang chạy
    const runBtn = $('.run-code-btn');
    runBtn.addClass('not-allowed');
    runBtn.html('<ion-icon class="running-icon" name="color-filter-outline"></ion-icon>');

    try {
        const response = await fetch('/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code, input, lang })
        });

        const data = await response.json(); console.log(data);
        outputEditor.setValue(currentOutput + (currentOutput == '' ? '' : '\n') + data.output);
    } catch (error) {
        outputEditor.setValue(currentOutput + (currentOutput == '' ? '' : '\n') + "Lỗi kết nối tới server.");
    } finally {
        // Khôi phục lại trạng thái ban đầu của nút sau khi hoàn thành
        runBtn.removeClass('not-allowed');
        runBtn.html('<ion-icon name="play"></ion-icon>');

        const codeMirror = outputEditor.getWrapperElement(); // Lấy phần tử wrapper của CodeMirror
        const codeMirrorScroll = codeMirror.getElementsByClassName('CodeMirror-scroll')[0];

        // Sử dụng animate của jQuery cho hiệu ứng cuộn mượt mà
        $(codeMirrorScroll).animate({
            scrollTop: codeMirrorScroll.scrollHeight
        }, 500);
    }
}

// Hàm tạo file mới
function createNewFile() {
    const sampleCode = {
        "Cpp": '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
        "Java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
        "Pascal": `program HelloWorld;\nbegin\n    Writeln('Hello, World!');\nend.`,
        "Python": 'print("Hello, World!")'
    };

    var currentCode = editor.getValue().trim();

    if (currentCode != "" && !Object.values(sampleCode).includes(currentCode)) {
        showConfirm('Xác nhận hủy bỏ nội dung file hiện tại.', 'Xác nhận', function(result) {
            if (result) {
                $('#file_name').val('NewFile');
                editor.setValue('');
            }
        })
    } else {
        $('#file_name').val('NewFile');
        editor.setValue('');
    }
}

// Hàm upload file
function uploadFile() {
    var input = $('<input type="file" accept=".txt,.js,.cpp,.pas,.java,.py">');

    input.change(function () {
        var file = this.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                editor.setValue(e.target.result); // Hiển thị nội dung file vào textarea editor
                console.log(`Đã chọn file: ${file.name}`);
            };
            reader.readAsText(file); // Đọc file dưới dạng văn bản
        }
    });

    input.trigger('click'); // Mở hộp thoại chọn file
}

// Hàm upload input
function uploadFileInput() {
    var input = $('<input type="file" accept=".txt">');

    input.change(function () {
        var file = this.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                inputEditor.setValue(e.target.result); // Hiển thị nội dung file vào textarea editor
                console.log(`Đã chọn file: ${file.name}`);
            };
            reader.readAsText(file); // Đọc file dưới dạng văn bản
        }
    });

    input.trigger('click'); // Mở hộp thoại chọn file
}

// Hàm download file
function downloadFile() {
    var fileContent = editor.getValue(); // Lấy nội dung từ textarea editor
    if (!fileContent) {
        showStackedNotification('Vui lòng nhập nội dung vào editor trước khi tải xuống.', 'no_file_name');
        return;
    }

    // Lấy tên file từ ô input
    var fileName = $('#file_name').val().trim(); // Truy cập giá trị từ input
    if (!fileName) {
        showStackedNotification('Vui lòng nhập tên file.', 'no_file_name');
        return; // Nếu không có tên file, hủy bỏ
    }

    showConfirm('Xác nhận tải file.', 'Xác nhận', function(result) {
        if (result) {
            // Thêm đuôi file dựa vào phần mở rộng
            var fileExtension = $('.file_name .absolute').text(); // Lấy đuôi file từ span
            fileName += fileExtension; // Kết hợp tên file và đuôi

            var blob = new Blob([fileContent], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            var a = $('<a></a>').attr('href', url).attr('download', fileName);

            // Tải xuống file
            $('body').append(a);
            a[0].click(); // Kích hoạt tải xuống
            a.remove(); // Xóa phần tử khỏi DOM
            URL.revokeObjectURL(url); // Giải phóng URL
        }
    });
}