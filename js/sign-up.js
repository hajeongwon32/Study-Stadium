import { checkNicknameDuplicate, signUp } from "./services/auth-service.js";

document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput = document.getElementById("signup-name");
  const checkBtn = document.querySelector(".check-name-button");
  const checkMsg = document.querySelector(".name-status");
  const passwordInput = document.getElementById("signup-password");
  const signUpForm = document.querySelector(".signup-form");
  const formMessage = document.querySelector(".form-message");
  const submitButton = signUpForm?.querySelector(".submit-button");

  let isNicknameChecked = false;
  let isCheckingNickname = false;

  // 안내 문구를 표시합니다. type: "error" | "success" | ""
  const showMessage = (element, baseClass, text, type = "") => {
    element.textContent = text;
    element.className = type ? `${baseClass} ${type}` : baseClass;
  };
  const showNameMessage = (text, type) => showMessage(checkMsg, "name-status", text, type);
  const showFormMessage = (text, type) => showMessage(formMessage, "form-message", text, type);

  // Supabase 회원가입 오류를 사용자용 문구로 바꿉니다.
  const getSignUpErrorMessage = (error) => {
    if (/already registered|이미 등록된/i.test(error)) {
      return "이미 등록된 선수 이름입니다.";
    }
    if (/password/i.test(error)) {
      return "비밀번호 조건을 확인해주세요. (최소 6자리)";
    }
    return "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.";
  };

  // 닉네임 수정 시 중복확인 상태 초기화
  if (nicknameInput) {
    nicknameInput.addEventListener("input", () => {
      isNicknameChecked = false;
      showNameMessage("");
      showFormMessage("");
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => showFormMessage(""));
  }

  // 비밀번호 보기/숨기기
  const passwordToggle = document.querySelector(".password-toggle");
  passwordToggle?.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    passwordToggle.textContent = isHidden ? "숨기기" : "보기";
    passwordToggle.setAttribute("aria-label", isHidden ? "비밀번호 숨기기" : "비밀번호 표시");
  });

  // 중복 확인 버튼 이벤트
  if (checkBtn) {
    checkBtn.addEventListener("click", async () => {
      const nickname = nicknameInput.value;

      if (!nickname || nickname.trim() === "") {
        showNameMessage("선수 이름을 입력해주세요.", "error");
        return;
      }

      isCheckingNickname = true;
      isNicknameChecked = false;
      checkBtn.disabled = true;
      showNameMessage("중복 확인 중...");

      try {
        const isDuplicate = await checkNicknameDuplicate(nickname);

        if (isDuplicate) {
          showNameMessage("이미 등록된 선수 이름입니다.", "error");
          isNicknameChecked = false;
        } else {
          showNameMessage("출전 가능한 선수 이름입니다!", "success");
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
        showFormMessage("중복 확인이 끝난 후 선수 등록을 눌러주세요.", "error");
        return;
      }

      if (!isNicknameChecked) {
        showNameMessage("선수 이름 중복 확인을 먼저 완료해주세요.", "error");
        return;
      }

      if (password.length < 6) {
        showFormMessage("비밀번호는 최소 6자리 이상이어야 합니다.", "error");
        return;
      }

      submitButton.disabled = true;
      showFormMessage("선수 등록 중...");

      const result = await signUp({ nickname, password });

      if (result.success) {
        showFormMessage("선수 등록 완료! 잠시 후 로그인 페이지로 이동합니다.", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      } else {
        submitButton.disabled = false;
        showFormMessage(getSignUpErrorMessage(result.error), "error");
      }
    });
  }
});
