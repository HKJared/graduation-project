var user_info = {}

// ? Biến cho chức năng luyện tập
var topics = []

var code_exercise

// ? Biến cho compiler
var isRunning = false;
var editor // Khởi tạo CodeMirror cho phần editor
var inputEditor // Khởi tạo CodeMirror cho ô input (nếu cần)
var outputEditor // Khởi tạo CodeMirror cho ô output (chỉ để hiển thị output, không sửa được)