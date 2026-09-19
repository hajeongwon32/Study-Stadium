import { checkNicknameDuplicate, signUp } from "./services/authService.js";

document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("signup-name");
  const checkBtn = document.querySelector(".check-name-button");
  const checkMsg = document.querySelector(".name-status");
  const passwordInput = document.getElementById("signup-password");
  const signUpForm = document.querySelector(".signup-form");

  let isNicknameChecked = false;
  let isCheckingNickname = false;

  // 닉네임 수정 시 중복확인 상태 초기화
  if (nicknameInput) {
    nicknameInput.addEventListener("input", () => {
      isNicknameChecked = false;
      if (checkMsg) {
        checkMsg.innerText = "";
        checkMsg.className = "check-message";
      }
    });
  }

  // 중복 확인 버튼 이벤트
  if (checkBtn) {
    checkBtn.addEventListener("click", async () => {
      const nickname = nicknameInput.value;

      if (!nickname || nickname.trim() === "") {
        alert("선수 이름을 입력해주세요.");
        return;
      }

      isCheckingNickname = true;
      isNicknameChecked = false;
      checkBtn.disabled = true;
      checkMsg.innerText = "중복 확인 중...";
      checkMsg.style.color = "#cccccc";

      try {
        const isDuplicate = await checkNicknameDuplicate(nickname);

        if (isDuplicate) {
          checkMsg.innerText = "이미 등록된 선수 이름입니다.";
          checkMsg.style.color = "#ff4d4d";
          isNicknameChecked = false;
        } else {
          checkMsg.innerText = "출전 가능한 선수 이름입니다!";
          checkMsg.style.color = "#00e676";
          isNicknameChecked = true;
        }
      } finally {
        isCheckingNickname = false;
        checkBtn.disabled = false;
      }
    });
  }

  // 회원가입 폼 제출 이벤트
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nickname = nicknameInput.value;
      const password = passwordInput.value;

      if (isCheckingNickname) {
        alert("중복 확인이 끝난 후 선수 등록을 눌러주세요.");
        return;
      }

      if (!isNicknameChecked) {
        alert("선수 이름 중복 확인을 먼저 완료해주세요.");
        return;
      }

      if (password.length < 6) {
        alert("비밀번호는 최소 6자리 이상이어야 합니다.");
        return;
      }

      const result = await signUp({ nickname, password });

      if (result.success) {
        alert("선수 등록이 완료되었습니다! 로그인 페이지로 이동합니다.");
        window.location.href = "Login.html";
      } else {
        alert(`회원가입에 실패했습니다: ${result.error}`);
      }
    });
  }
});