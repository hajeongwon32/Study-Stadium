import { supabase } from "./lib/supabase-client.js";
import { getMyNickname, signOut } from "./services/auth-service.js";

// 메인·통계 화면 오른쪽 위 닉네임 버튼과 로그아웃 메뉴를 담당합니다.
document.addEventListener("DOMContentLoaded", async () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileName = document.getElementById("profileName");
  const profileDropdown = document.getElementById("profileDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  // 로그인 안 되어 있으면 로그인 화면으로 보냅니다.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.replace("login.html");
    return;
  }

  const nickname = await getMyNickname(session.user.id);
  profileName.textContent = nickname || "선수";
  profileBtn.title = nickname;

  const openMenu = () => {
    profileDropdown.hidden = false;
    profileBtn.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    profileDropdown.hidden = true;
    profileBtn.setAttribute("aria-expanded", "false");
  };

  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileDropdown.hidden) openMenu();
    else closeMenu();
  });

  // 메뉴 바깥을 누르거나 ESC를 누르면 닫습니다.
  document.addEventListener("click", (e) => {
    if (!profileDropdown.hidden && !profileDropdown.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !profileDropdown.hidden) closeMenu();
  });

  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    const result = await signOut();

    if (!result.success) {
      logoutBtn.disabled = false;
      alert("로그아웃에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    window.location.replace("login.html");
  });
});
