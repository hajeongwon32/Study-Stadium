import { supabase } from './lib/supabaseClient.js';
import { addStudySetRecord, getTodayStudyRecord } from './services/recordService.js';

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
        const formatTime = (seconds) => {
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const remainder = (seconds % 60).toString().padStart(2, '0');
            return `${minutes}:${remainder}`;
        };

        /* =========================
           타이머 게이지 화면 업데이트
        ========================= */
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
            
            toggleTimerButton.textContent = '✓ 경기 종료';
            toggleTimerButton.disabled = true;
            finishTodayButton.disabled = true;

            updateProgress();
            updateSettingAvailability();
        };

        /* =========================
           타이머 시작
        ========================= */
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
        toggleTimerButton.addEventListener('click', () => {
            if (timerId) {
                remainingSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
                clearInterval(timerId);
                timerId = null;
                timerEndTime = null;
                renderTimer();
                timerStatus.textContent = '타이머가 일시정지되었습니다.';
                toggleTimerButton.textContent = '▶  계속하기';
            } else {
                startTimer();
                if (mode === 'study') {
                    timerStatus.textContent = `${currentSet}SET 집중 시간이 진행 중입니다.`;
                } else {
                    timerStatus.textContent = '휴식 시간이 진행 중입니다.';
                }
            }
        });

        finishTodayButton.addEventListener('click', async () => {
            if (isMatchFinished || mode !== 'study' || finishTodayButton.disabled) return;

            const shouldFinishToday = await requestFinishConfirmation();
            if (!shouldFinishToday) return;

            if (timerId) {
                remainingSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
                clearInterval(timerId);
                timerId = null;
                timerEndTime = null;
            }

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

            finishMatch();
        });

        const requestFinishConfirmation = () => new Promise((resolve) => {
            finishModal.classList.add('is-open');

            const close = (confirmed) => {
                finishModal.classList.remove('is-open');
                finishConfirmButton.removeEventListener('click', confirm);
                finishCancelButton.removeEventListener('click', cancel);
                finishModal.removeEventListener('click', handleBackdropClick);
                document.removeEventListener('keydown', handleKeydown);
                resolve(confirmed);
            };
            const confirm = () => close(true);
            const cancel = () => close(false);
            const handleBackdropClick = (event) => {
                if (event.target === finishModal) cancel();
            };
            const handleKeydown = (event) => {
                if (event.key === 'Escape') cancel();
            };

            finishConfirmButton.addEventListener('click', confirm);
            finishCancelButton.addEventListener('click', cancel);
            finishModal.addEventListener('click', handleBackdropClick);
            document.addEventListener('keydown', handleKeydown);
            finishConfirmButton.focus();
        });

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
        const initializeTimer = async () => {
            const todayRecord = await getTodayStudyRecord(session.user.id);

            if (todayRecord) {
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