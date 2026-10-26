import { signIn } from "./services/auth-service.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const nicknameInput = document.getElementById("user-id");
  const passwordInput = document.getElementById("user-password");
  const formMessage = document.querySelector(".form-message");
  const submitButton = loginForm?.querySelector(".submit-button");

  // 폼 아래 안내 문구를 표시합니다. type: "error" | "success" | ""
  const showMessage = (text, type = "") => {
    formMessage.textContent = text;
    formMessage.className = type ? `form-message ${type}` : "form-message";
  };

  // Supabase 로그인 오류를 사용자용 문구로 바꿉니다.
  const getLoginErrorMessage = (error) => {
    if (/invalid login credentials/i.test(error)) {
      return "선수 이름 또는 비밀번호가 올바르지 않습니다.";
    }
    return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.";
  };

  // 비밀번호 보기/숨기기
  const passwordToggle = document.querySelector(".password-toggle");
  passwordToggle?.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    passwordToggle.textContent = isHidden ? "숨기기" : "보기";
    passwordToggle.setAttribute("aria-label", isHidden ? "비밀번호 숨기기" : "비밀번호 표시");
  });

  if (loginForm) {
    // 입력을 고치면 이전 안내 문구를 지웁니다.
    [nicknameInput, passwordInput].forEach((input) => {
      input.addEventListener("input", () => showMessage(""));
    });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nickname = nicknameInput.value.trim();
      const password = passwordInput.value;

      if (!nickname || !password) {
        showMessage("선수 이름과 비밀번호를 모두 입력해주세요.", "error");
        return;
      }

      submitButton.disabled = true;
      showMessage("로그인 중...");

      const result = await signIn({ nickname, password });

      if (result.success) {
        // 로그인 성공 시 메인 화면으로 이동
        window.location.href = "studyStadium_main.html";
      } else {
        submitButton.disabled = false;
        showMessage(getLoginErrorMessage(result.error), "error");
      }
    });
  }
});
