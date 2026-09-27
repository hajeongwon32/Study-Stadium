import { supabase } from '../lib/supabaseClient.js';

// 날짜를 Supabase 조회용 YYYY-MM-DD 문자열로 변환합니다.
const getDateKey = (date = new Date()) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

// 로그인한 사용자의 오늘 공부 기록을 조회합니다.
export const getTodayStudyRecord = async (userId) => {
	if (!userId) return null;

	const { data, error } = await supabase
		.from('study_records')
		.select('id, sets, total_time, note')
		.eq('user_id', userId)
		.eq('date', getDateKey())
		.maybeSingle();

	if (error) {
		throw new Error(`오늘 기록 확인 실패: ${error.message}`);
	}

	return data;
};

// 오늘 공부 기록의 노트를 새로 저장하거나 수정합니다.
export const saveStudyNote = async ({ userId, note }) => {
	if (!userId) {
		throw new Error('로그인 사용자 정보가 없습니다. 다시 로그인해 주세요.');
	}

	const { data: existingRecord, error: selectError } = await supabase
		.from('study_records')
		.select('id')
		.eq('user_id', userId)
		.eq('date', getDateKey())
		.maybeSingle();

	if (selectError) {
		throw new Error(`오늘 기록 조회 실패: ${selectError.message}`);
	}

	if (!existingRecord) {
		throw new Error('저장할 오늘의 공부 기록이 없습니다.');
	}

	const { data, error } = await supabase
		.from('study_records')
		.update({ note: note.trim() })
		.eq('id', existingRecord.id)
		.eq('user_id', userId)
		.select()
		.single();

	if (error) {
		throw new Error(`공부 노트 저장 실패: ${error.message}`);
	}

	return data;
};

/**
 * 오늘의 공부 기록에 세트 하나를 추가합니다.
 * study_records의 기존 user_id, date, sets, total_time 컬럼을 사용합니다.
 */
export const addStudySetRecord = async ({ userId, focusMinutes }) => {
	if (!userId) {
		throw new Error('로그인 사용자 정보가 없습니다. 다시 로그인해 주세요.');
	}

	const date = getDateKey();
	const { data: existingRecord, error: selectError } = await supabase
		.from('study_records')
		.select('id, sets, total_time')
		.eq('user_id', userId)
		.eq('date', date)
		.maybeSingle();

	if (selectError) {
		throw new Error(`오늘 기록 조회 실패: ${selectError.message}`);
	}

	const nextValues = {
		sets: (existingRecord?.sets || 0) + 1,
		total_time: (existingRecord?.total_time || 0) + focusMinutes,
	};

	if (existingRecord) {
		const { error } = await supabase
			.from('study_records')
			.update(nextValues)
			.eq('id', existingRecord.id)
			.eq('user_id', userId);

		if (error) {
			throw new Error(`오늘 기록 수정 실패: ${error.message}`);
		}
		return { ...existingRecord, ...nextValues, date };
	}

	const { data, error } = await supabase
		.from('study_records')
		.insert({ user_id: userId, date, ...nextValues })
		.select()
		.single();

	if (error) {
		throw new Error(`오늘 기록 생성 실패: ${error.message}`);
	}
	return data;
};
