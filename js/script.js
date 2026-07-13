document.addEventListener('DOMContentLoaded', () => {
            // --- 2. 모바일 햄버거 메뉴 토글 ---
            document.querySelector('.hamburger')?.addEventListener('click', () => {
                document.querySelector('.nav-links')?.classList.toggle('open');
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
                    let speedX = (Math.random() * 0.3 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
                    let speedY = (Math.random() * 0.3 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
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
                // 4번 문제 (텍스트 오버레이 효과)
                else if (qNum === 4) {
                    document.getElementById('text-4').classList.add('show');
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