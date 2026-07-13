document.addEventListener('DOMContentLoaded', () => {
            // --- 0. 이미지 커서 ---
            if (window.matchMedia('(pointer: fine)').matches) {
                const customCursor = document.createElement('img');
                customCursor.className = 'custom-cursor';
                customCursor.src = 'cursor/normal.jpg';
                customCursor.alt = '';
                customCursor.setAttribute('aria-hidden', 'true');
                document.body.appendChild(customCursor);

                const clickableSelector = 'a, button, [onclick], input, select, textarea, label, summary, [role="button"]';

                document.addEventListener('pointermove', (event) => {
                    customCursor.style.left = `${event.clientX}px`;
                    customCursor.style.top = `${event.clientY}px`;
                    customCursor.classList.add('is-visible');
                });

                document.addEventListener('pointerover', (event) => {
                    const isClickable = event.target.closest?.(clickableSelector);
                    customCursor.src = isClickable ? 'cursor/clickable.jpg' : 'cursor/normal.jpg';
                });

                document.documentElement.addEventListener('mouseleave', () => {
                    customCursor.classList.remove('is-visible');
                });
            }

            // --- 랜딩페이지 스크롤 진행률 (0 ~ 1) ---
            if (document.getElementById('home-page')) {
                const navbar = document.querySelector('.navbar');
                const progressBar = document.createElement('div');
                progressBar.className = 'scroll-progress';
                progressBar.setAttribute('role', 'progressbar');
                progressBar.setAttribute('aria-label', '페이지 스크롤 진행률');
                progressBar.setAttribute('aria-valuemin', '0');
                progressBar.setAttribute('aria-valuemax', '1');
                progressBar.setAttribute('aria-valuenow', '0');
                navbar?.appendChild(progressBar);

                let progressFrameId;
                const updateScrollProgress = () => {
                    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const progress = scrollableHeight > 0
                        ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
                        : 0;

                    progressBar.style.transform = `scaleX(${progress})`;
                    progressBar.setAttribute('aria-valuenow', progress.toFixed(3));
                    progressFrameId = undefined;
                };

                const requestProgressUpdate = () => {
                    if (progressFrameId === undefined) {
                        progressFrameId = requestAnimationFrame(updateScrollProgress);
                    }
                };

                window.addEventListener('scroll', requestProgressUpdate, { passive: true });
                window.addEventListener('resize', requestProgressUpdate);
                updateScrollProgress();
            }

            // --- 1. 라이트/다크 모드 ---
            const themeButton = document.querySelector('.theme-toggle');
            const tabTheme = window.name.startsWith('ssafy_theme:') ? window.name.split(':')[1] : null;
            const savedTheme = localStorage.getItem('ssafy_theme') || tabTheme;
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            const applyTheme = (theme) => {
                const isDark = theme === 'dark';
                document.documentElement.classList.toggle('dark-mode', isDark);
                document.body.classList.toggle('dark-mode', isDark);
                const icon = themeButton?.querySelector('.theme-icon');
                if (icon) icon.textContent = isDark ? '☀️' : '🌙';
                themeButton?.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
            };

            applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

            themeButton?.addEventListener('click', () => {
                const nextTheme = document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark';
                localStorage.setItem('ssafy_theme', nextTheme);
                window.name = `ssafy_theme:${nextTheme}`;
                applyTheme(nextTheme);
            });

            // --- 2. 모바일 햄버거 메뉴 토글 ---
            document.querySelector('.hamburger')?.addEventListener('click', (event) => {
                const isOpen = document.querySelector('.nav-links')?.classList.toggle('open') ?? false;
                event.currentTarget.setAttribute('aria-expanded', String(isOpen));
            });

            // --- 3. 스크롤 페이드인 옵저버 ---
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { root: null, rootMargin: '0px', threshold: 0.15 });
            document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

            // --- 4. 배경 애니메이션 (성능 최적화 유지) ---
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            let orbs = [];
            let animationFrameId;

            function initOrbs() {
                const domOrbs = Array.from(document.querySelectorAll('.bg-orb'));
                orbs = domOrbs.filter(el => window.getComputedStyle(el).display !== 'none').map(el => {
                    let speedX = 2.0 * (Math.random() > 0.5 ? 1 : -1);
                    let speedY = 2.0 * (Math.random() > 0.5 ? 1 : -1);
                    const width = el.offsetWidth, height = el.offsetHeight;
                    return {
                        el, width, height,
                        x: Math.random() * Math.max(0, window.innerWidth - width),
                        y: Math.random() * Math.max(0, window.innerHeight - height),
                        dx: speedX, dy: speedY
                    };
                });
            }

            function animateOrbs() {
                if (prefersReducedMotion) return;
                orbs.forEach(orb => {
                    orb.x += orb.dx; orb.y += orb.dy;
                    let minX = 0, maxX = window.innerWidth - orb.width;
                    let minY = 0, maxY = window.innerHeight - orb.height;
                    if (maxX < 0) { minX = -orb.width / 2; maxX = window.innerWidth - orb.width / 2; }
                    if (maxY < 0) { minY = -orb.height / 2; maxY = window.innerHeight - orb.height / 2; }
                    if (orb.x <= minX) { orb.x = minX; orb.dx = Math.abs(orb.dx); } 
                    else if (orb.x >= maxX) { orb.x = maxX; orb.dx = -Math.abs(orb.dx); }
                    if (orb.y <= minY) { orb.y = minY; orb.dy = Math.abs(orb.dy); } 
                    else if (orb.y >= maxY) { orb.y = maxY; orb.dy = -Math.abs(orb.dy); }
                    orb.el.style.transform = `translate3d(${orb.x}px, ${orb.y}px, 0)`;
                });
                animationFrameId = requestAnimationFrame(animateOrbs);
            }

            if (!prefersReducedMotion) { initOrbs(); animateOrbs(); }

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    cancelAnimationFrame(animationFrameId);
                    if (!prefersReducedMotion) { initOrbs(); animateOrbs(); }
                }, 200); 
            });

            // --- 5. 밸런스 게임 로직 ---
            const gameState = { answered: { 1: false, 2: false, 3: false, 4: false }, score: 0, count: 0 };
            
            // 로컬 스토리지 데이터 불러오기
            const loadLocalData = () => {
                if (!document.getElementById('best-score')) return;
                const maxScore = localStorage.getItem('ssafy_balance_max_score');
                const bestBadge = localStorage.getItem('ssafy_balance_best_badge');
                if(maxScore !== null) {
                    document.getElementById('best-score').textContent = `${maxScore} 점`;
                    document.getElementById('best-badge').textContent = bestBadge;
                }
            };
            loadLocalData();

            // 정답 클릭 처리 함수 (전역 노출)
            window.handleAnswer = function(qNum, isCorrect) {
                if (gameState.answered[qNum]) return; // 이미 풀었으면 무시
                gameState.answered[qNum] = true;
                gameState.count++;

                // 1, 2, 3번 문제 (O/X 스탬프 효과)
                if (qNum <= 3) {
                    const stamp = document.getElementById(`stamp-${qNum}`);
                    if (isCorrect) {
                        stamp.textContent = 'O';
                        stamp.classList.add('correct', 'show');
                        gameState.score++;
                        document.getElementById('current-score').textContent = `${gameState.score} 점`;
                    } else {
                        stamp.textContent = 'X';
                        stamp.classList.add('wrong', 'show');
                    }
                } 
                // 4번 문제 (O는 텍스트, X는 도장 효과)
                else if (qNum === 4) {
                    if (isCorrect) {
                        document.getElementById('text-4').classList.add('show');
                    } else {
                        const stamp = document.getElementById('stamp-4');
                        stamp.textContent = 'X';
                        stamp.classList.add('wrong', 'show');
                    }
                }

                // 진행률 바 업데이트
                document.getElementById('progress-text').textContent = `${gameState.count} / 4 완료`;
                document.getElementById('progress-fill').style.width = `${(gameState.count / 4) * 100}%`;

                // 모든 문제를 다 풀었을 때 뱃지 처리
                if (gameState.count === 4) {
                    let badge = "아직 알아가는 중 뱃지 🌱";
                    if (gameState.score === 3) badge = "취향 완전 일치 뱃지 🥇";
                    else if (gameState.score === 2) badge = "꽤 잘 맞는 페어 뱃지 🥈";
                    
                    document.getElementById('current-badge').textContent = badge;

                    // 최고기록 갱신 (저장)
                    const savedScore = localStorage.getItem('ssafy_balance_max_score') || -1;
                    if (gameState.score > parseInt(savedScore)) {
                        localStorage.setItem('ssafy_balance_max_score', gameState.score);
                        localStorage.setItem('ssafy_balance_best_badge', badge);
                        loadLocalData();
                    }
                }
            };
        });
