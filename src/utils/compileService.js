const compilex = require("compilex");
const { exec } = require("child_process");
const fs = require("fs");
const fsExtra = require('fs-extra');
const path = require("path");

// Đường dẫn tới thư mục temp
const tempDir = path.join(__dirname, '../../temp');

const compileCode = (lang, code, input, callback) => {
    const envData = {
        OS: "windows",
        cmd: lang === "Pascal" ? "fpc" : "g++",
        options: { timeout: 10000 } // Timeout 10 giây
    };
    let compileFunction;
    let isCallbackCalled = false; // Cờ để theo dõi trạng thái của callback
    const tempDir = "temp"; // Thư mục tạm

    try {
        // Kiểm tra xem mã có yêu cầu input hay không
        const needsInput = requiresInput(code, lang);

        // Kiểm tra input nếu ngôn ngữ yêu cầu input
        if (needsInput && (input === undefined || input.trim() === "")) {
            return callback({ output: "Lỗi: Đoạn mã yêu cầu đầu vào nhưng không có đầu vào nào được cung cấp." });
        }

        // Chọn hàm biên dịch phù hợp dựa trên ngôn ngữ
        switch (lang) {
            case "Cpp":
                compileFunction = input ? compilex.compileCPPWithInput : compilex.compileCPP;
                break;
            case "Java":
                compileFunction = input ? compilex.compileJavaWithInput : compilex.compileJava;
                break;
            case "Python":
                compileFunction = input ? compilex.compilePythonWithInput : compilex.compilePython;
                break;
            case "Pascal":
                const pascalFilePath = path.join(tempDir, "temp.pas");
                fs.writeFileSync(pascalFilePath, code); // Ghi mã vào tệp

                exec(`fpc "${pascalFilePath}"`, (error, stdout, stderr) => {
                    if (isCallbackCalled) return;
                    isCallbackCalled = true;

                    if (error) {
                        clearTempDir(tempDir);
                        return callback({ 
                            output: stdout || "Lỗi không xác định"
                        });
                    }

                    const startTimePascal = Date.now();

                    const executablePath = path.join(tempDir, "temp"); // Đường dẫn tới tệp thực thi
                    exec(`"${executablePath}"`, (execError, execStdout, execStderr) => {
                        const endTimePascal = Date.now();
                        const executionTime = endTime - startTime;

                        clearTempDir(tempDir);

                        if (execError) { 
                            console.error("Lỗi khi thực thi Pascal:", execError); // Ghi chi tiết lỗi vào console
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
                return; // Dừng thực thi hàm tại đây
            default:
                return callback({ output: "Ngôn ngữ không được hỗ trợ" });
        }

        const handleCallback = (data) => {
            console.log(data)
            if (isCallbackCalled) return;

            isCallbackCalled = true;
            clearTempDir(tempDir);
            return callback({ 
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
        console.error('Compile function error: ' + error); // Ghi lỗi vào console
        if (!isCallbackCalled) { 
            isCallbackCalled = true;
            callback({ output: "Đã xảy ra lỗi: " + error.message });
            clearTempDir(tempDir);
        }
    }
};


// Hàm xóa tất cả file và thư mục con trong thư mục temp
const clearTempDir = async (dir) => {
    try {
        const files = await fsExtra.readdir(dir);
        if (files.length === 0) {
            // console.log("Thư mục trống:", dir);
            return;
        }

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = await fsExtra.stat(filePath);

            if (stats.isDirectory()) {
                await clearTempDir(filePath);
                await fsExtra.rmdir(filePath);
                // console.log("Đã xóa thư mục:", filePath);
            } else {
                await fsExtra.unlink(filePath);
                // console.log("Đã xóa file:", filePath);
            }
        }
    } catch (err) {
        console.error("Lỗi khi xóa thư mục:", dir, err);
    }
};

const cleanErrorOutput = (errorMessage) => {
    if (typeof errorMessage !== 'string') {
        return ''
    }

    const errorLines = errorMessage.split(/\r?\n/);
    const cleanedLines = errorLines.map(line => {
        const words = line.split(' ');
        const cleanedWords = words.filter(word => !word.startsWith('./temp'));
        return cleanedWords.join(' ');
    }).filter(line => line.trim() !== '');

    return cleanedLines.join('\n').trim();
};

const requiresInput = (code, lang) => {
    // Từ khóa liên quan đến input cho từng ngôn ngữ
    const inputKeywords = {
        Cpp: ["cin", "getline", "scanf("], // C++
        Java: ["Scanner", "BufferedReader", "System.in"], // Java
        Python: ["input(", "sys.stdin"], // Python
        PHP: ["fgets(", "readline("], // PHP
        Pascal: ["readln("], // Pascal
    };

    // Kiểm tra xem mã có chứa các từ khóa này không
    return inputKeywords[lang].some(keyword => code.includes(keyword));
};

module.exports = { compileCode };