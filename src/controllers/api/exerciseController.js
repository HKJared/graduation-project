const LogModel = require("../../models/logModel");
const ExerciseModel = require("../../models/exerciseModel");
const {
  validateExerciseData,
} = require("../../validators/topicExerciseValidator");
const { deleteFileFromCloudinary } = require("../../utils/upload");
const TopicModel = require("../../models/topicModel");
const { compileCode } = require("../../utils/compileService");

function deleteImageUrLOfMultipleChoiceExercise(multiple_choice_exercises) {
  if (!multiple_choice_exercises || !multiple_choice_exercises.length) return;

  multiple_choice_exercises.forEach((multiple_choice_exercise) => {
    deleteFileFromCloudinary(multiple_choice_exercise.question);

    multiple_choice_exercise.options.forEach((option) => {
      deleteFileFromCloudinary(option.image_url);
    });
  });
}

class ExerciseController {
  // Tạo bài tập mới
  static async createExercise(req, res) {
    try {
      const user_id = req.user_id;
      const log_id = req.log_id;

      const exercise = req.body.exercise;
      const multiple_choice_exercises = req.body.multiple_choice_exercises;
      const code_exercise = req.body.code_exercise;

      const is_valid_exercise = validateExerciseData(exercise);

      if (!is_valid_exercise.isValid) {
        deleteImageUrLOfMultipleChoiceExercise(multiple_choice_exercises);

        await LogModel.updateDetailLog(is_valid_exercise.errors, log_id);

        return res.status(400).json({ message: is_valid_exercise.errors });
      }

      const topic = await TopicModel.getTopicById(exercise.topic_id);

      if (!topic.is_editable) {
        deleteImageUrLOfMultipleChoiceExercise(multiple_choice_exercises);

        await LogModel.updateDetailLog("Chủ đề đã khóa chỉnh sửa.", log_id);

        return res.status(400).json({
          message: "Chủ đề hiện không thể chỉnh sửa và tạo bài tập mới.",
        });
      }

      const exercise_id = await ExerciseModel.createExercise({
        topic_id: exercise.topic_id,
        title: exercise.title,
        description: exercise.description,
        type: exercise.type,
        level: exercise.level,
        bonus_scores: exercise.bonus_scores,
        created_by: user_id,
      });

      if (!exercise_id) {
        deleteImageUrLOfMultipleChoiceExercise(multiple_choice_exercises);

        await LogModel.updateDetailLog(
          "Thêm bài tập mới vào db không thành công.",
          log_id
        );

        return res.status(400).json({
          message:
            "Thêm bài tập mới không thành công, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      if (exercise.type == "multiple_choice") {
        await ExerciseModel.createMultipleChoiceExercises(
          exercise_id,
          multiple_choice_exercises
        );
      } else {
        await ExerciseModel.createCodeExercise(exercise_id, code_exercise);
      }

      await LogModel.updateStatusLog(log_id);
      await LogModel.updateDetailLog(
        `Tạo bài tập thành công với ID: ${exercise_id}`,
        log_id
      );
      return res
        .status(201)
        .json({ message: "Tạo bài tập thành công.", exercise_id: exercise_id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Lấy thông tin bài tập theo ID
  static async getExercise(req, res) {
    try {
      const exerciseId = req.query.id; // Lấy ID từ URL

      const exercise = await ExerciseModel.getExerciseById(exerciseId);

      if (!exercise) {
        return res.status(404).json({ message: "Bài tập không tồn tại." });
      }

      if (exercise.type === "multiple_choice") {
        exercise.multiple_choice_exercise =
          await ExerciseModel.getMultipleChoiceExercisesByExerciseId(
            exerciseId
          );
      } else {
        exercise.code_exercise = await ExerciseModel.getCodeExercise(
          exerciseId
        );
      }

      return res.status(200).json({ exercise });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Lấy thông tin bài tập theo ID bởi người dùng
  static async getExerciseByUser(req, res) {
    try {
      const user_id = req.user_id;
      const log_id = await LogModel.createLog("do-system-exercise", user_id);

      const exercise_id = req.query.exercise_id;

      if (!exercise_id) {
        await LogModel.updateDetailLog(
          "Không có ID của bài tập được cung cấp.",
          log_id
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      await LogModel.updateDetailLog(
        `Làm bài tập có ID: ${exercise_id}.`,
        log_id
      );

      const exercise = await ExerciseModel.getExerciseById(exercise_id);

      if (!exercise) {
        await LogModel.updateDetailLog(
          "Không tìm thấy bài tập trong DB.",
          log_id
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      if (exercise.is_editable) {
        await LogModel.updateDetailLog(
          "Chủ đề của bài tập này đang trong giai đoạn chỉnh sửa."
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      if (exercise.type == "multiple_choice") {
        const questions =
          await ExerciseModel.getMultipleChoiceExercisesByExerciseId(
            exercise_id
          );

        function getRandomQuestions(questions) {
          // Lọc các phần tử is_required và not_required
          const isRequired = questions.filter((q) => q.is_required === 1);
          const notRequired = questions.filter((q) => q.is_required !== 1);

          // Số lượng câu hỏi cần lấy thêm
          const remainingCount = 20 - isRequired.length;

          // Lấy thêm phần tử từ notRequired (nếu cần)
          const additionalQuestions = getRandomElements(
            notRequired,
            remainingCount
          );

          // Kết hợp và trả về
          //   return [...isRequired, ...additionalQuestions];
          const combinedQuestions = [...isRequired, ...additionalQuestions];

          // Trộn ngẫu nhiên mảng combinedQuestions
          for (let i = combinedQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combinedQuestions[i], combinedQuestions[j]] = [
              combinedQuestions[j],
              combinedQuestions[i],
            ]; // Hoán đổi
          }

          return combinedQuestions;
        }

        // Hàm lấy n phần tử ngẫu nhiên từ một mảng
        function getRandomElements(arr, n) {
          const result = [];
          const copy = [...arr]; // Tạo bản sao để tránh thay đổi mảng gốc
          for (let i = 0; i < n && copy.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * copy.length);
            result.push(copy.splice(randomIndex, 1)[0]);
          }
          return result;
        }

        exercise.questions = getRandomQuestions(questions);
      } else {
        exercise.code_exercise = await ExerciseModel.getCodeExercise(
          exercise_id
        );
      }

      await LogModel.updateStatusLog(log_id);

      return res.status(200).json({ exercise: exercise });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Cập nhật thông tin bài tập
  static async updateExercise(req, res) {
    try {
      const { id, title, description, level, bonus_scores } = req.body.exercise; // Dữ liệu cập nhật từ request body

      const log_id = req.log_id;
      const user_id = req.user_id;

      const isUpdated = await ExerciseModel.updateExercise(id, {
        title,
        description,
        level,
        bonus_scores,
        updated_by: user_id,
      });
      if (!isUpdated) {
        await LogModel.updateDetailLog(
          `Cập nhật bài tập không thành công với ID: ${exerciseId}`,
          log_id
        );
        return res
          .status(400)
          .json({ message: "Cập nhật bài tập không thành công." });
      }

      await LogModel.updateStatusLog(log_id);
      await LogModel.updateDetailLog(
        `Cập nhật bài tập thành công với ID: ${id}`,
        log_id
      );
      return res.status(200).json({ message: "Cập nhật bài tập thành công." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Cập nhật thông tin bài tập
  static async updateCodeExercise(req, res) {
    try {
      const { exercise_id, content, language, starter_code, test_cases } =
        req.body.code_exercise; // Dữ liệu cập nhật từ request body

      const log_id = req.log_id;
      const user_id = req.user_id;

      const isUpdated = await ExerciseModel.updateCodeExercise(exercise_id, {
        content,
        language,
        starter_code,
        test_cases,
      });

      if (!isUpdated) {
        await LogModel.updateDetailLog(
          `Cập nhật bài tập không thành công với ID: ${exercise_id}`,
          log_id
        );
        return res
          .status(400)
          .json({ message: "Cập nhật bài tập không thành công." });
      }

      await ExerciseModel.updateExercise(exercise_id, {
        updated_by: user_id,
      });

      await LogModel.updateStatusLog(log_id);
      await LogModel.updateDetailLog(
        `Cập nhật bài tập thành công với ID: ${exercise_id}`,
        log_id
      );
      return res.status(200).json({ message: "Cập nhật bài tập thành công." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Xóa bài tập theo ID
  static async deleteExercise(req, res) {
    try {
      const exercise_id = req.body.exercise_id; // Lấy ID từ URL

      const user_id = req.user_id;
      const log_id = req.log_id;

      const isDeleted = await ExerciseModel.deleteExercise(exercise_id);
      if (!isDeleted) {
        await LogModel.updateDetailLog(
          `Không thành công: Bài tập không tồn tại với ID: ${exerciseId}`,
          log_id
        );
        return res
          .status(404)
          .json({ message: "Không tìm thấy bài tập muốn xóa." });
      }

      await LogModel.updateStatusLog(log_id);
      await LogModel.updateDetailLog(
        `Xóa bài tập thành công với ID: ${exercise_id}`,
        log_id
      );
      return res.status(200).json({ message: "Đã xóa bài tập." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Lấy tất cả bài tập (nếu cần)
  static async getAllExercises(req, res) {
    try {
      const exercises = await ExerciseModel.getAllExercises();
      return res.status(200).json({ exercises });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Lấy tất cả bài tập của một chủ đề bởi admin
  static async getTopicExercisesByAdmin(req, res) {
    try {
      const log_id = req.log_id;

      const topic_id = req.query.topic_id;

      if (!topic_id) {
        await LogModel.updateDetailLog(
          "Không có id chủ đề được cung cấp.",
          log_id
        );

        return res
          .status(400)
          .json({ message: "Không có ID chủ đề được cung cấp." });
      }

      await LogModel.updateDetailLog(
        "Lấy danh sách bài tập của chủ đề có Id: " + topic_id,
        log_id
      );

      const exercises = await ExerciseModel.getExercisesByTopicId(topic_id);

      await LogModel.updateStatusLog(log_id);

      return res.status(200).json({ exercises: exercises });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Chấm điểm bài tập trắc nghiệm
  static async submitMultipleChoiceExercise(req, res) {
    try {
      const user_id = req.user_id;
      const log_id = await LogModel.createLog("exercise-submit", user_id);

      const { exercise_id, multiple_choice_answers } = req.body;

      if (!exercise_id || !multiple_choice_answers) {
        await LogModel.updateDetailLog(
          "Dữ liệu không được cung cấp (Id bài tập và bài làm).",
          log_id
        );

        return res.status(404).json({
          message: "Lỗi đường truyền, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      const exercise = await ExerciseModel.getExerciseById(exercise_id);

      if (!exercise) {
        await LogModel.updateDetailLog(
          "Không tìm thấy bài tập trong DB.",
          log_id
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      if (exercise.is_editable) {
        await LogModel.updateDetailLog(
          "Chủ đề của bài tập này đang trong giai đoạn chỉnh sửa."
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      const questions =
        await ExerciseModel.getMultipleChoiceExercisesByExerciseId(exercise_id);

      // Chấm điểm
      let totalCorrect = 0;
      let questionResults = [];

      for (const answer of multiple_choice_answers) {
        const question = questions.find((q) => q.id === answer.question_id);

        if (!question) {
          questionResults.push({
            question_id: answer.question_id,
            selected_options: [],
            is_correct: false,
          });
          continue;
        }

        const correctOptions = question.options.filter(
          (option) => option.is_correct
        );
        const userOptions = answer.selected_options;

        const isCorrect =
          userOptions.length == correctOptions.length &&
          userOptions.every((uo) =>
            correctOptions.some((co) => co.text == uo.text)
          );

        questionResults.push({
          question_id: answer.question_id,
          selected_options: userOptions,
          is_correct: isCorrect,
        });

        if (isCorrect) {
          totalCorrect++;
        }
      }

      const score = totalCorrect * 5;
      const is_completed = score >= 80 ? 1 : 0; // Một bài làm >80 điểm được coi là hoàn thành
      let last_score = null;

      let result_id;

      const last_submit = await ExerciseModel.getUserExerciseResultByExerciseId(
        user_id,
        exercise_id
      );
      if (last_submit && last_submit.id) {
        // Nếu đã từng làm
        result_id = last_submit.id;
        await LogModel.updateDetailLog(
          `Điểm bài làm cũ: ${last_submit.score}. Điểm bài làm mới: ${score}`,
          log_id
        );

        last_score = last_submit.score;

        if (score > last_score) {
          await ExerciseModel.deleteUserMultipleExerciseAnswers(last_submit.id);
          await ExerciseModel.createMultipleChoiceExerciseAnswers(
            last_submit.id,
            questionResults
          );
          await ExerciseModel.updateUserExerciseResult(
            last_submit.id,
            score,
            is_completed
          );
        }
      } else {
        await LogModel.updateDetailLog(`Điểm bài làm mới: ${score}`, log_id);

        result_id = await ExerciseModel.createUserExerciseResult(
          user_id,
          exercise_id,
          score,
          is_completed
        );

        await ExerciseModel.createMultipleChoiceExerciseAnswers(
          result_id,
          questionResults
        );
      }

      // Cập nhật trạng thái hoàn thành của topic
      let completed_topic_id = null;
      if (is_completed) {
        const completed_topic = await TopicModel.getUserCompletedTopic(
          user_id,
          exercise.topic_id
        );
        if (!completed_topic) {
          const topic = await TopicModel.getTopicById(exercise.topic_id);
          const user_exercise_results =
            await ExerciseModel.getUserExerciseResultsByTopicId(
              user_id,
              exercise.topic_id
            );

          let total_scores = 0;
          let total_success_exercise = 0;

          for (let i = 0; i < user_exercise_results.length; i++) {
            if (user_exercise_results[i].is_completed) {
              total_scores += user_exercise_results[i].bonus_scores;
              total_success_exercise++;
            }
          }

          if (
            total_scores >= topic.min_required_score &&
            total_success_exercise >= topic.min_required_exercises
          ) {
            completed_topic_id = topic.id;

            await TopicModel.createTopic(user_id, topic.id);
          }
        }
      }

      await LogModel.updateStatusLog(log_id);

      return res.status(200).json({
        message: "Chấm điểm thành công",
        score: score,
        last_score: last_score,
        result_id: result_id,
        completed_topic_id: completed_topic_id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Chấm điểm bài tập lập trình
  static async submitCodeExercise(req, res) {
    try {
      const user_id = req.user_id;
      const log_id = await LogModel.createLog("exercise-submit", user_id);

      const { exercise_id, code } = req.body;

      if (!exercise_id || !code) {
        await LogModel.updateDetailLog(
          "Dữ liệu không được cung cấp (Id bài tập và bài làm).",
          log_id
        );

        return res.status(404).json({
          message: "Lỗi đường truyền, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      const exercise = await ExerciseModel.getExerciseById(exercise_id);

      if (!exercise) {
        await LogModel.updateDetailLog(
          "Không tìm thấy bài tập trong DB.",
          log_id
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      if (exercise.is_editable) {
        await LogModel.updateDetailLog(
          "Chủ đề của bài tập này đang trong giai đoạn chỉnh sửa."
        );
        return res.status(404).json({
          message:
            "Không tìm thấy bài tập, vui lòng thử lại hoặc tải lại trang.",
        });
      }

      const code_exercise = await ExerciseModel.getCodeExercise(exercise_id);

      // Chấm điểm
      let totalCorrect = 0;
      const test_cases = code_exercise.test_cases;

      for (let i = 0; i < test_cases.length; i++) {
        if (!test_cases[i].input && test_cases[i].output) {
          totalCorrect++
          continue;
        }


        await new Promise((resolve) => {
          compileCode(
            code_exercise.language, // Ngôn ngữ của bài tập
            code, // Mã người dùng
            test_cases[i].input, // Input test case
            (result) => {
              result.output = result.output.trim().replace(/\s+/g, " "); // Loại bỏ khoảng trắng thừa và thay thế nhiều khoảng trắng bằng một khoảng trắng
              test_cases[i].output = test_cases[i].output
                .trim()
                .replace(/\s+/g, " "); // Làm tương tự với output kỳ vọng

              //   console.log("result: ", result.output.trim());
              //   console.log("case: ", test_cases[i].output.trim());
              if (
                result.output.trim() == test_cases[i].output.trim() ||
                test_cases[i].output == ""
              ) {
                totalCorrect++;
              }
              resolve(); // Tiếp tục vòng lặp sau khi callback kết thúc
            }
          );
        });
      }

      const score = (totalCorrect / test_cases.length) * 100;
      let is_completed = score >= 80 ? 1 : 0; // Một bài làm >80 điểm được coi là hoàn thành
      let last_score = null;

      let result_id;

      const last_submit = await ExerciseModel.getUserExerciseResultByExerciseId(
        user_id,
        exercise_id
      );
      if (last_submit && last_submit.id) {
        // Nếu đã từng làm
        result_id = last_submit.id;
        await LogModel.updateDetailLog(
          `Điểm bài làm cũ: ${last_submit.score}. Điểm bài làm mới: ${score}`,
          log_id
        );

        last_score = last_submit.score;

        if (score > last_score) {
          await ExerciseModel.updateCodeExerciseSubmission(exercise_id, code);
          await ExerciseModel.updateUserExerciseResult(
            last_submit.id,
            score,
            is_completed
          );
        }

        if (last_submit.is_completed) {
          is_completed = false;
        }
      } else {
        await LogModel.updateDetailLog(`Điểm bài làm mới: ${score}`, log_id);

        result_id = await ExerciseModel.createUserExerciseResult(
          user_id,
          exercise_id,
          score,
          is_completed
        );

        await ExerciseModel.createCodeExerciseSubmission(result_id, code);
      }

      // Cập nhật trạng thái hoàn thành của topic
      let completed_topic_id = null;
      if (is_completed) {
        const completed_topic = await TopicModel.getUserCompletedTopic(
          user_id,
          exercise.topic_id
        );
        if (!completed_topic || !completed_topic.topic_id) {
          const topic = await TopicModel.getTopicById(exercise.topic_id);
          const user_exercise_results =
            await ExerciseModel.getUserExerciseResultsByTopicId(
              user_id,
              exercise.topic_id
            );

          let total_scores = 0;
          let total_success_exercise = 0;

          for (let i = 0; i < user_exercise_results.length; i++) {
            if (user_exercise_results[i].is_completed) {
              total_scores += user_exercise_results[i].bonus_scores;
              total_success_exercise++;
            }
          }

          if (
            total_scores >= topic.min_required_score &&
            total_success_exercise >= topic.min_required_exercises
          ) {
            completed_topic_id = topic.id;

            await TopicModel.createUserCompletedTopic(user_id, topic.id);
          }
        }
      }

      await LogModel.updateStatusLog(log_id);

      return res.status(200).json({
        message: "Chấm điểm thành công",
        score: score,
        last_score: last_score,
        result_id: result_id,
        completed_topic_id: completed_topic_id,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Tạo mới hoặc cập nhật câu hỏi trắc nghiệm
  static async createOrUpdateMultipleChoiceExercise(req, res) {
    try {
      const user_id = req.user_id;
      const log_id = req.log_id;

      const question = req.body.question;

      const old_question = await ExerciseModel.getMultipleChoiceExercisesById(
        question.id
      );

      // nếu có thì cập nhật, nấu không có thì tạo mới
      if (old_question) {
        if (question.question_image_url !== old_question.question_image_url) {
          deleteFileFromCloudinary(old_question.question_image_url);
        }

        await ExerciseModel.updateMultipleChoiceExercises(question);
        await LogModel.updateDetailLog(
          `Cập nhật câu hỏi thành công với ID: ${question.id}`,
          log_id
        );
        await LogModel.updateStatusLog(log_id);
        return res
          .status(200)
          .json({ message: "Cập nhật câu hỏi thành công." });
      } else {
        await ExerciseModel.createMultipleChoiceExercises(
          question.exercise_id,
          [question]
        );
        await LogModel.updateDetailLog(`Thêm câu hỏi thành công.`, log_id);
        await LogModel.updateStatusLog(log_id);
        return res.status(200).json({ message: "Thêm câu hỏi thành công." });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }

  // Lấy thông tin bài làm của một bài tập bởi người dùng
  static async getExerciseResultByUser(req, res) {
    try {
      const user_id = req.user_id;
      const exercise_id = req.query.exercise_id;

      if (!exercise_id) {
        return res
          .status(400)
          .json({ message: "Không có ID bài làm được cung cấp." });
      }

      const exercise_result =
        await ExerciseModel.getUserExerciseResultByExerciseIdAndUserId(
          exercise_id,
          user_id
        );

      if (!exercise_result) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy thông tin bài làm của bạn" });
      }

      exercise_result.exercise_data = await ExerciseModel.getExerciseById(
        exercise_id
      );

      if (exercise_result.exercise_data.type === "code") {
        exercise_result.code_data =
          await ExerciseModel.getCodeExerciseSubmissionByResultId(
            exercise_result.id
          );
        exercise_result.exercise_data.code_exercise =
          await ExerciseModel.getCodeExercise(exercise_id);
      } else {
        exercise_result.multiple_choice_data =
          await ExerciseModel.getMultipleChoiceExerciseAnswerByResultId(
            exercise_result.id
          );
      }

      return res.status(200).json({ exercise_result: exercise_result });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi từ phía server." });
    }
  }
}

module.exports = ExerciseController;
