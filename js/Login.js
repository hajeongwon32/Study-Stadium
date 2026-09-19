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
        // 메인 화면 완성 전까지 타이머 화면으로 바로 진입
        window.location.href = "Timer.html";
      } else {
        alert(`로그인에 실패했습니다: ${result.error}`);
      }
    });
  }
});