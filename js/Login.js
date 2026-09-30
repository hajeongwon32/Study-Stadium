import { signIn } from "./services/authService.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const nicknameInput = document.getElementById("user-id");
  const passwordInput = document.getElementById("user-password");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nickname = nicknameInput.value.trim();
      const password = passwordInput.value;

      if (!nickname || !password) {
        alert("선수 이름과 비밀번호를 모두 입력해주세요.");
        return;
      }

      const result = await signIn({ nickname, password });

      if (result.success) {
        // 로그인 성공 시 메인 화면으로 이동
        window.location.href = "studyStadium_main.html";
      } else {
        alert(`로그인에 실패했습니다: ${result.error}`);
      }
    });
  }
});