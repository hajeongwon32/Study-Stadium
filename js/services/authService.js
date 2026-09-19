import { supabase } from "../lib/supabaseClient.js";

const nicknameToEmail = (nickname) => {
  const cleanNickname = nickname.trim();

  if (/^[A-Za-z0-9._-]+$/.test(cleanNickname)) {
    return `${cleanNickname}@studystadium.com`;
  }

  const nicknameBytes = new TextEncoder().encode(cleanNickname);
  let binaryNickname = "";

  nicknameBytes.forEach((byte) => {
    binaryNickname += String.fromCharCode(byte);
  });

  const encodedNickname = btoa(binaryNickname)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `player-${encodedNickname}@studystadium.com`;
};

/**
 * 닉네임 중복 확인 (profiles 테이블 조회)
 * @param {string} nickname 
 * @returns {Promise<boolean>} 중복이면 true, 가능하면 false
 */
export const checkNicknameDuplicate = async (nickname) => {
  if (!nickname || nickname.trim() === "") return true;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('nickname', nickname.trim());

    if (error) {
      console.error('중복 확인 에러:', error);
      return true;
    }

    return data && data.length > 0;
  } catch (err) {
    console.error('중복 확인 중 예외 발생:', err);
    return true;
  }
};

/**
 * 회원가입 (Auth 계정 생성 및 profiles 테이블 닉네임 추가)
 */
export const signUp = async ({ nickname, password }) => {
  try {
    const cleanNickname = nickname.trim();
    const email = nicknameToEmail(cleanNickname);

    if (await checkNicknameDuplicate(cleanNickname)) {
      throw new Error('이미 등록된 선수 이름이거나 중복 확인에 실패했습니다.');
    }

    // 1. Supabase Auth 계정 생성
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname: cleanNickname },
      },
    });

    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('회원가입 실패:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 로그인
 */
export const signIn = async ({ nickname, password }) => {
  try {
    const cleanNickname = nickname.trim();
    const email = nicknameToEmail(cleanNickname);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('로그인 실패:', error.message);
    return { success: false, error: error.message };
  }
};