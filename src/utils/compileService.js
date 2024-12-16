const compilex = require("compilex");
const { exec } = require("child_process");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

const compileCode = (lang, code, input, callback) => {
    const tempDir = path.join(__dirname, '../../temp');
    let isCallbackCalled = false; // Cờ để theo dõi trạng thái của callback

    try {
        // Tạo một thư mục tạm riêng cho request hiện tại
        const uniqueTempDir = path.join(tempDir, `temp_${Date.now()}`);
        fsExtra.ensureDirSync(uniqueTempDir); // Tạo thư mục nếu chưa tồn tại

        // Kiểm tra xem mã có yêu cầu input hay không
        const needsInput = requiresInput(code, lang);

        if (needsInput && (input === undefined || input.trim() === "")) {
            clearTempDir(uniqueTempDir); // Xóa thư mục tạm của request này
            return callback({ output: "Lỗi: Đoạn mã yêu cầu đầu vào nhưng không có đầu vào nào được cung cấp." });
        }

        // Xử lý biên dịch Pascal
        if (lang === "Pascal") {
            const pascalFilePath = path.join(uniqueTempDir, "temp.pas");
            fs.writeFileSync(pascalFilePath, code); // Ghi mã vào tệp

            exec(`fpc "${pascalFilePath}"`, (error, stdout, stderr) => {
                if (isCallbackCalled) return;
                isCallbackCalled = true;

                if (error) {
                    clearTempDir(uniqueTempDir);
                    return callback({
                        output: stderr || stdout || "Lỗi không xác định"
                    });
                }

                const startTimePascal = Date.now();
                const executablePath = path.join(uniqueTempDir, "temp"); // Đường dẫn tới tệp thực thi

                exec(`"${executablePath}"`, (execError, execStdout, execStderr) => {
                    const endTimePascal = Date.now();
                    const executionTime = endTimePascal - startTimePascal;

                    clearTempDir(uniqueTempDir);

                    if (execError) {
                        return callback({
                            output: execStderr || "Lỗi không xác định",
                            executionTime: executionTime
                        });
                    } else {
                        return callback({
                            output: execStdout,
                            executionTime: executionTime
                        });
                    }
                });
            });
            return;
        }

        // Xử lý các ngôn ngữ khác
        const compileFunction = getCompileFunction(lang, input);
        if (!compileFunction) {
            clearTempDir(uniqueTempDir);
            return callback({ output: "Ngôn ngữ không được hỗ trợ" });
        }

        const envData = { OS: "windows", cmd: lang === "Pascal" ? "fpc" : "g++", options: { timeout: 50000 } };

        const handleCallback = (data) => {
            if (isCallbackCalled) return;
            isCallbackCalled = true;

            clearTempDir(uniqueTempDir);
            callback({
                output: data.output ? data.output : cleanErrorOutput(data.error),
                executionTime: data.time
            });
        };

        if (input) {
            compileFunction(envData, code, input, handleCallback);
        } else {
            compileFunction(envData, code, handleCallback);
        }
    } catch (error) {
        console.error("Compile function error: " + error);
        if (!isCallbackCalled) {
            isCallbackCalled = true;
            callback({ output: "Đã xảy ra lỗi: " + error.message });
        }
    }
};

// Hàm lấy hàm biên dịch phù hợp
const getCompileFunction = (lang, input) => {
    switch (lang) {
        case "Cpp":
            return input ? compilex.compileCPPWithInput : compilex.compileCPP;
        case "Java":
            return input ? compilex.compileJavaWithInput : compilex.compileJava;
        case "Python":
            return input ? compilex.compilePythonWithInput : compilex.compilePython;
        default:
            return null;
    }
};

// Hàm xóa thư mục tạm của request
const clearTempDir = async (dir) => {
    try {
        await fsExtra.remove(dir);
    } catch (err) {
        console.error("Lỗi khi xóa thư mục:", dir, err);
    }
};

// Hàm lọc lỗi trong output
const cleanErrorOutput = (errorMessage) => {
    if (typeof errorMessage !== "string") return "";
    const errorLines = errorMessage.split(/\r?\n/);
    const cleanedLines = errorLines
        .map((line) => line.replace(/\.\/temp\S*/g, "").trim())
        .filter((line) => line !== "");
    return cleanedLines.join("\n");
};

// Hàm kiểm tra xem mã có yêu cầu input không
const requiresInput = (code, lang) => {
    const inputKeywords = {
        Cpp: ["cin", "getline", "scanf("],
        Java: ["Scanner", "BufferedReader", "System.in"],
        Python: ["input(", "sys.stdin"],
        PHP: ["fgets(", "readline("],
        Pascal: ["readln("],
    };
    return inputKeywords[lang]?.some((keyword) => code.includes(keyword)) || false;
};

module.exports = { compileCode };
