import { supabase } from './lib/supabaseClient.js';
import { addStudySetRecord, getTodayStudyRecord, saveStudyNote } from './services/recordService.js';

const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    window.location.replace('Login.html');
    throw new Error('로그인이 필요합니다.');
}

/* =========================
           타이머 기본 설정
        ========================= */
        let focusSeconds = 25 * 60;
        const HYDRATION_BREAK_SECONDS = 5 * 60;
        const HALF_TIME_SECONDS = 10 * 60;

        /* =========================
           현재 경기 상태
        ========================= */
        let currentSet = 1;
        let mode = 'study';
        let breakType = 'hydration';
        let nextSet = 0;
        let remainingSeconds = focusSeconds;
        let timerId = null;
        let timerEndTime = null;
        let isMatchFinished = false;
        let hasStartedCurrentSet = false;
        let currentNote = '';

        /* =========================
           HTML 요소 가져오기
        ========================= */
        const timer = document.querySelector('#timer');
        const timerProgress = document.querySelector('#timer-progress');
        const timerStatus = document.querySelector('#timer-status');
        const toggleTimerButton = document.querySelector('#toggle-timer');
        const finishTodayButton = document.querySelector('#finish-today');
        const logoutButton = document.querySelector('#logout-button');
        const modeLabel = document.querySelector('#mode-label');
        const timerTitleText = document.querySelector('#timer-title-text');
        const breakStepTitle = document.querySelector('#break-step-title');
        const tipTitle = document.querySelector('#tip-title');
        const tipDescription = document.querySelector('#tip-description');
        const progressSteps = document.querySelectorAll('.progress-step');
        const progressLineFill = document.querySelector('#progress-line-fill');
        const settingButton = document.querySelector('#settingBtn');
        const settingModal = document.querySelector('#settingModal');
        const focusTimeInput = document.querySelector('#focusTime');
        const cancelButton = document.querySelector('#cancelBtn');
        const saveButton = document.querySelector('#saveBtn');
        const finishModal = document.querySelector('#finishModal');
        const finishCancelButton = document.querySelector('#finishCancelBtn');
        const finishConfirmButton = document.querySelector('#finishConfirmBtn');
        const noteModal = document.querySelector('#noteModal');
        const studyNoteInput = document.querySelector('#studyNoteInput');
        const noteCancelButton = document.querySelector('#noteCancelBtn');
        const noteSaveButton = document.querySelector('#noteSaveBtn');

        // 경기 상태에 따라 시간 설정 및 종료 버튼의 사용 가능 여부를 갱신합니다.
        const updateSettingAvailability = () => {
            const isLocked = isMatchFinished || (mode === 'study' && hasStartedCurrentSet);
            settingButton.disabled = isLocked;
            settingButton.setAttribute('aria-disabled', String(isLocked));
            finishTodayButton.disabled = isMatchFinished || mode !== 'study' || !hasStartedCurrentSet;

            if (isLocked) closeSettingModal();
        };

        /* =========================
           5초 알람음 재생 함수 (Web Audio API)
        ========================= */
          // 세트 또는 브레이크가 끝날 때 5초 알람음을 재생합니다.
        const playAlarm5Sec = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                
                const audioCtx = new AudioContext();
                const now = audioCtx.currentTime;

                // 5초 동안 1초 간격으로 5번 '삐-' 알람 울림
                for (let i = 0; i < 5; i++) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(659.25, now + i); // E5 (미) 음높이

                    // 0.45초 동안 소리 재생 후 페이드아웃
                    gain.gain.setValueAtTime(0.2, now + i);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i + 0.45);

                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.start(now + i);
                    osc.stop(now + i + 0.5);
                }
            } catch (e) {
                console.log("알람 재생 오류:", e);
            }
        };

        /* =========================
           시간 표시
        ========================= */
          // 초 단위 시간을 MM:SS 형식으로 변환합니다.
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const remainder = (seconds % 60).toString().padStart(2, '0');
            return `${minutes}:${remainder}`;
        };

        /* =========================
           타이머 게이지 화면 업데이트
        ========================= */
          // 남은 시간과 진행률을 타이머 화면에 표시합니다.
        const renderTimer = () => {
            timer.textContent = formatTime(remainingSeconds);
            timer.dateTime = `PT${Math.floor(remainingSeconds / 60)}M${remainingSeconds % 60}S`;

            const totalSeconds = mode === 'study' ? focusSeconds : breakType === 'halftime' ? HALF_TIME_SECONDS : HYDRATION_BREAK_SECONDS;
            const progress = (remainingSeconds / totalSeconds) * 100;
            timerProgress.style.width = `${progress}%`;
        };

        /* =========================
           SET 진행 UI 및 초록선 색상 업데이트
        ========================= */
          // 현재 세트 진행 상태에 맞춰 단계 표시를 갱신합니다.
        const updateProgress = () => {
            const step1 = document.querySelector('.progress-step[data-step="1"]');
            const step2 = document.querySelector('.progress-step[data-step="2"]');
            const stepBreak = document.querySelector('.progress-step[data-step="break"]');
            const step3 = document.querySelector('.progress-step[data-step="3"]');
            const step4 = document.querySelector('.progress-step[data-step="4"]');

            progressSteps.forEach(step => step.classList.remove('complete', 'current'));

            let linePercent = 0;

            if (isMatchFinished) {
                progressSteps.forEach(step => step.classList.add('complete'));
                linePercent = 100;
            } else if (mode === 'study') {
                if (currentSet === 1) {
                    step1.classList.add('current');
                    linePercent = 0;
                } else if (currentSet === 2) {
                    step1.classList.add('complete');
                    step2.classList.add('current');
                    linePercent = 25;
                } else if (currentSet === 3) {
                    step1.classList.add('complete');
                    step2.classList.add('complete');
                    stepBreak.classList.add('complete');
                    step3.classList.add('current');
                    linePercent = 75;
                } else if (currentSet === 4) {
                    step1.classList.add('complete');
                    step2.classList.add('complete');
                    stepBreak.classList.add('complete');
                    step3.classList.add('complete');
                    step4.classList.add('current');
                    linePercent = 75;
                }
            } else if (mode === 'break') {
                stepBreak.classList.add('current');

                if (nextSet === 2) {
                    step1.classList.add('complete');
                    linePercent = 25;
                } else if (nextSet === 3) {
                    step1.classList.add('complete');
                    step2.classList.add('complete');
                    linePercent = 50;
                } else if (nextSet === 4) {
                    step1.classList.add('complete');
                    step2.classList.add('complete');
                    stepBreak.classList.add('complete');
                    step3.classList.add('complete');
                    linePercent = 75;
                }
            }

            progressLineFill.style.width = `${linePercent}%`;
        };

        /* =========================
           화면 내용 업데이트
        ========================= */
          // 집중 모드 또는 브레이크 모드에 맞춰 화면 문구를 갱신합니다.
        const updateScreen = () => {
            if (mode === 'study') {
                modeLabel.textContent = `${currentSet}SET`;
                timerTitleText.textContent = 'FOCUS TIME REMAINING';
                timerStatus.textContent = hasStartedCurrentSet
                    ? `${currentSet}SET 집중 시간이 진행 중입니다.`
                    : '시작 버튼을 눌러 집중을 시작하세요.';
                tipTitle.textContent = `${currentSet}SET에 집중해보세요!`;
                tipDescription.textContent = '집중 시간을 완료하면 다음 단계로 이동합니다.';
            } else if (mode === 'break') {
                const isHalfTime = breakType === 'halftime';
                const breakTitle = isHalfTime ? '하프 타임' : '하이드레이션 브레이크';
                const breakDescription = isHalfTime ? '전반전이 끝났습니다. 10분간 휴식하세요.' : '수분을 섭취하고 눈의 피로를 풀어주세요.';

                breakStepTitle.innerHTML = isHalfTime ? '하프 타임' : '하이드레이션<br>브레이크';
                modeLabel.textContent = breakTitle;
                timerTitleText.textContent = 'BREAK TIME REMAINING';
                timerStatus.textContent = '휴식 시간이 진행 중입니다.';
                tipTitle.textContent = isHalfTime ? '전반전 종료! 충분히 쉬어주세요.' : '잠깐의 휴식으로 집중력을 올려보세요!';
                tipDescription.textContent = breakDescription;
            }

            updateProgress();
            renderTimer();
            updateSettingAvailability();
        };

        // 완료된 세트의 집중 시간을 오늘 기록에 저장합니다.
        const saveCurrentSetRecord = async (focusMinutes) => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
                }

                await addStudySetRecord({ userId: user.id, focusMinutes });
                return true;
            } catch (error) {
                console.error('세트 기록 저장 실패:', error);
                alert(`세트 기록 저장에 실패했습니다.\n${error.message}`);
                return false;
            }
        };

        /* =========================
           SET 종료
        ========================= */
          // 집중 세트를 종료하고 기록 저장 후 다음 브레이크로 이동합니다.
        const finishStudySet = async () => {
            clearInterval(timerId);
            timerId = null;
            toggleTimerButton.disabled = true;
            finishTodayButton.disabled = true;

            const saved = await saveCurrentSetRecord(Math.round(focusSeconds / 60));
            if (!saved) {
                toggleTimerButton.disabled = false;
                finishTodayButton.disabled = false;
                toggleTimerButton.textContent = '▶  계속하기';
                return;
            }

            playAlarm5Sec(); // 5초 알람 실행
            hasStartedCurrentSet = false;

            if (currentSet === 1) {
                mode = 'break'; breakType = 'hydration'; nextSet = 2;
                remainingSeconds = HYDRATION_BREAK_SECONDS;
                timerStatus.textContent = '1SET 완료! 5분 하이드레이션 브레이크입니다.';
                updateScreen(); startTimer(); return;
            }

            if (currentSet === 2) {
                mode = 'break'; breakType = 'halftime'; nextSet = 3;
                remainingSeconds = HALF_TIME_SECONDS;
                timerStatus.textContent = '2SET 완료! 10분 하프 타임입니다.';
                updateScreen(); startTimer(); return;
            }

            if (currentSet === 3) {
                mode = 'break'; breakType = 'hydration'; nextSet = 4;
                remainingSeconds = HYDRATION_BREAK_SECONDS;
                timerStatus.textContent = '3SET 완료! 5분 하이드레이션 브레이크입니다.';
                updateScreen(); startTimer(); return;
            }

            if (currentSet === 4) {
                finishMatch();
            }
        };

        /* =========================
           브레이크 종료
        ========================= */
          // 브레이크를 종료하고 다음 집중 세트를 시작합니다.
        const finishBreak = () => {
            clearInterval(timerId);
            timerId = null;

            playAlarm5Sec(); // 5초 알람 실행

            mode = 'study';
            currentSet = nextSet;
            remainingSeconds = focusSeconds;
            hasStartedCurrentSet = true;
            timerStatus.textContent = `휴식 종료! ${currentSet}SET을 시작합니다.`;
            
            updateScreen();
            startTimer();
        };

        /* =========================
           경기 종료
        ========================= */
          // 오늘의 경기를 종료하고 노트 작성 버튼을 표시합니다.
        const finishMatch = () => {
            clearInterval(timerId);
            timerId = null;
            remainingSeconds = 0;
            isMatchFinished = true;
            renderTimer();

            modeLabel.textContent = 'FULL TIME';
            timerTitleText.textContent = 'MATCH COMPLETE';
            timerStatus.textContent = '오늘의 경기가 종료되었습니다!';
            tipTitle.textContent = '오늘의 공부를 완료했습니다!';
            tipDescription.textContent = '수고하셨습니다. 오늘의 기록이 저장됩니다.';
            
            toggleTimerButton.textContent = currentNote ? '✎ 오늘의 노트 수정' : '✎ 오늘의 노트 작성';
            toggleTimerButton.disabled = false;
            finishTodayButton.disabled = true;

            updateProgress();
            updateSettingAvailability();
        };

        /* =========================
           타이머 시작
        ========================= */
          // 현재 모드의 타이머를 시작하거나 다시 시작합니다.
        const startTimer = () => {
            clearInterval(timerId);
            if (mode === 'study') hasStartedCurrentSet = true;
            timerEndTime = Date.now() + remainingSeconds * 1000;
            timerId = setInterval(() => {
                remainingSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
                renderTimer();

                if (remainingSeconds === 0) {
                    if (mode === 'study') {
                        finishStudySet();
                    } else {
                        finishBreak();
                    }
                    return;
                }
                remainingSeconds--;
                renderTimer();
            }, 1000);
            toggleTimerButton.disabled = false;
            toggleTimerButton.textContent = 'Ⅱ  일시정지';
            updateSettingAvailability();
        };

        /* =========================
           일시정지 / 계속하기
        ========================= */
          // 실행 중인 타이머를 즉시 멈추고 현재 남은 시간을 확정합니다.
        const pauseTimer = () => {
            if (!timerId) return;

            remainingSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
            clearInterval(timerId);
            timerId = null;
            timerEndTime = null;
            renderTimer();
            timerStatus.textContent = '타이머가 일시정지되었습니다.';
            toggleTimerButton.textContent = '▶  계속하기';
        };

        toggleTimerButton.addEventListener('click', () => {
            if (isMatchFinished) return;
            if (timerId) {
                pauseTimer();
            } else {
                startTimer();
                if (mode === 'study') {
                    timerStatus.textContent = `${currentSet}SET 집중 시간이 진행 중입니다.`;
                } else {
                    timerStatus.textContent = '휴식 시간이 진행 중입니다.';
                }
            }
        });

        // 입력한 노트를 오늘 공부 기록에 저장하거나 수정합니다.
        const saveNote = async () => {
            try {
                currentNote = studyNoteInput.value.trim();
                await saveStudyNote({ userId: session.user.id, note: currentNote });
                closeNoteModal();
                return true;
            } catch (error) {
                console.error('공부 노트 저장 실패:', error);
                alert(`공부 노트 저장에 실패했습니다.\n${error.message}`);
                return false;
            }
        };

        // 현재 세트 기록과 노트를 저장한 뒤 오늘 경기를 종료합니다.
        const finishTodayWithNote = async () => {
            if (isMatchFinished || mode !== 'study' || finishTodayButton.disabled) return;

            pauseTimer();

            finishTodayButton.disabled = true;
            toggleTimerButton.disabled = true;

            const elapsedMinutes = Math.max(1, Math.floor((focusSeconds - remainingSeconds) / 60));
            const saved = await saveCurrentSetRecord(elapsedMinutes);

            if (!saved) {
                finishTodayButton.disabled = false;
                toggleTimerButton.disabled = false;
                toggleTimerButton.textContent = '▶  계속하기';
                return;
            }

            const noteSaved = await saveNote();
            if (!noteSaved) {
                finishTodayButton.disabled = false;
                toggleTimerButton.disabled = false;
                toggleTimerButton.textContent = '▶  계속하기';
                return;
            }
            finishMatch();
        };

        finishTodayButton.addEventListener('click', () => {
            pauseTimer();
            openNoteModal(finishTodayWithNote);
        });
        toggleTimerButton.addEventListener('click', () => {
            if (isMatchFinished) openNoteModal(saveNote);
        });

        let noteSubmitAction = null;

        // 노트 입력 모달을 열고 저장 후 실행할 동작을 등록합니다.
        const openNoteModal = (submitAction) => {
            noteSubmitAction = submitAction;
            studyNoteInput.value = currentNote;
            noteSaveButton.textContent = isMatchFinished ? '수정 저장' : '저장하고 종료';
            noteModal.classList.add('is-open');
            studyNoteInput.focus();
        };

        // 노트 입력 모달을 닫습니다.
        const closeNoteModal = () => {
            noteModal.classList.remove('is-open');
            noteSubmitAction = null;
        };

        noteCancelButton.addEventListener('click', closeNoteModal);
        noteSaveButton.addEventListener('click', () => {
            if (noteSubmitAction) noteSubmitAction();
        });
        noteModal.addEventListener('click', (event) => {
            if (event.target === noteModal) closeNoteModal();
        });

        // 시간 설정 모달을 닫습니다.
        const closeSettingModal = () => {
            settingModal.classList.remove('is-open');
        };

        settingButton.addEventListener('click', () => {
            focusTimeInput.value = Math.round(focusSeconds / 60);
            settingModal.classList.add('is-open');
            focusTimeInput.focus();
            focusTimeInput.select();
        });

        cancelButton.addEventListener('click', closeSettingModal);

        settingModal.addEventListener('click', (event) => {
            if (event.target === settingModal) closeSettingModal();
        });

        saveButton.addEventListener('click', () => {
            const minutes = Number(focusTimeInput.value);

            if (!Number.isInteger(minutes) || minutes < 1 || minutes > 90) {
                focusTimeInput.reportValidity();
                return;
            }

            focusSeconds = minutes * 60;

            if (mode === 'study') {
                remainingSeconds = focusSeconds;
                renderTimer();
                if (timerId) startTimer();
            }

            closeSettingModal();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && settingModal.classList.contains('is-open')) {
                closeSettingModal();
            }
        });

        logoutButton.addEventListener('click', async () => {
            logoutButton.disabled = true;
            const { error } = await supabase.auth.signOut();

            if (error) {
                logoutButton.disabled = false;
                alert('로그아웃에 실패했습니다. 다시 시도해 주세요.');
                return;
            }

            window.location.replace('Login.html');
        });

        /* =========================
           처음 실행
        ========================= */
        // 오늘 기록을 확인하고 타이머 화면을 초기화합니다.
        const initializeTimer = async () => {
            const todayRecord = await getTodayStudyRecord(session.user.id);

            if (todayRecord) {
                currentNote = todayRecord.note || '';
                finishMatch();
                return;
            }

            updateScreen();
        };

        initializeTimer().catch((error) => {
            console.error('오늘 기록 확인 실패:', error);
            alert(`오늘 기록을 확인하지 못했습니다.\n${error.message}`);
            updateScreen();
        });