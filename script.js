document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. 테마 토글 (Dark / Light Mode)
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('.toggle-icon');
    
    // 로컬 스토리지 또는 시스템 선호 검사
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const setDarkMode = (isDark) => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    };
    
    // 초기 테마 설정
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setDarkMode(true);
    } else {
        setDarkMode(false);
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setDarkMode(!isDark);
    });

    // ----------------------------------------------------
    // 2. 모바일 메뉴 & 헤더 스크롤 제어
    // ----------------------------------------------------
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    // 헤더 스크롤 효과
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // 스크롤 위치에 따른 네비게이션 활성화
        let currentSection = '';
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 120;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
    
    // 모바일 햄버거 토글
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // 메뉴 링크 클릭 시 닫기 및 부드러운 스크롤
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ----------------------------------------------------
    // 3. 스크롤 페이드인 효과 (Intersection Observer)
    // ----------------------------------------------------
    const fadeSections = document.querySelectorAll('.fade-in-section');
    
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // 한 번 노출되면 더이상 감시하지 않음
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    fadeSections.forEach(section => {
        sectionObserver.observe(section);
    });

    // ----------------------------------------------------
    // 4. 포트폴리오 카테고리 필터링
    // ----------------------------------------------------
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 버튼 상태 활성화
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            
            portfolioItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                // 필터링 애니메이션 구현
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // ----------------------------------------------------
    // 5. 프리미엄 실시간 견적 계산기 로직
    // ----------------------------------------------------
    const calcType = document.getElementById('calc-type');
    const calcGradeCards = document.querySelectorAll('.grade-card');
    const calcSizeRange = document.getElementById('calc-size-range');
    const calcSizeText = document.getElementById('calc-size-text');
    
    const resultType = document.getElementById('result-type');
    const resultGrade = document.getElementById('result-grade');
    const resultSize = document.getElementById('result-size');
    const resultAvgPrice = document.getElementById('result-avg-price');
    const resultTotalPrice = document.getElementById('result-total-price');
    const applyEstimateBtn = document.getElementById('apply-estimate-btn');
    
    // 계산기 상태 변수
    let selectedGrade = 'standard';
    
    // 인테리어 유형별 평당 기본 단가 (원 단위)
    const basePrices = {
        cafe: 1500000,      // 커피전문점/카페
        commercial: 1200000, // 상가/매장/사무실
        apartment: 1400000,  // 아파트/주거공간
        partial: 350000     // 도배/장판/부분시공
    };
    
    // 마감재/자재 등급별 배율
    const gradeMultipliers = {
        economy: 0.85,    // 실속형 (합리적인 자재와 베이직한 마감)
        standard: 1.0,    // 고급형 (고객들이 가장 많이 선택하는 베스트셀러 구성)
        premium: 1.4      // 프리미엄형 (친환경 명품 자재, 맞춤 디자인 가구, 스페셜 조명 설계)
    };
    
    const gradeNames = {
        economy: '실속형 (합리적 실용)',
        standard: '고급형 (기본+베스트셀러)',
        premium: '프리미엄형 (최고급 명품 마감)'
    };
    
    // 실시간 계산 함수
    const calculateEstimate = () => {
        const typeValue = calcType.value;
        const sizeValue = parseInt(calcSizeRange.value);
        
        // 텍스트 인풋 동기화
        calcSizeText.value = sizeValue;
        
        const basePrice = basePrices[typeValue] || 0;
        const multiplier = gradeMultipliers[selectedGrade] || 1.0;
        
        // 평당 최종 가격
        const finalPricePerPyung = basePrice * multiplier;
        // 총금액 중간값
        const midTotalPrice = finalPricePerPyung * sizeValue;
        
        // 금액 오차 범위 설정 (실제 상황을 고려한 최소~최대 범위 산출)
        const minTotalPrice = midTotalPrice * 0.92;
        const maxTotalPrice = midTotalPrice * 1.08;
        
        // 천원 단위 절사 함수
        const formatKoreanPrice = (num) => {
            const rounded = Math.round(num / 10000) * 10000; // 만원 단위 반올림
            if (rounded >= 100000000) {
                const eok = Math.floor(rounded / 100000000);
                const man = Math.round((rounded % 100000000) / 10000);
                return man > 0 ? `${eok}억 ${man.toLocaleString()}만` : `${eok}억`;
            } else {
                const man = Math.round(rounded / 10000);
                return `${man.toLocaleString()}만`;
            }
        };
        
        // 상세 명세 업데이트
        resultType.textContent = calcType.options[calcType.selectedIndex].text;
        resultGrade.textContent = gradeNames[selectedGrade];
        resultSize.textContent = `${sizeValue} 평 (약 ${(sizeValue * 3.3).toFixed(1)} ㎡)`;
        resultAvgPrice.textContent = `평당 약 ${Math.round(finalPricePerPyung / 10000).toLocaleString()} 만원`;
        
        // 최종 범위 가격 출력
        resultTotalPrice.innerHTML = `${formatKoreanPrice(minTotalPrice)} ~ ${formatKoreanPrice(maxTotalPrice)} <span>원</span>`;
    };
    
    // 계산기 등급 카드 클릭 이벤트
    calcGradeCards.forEach(card => {
        card.addEventListener('click', () => {
            calcGradeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedGrade = card.getAttribute('data-grade');
            calculateEstimate();
        });
    });
    
    // 평수 슬라이더 드래그 이벤트
    calcSizeRange.addEventListener('input', calculateEstimate);
    
    // 평수 텍스트 직접 입력 시 이벤트
    calcSizeText.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 5;
        if (val < 5) val = 5;
        if (val > 100) val = 100;
        calcSizeRange.value = val;
        calculateEstimate();
    });
    
    // 유형 변경 이벤트
    calcType.addEventListener('change', calculateEstimate);
    
    // 계산기 결과 -> 상담 폼 연동 버튼 클릭 이벤트
    applyEstimateBtn.addEventListener('click', () => {
        const typeValue = calcType.value;
        const sizeValue = calcSizeRange.value;
        const selectedTypeName = calcType.options[calcType.selectedIndex].text;
        const gradeName = gradeNames[selectedGrade];
        
        // 계산값 파싱
        const avgPrice = resultAvgPrice.textContent;
        const rangeText = resultTotalPrice.textContent.replace(' 원', '원');
        
        // 1. 상담 신청 폼의 인테리어 유형 셀렉트박스 설정
        const contactType = document.getElementById('type');
        if (contactType) {
            contactType.value = typeValue;
        }
        
        // 2. 평수 기입
        const contactSize = document.getElementById('size');
        if (contactSize) {
            contactSize.value = `${sizeValue}평`;
        }
        
        // 3. 문의 내용 상세 조합하여 텍스트 영역에 삽입
        const contactMessage = document.getElementById('message');
        if (contactMessage) {
            contactMessage.value = `[실시간 견적 계산기 연동 데이터]\n` +
                                   `- 인테리어 유형: ${selectedTypeName}\n` +
                                   `- 자재/마감재 등급: ${gradeName}\n` +
                                   `- 예상 평수: ${sizeValue}평\n` +
                                   `- 평당 산정가: ${avgPrice}\n` +
                                   `- 예상 견적 범위: ${rangeText}\n\n` +
                                   `원하시는 스타일이나 세부적인 요구사항을 여기에 추가로 입력해 주세요. 베테랑 전문가가 신속하게 확인하고 연락드리겠습니다.`;
        }
        
        // 4. 상담 폼 섹션으로 부드러운 스크롤 이동
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            const headerOffset = 80;
            const elementPosition = contactSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // 시각적 효과를 위해 폼에 일시적으로 하이라이트 부여
            const formContainer = document.querySelector('.form-container');
            formContainer.style.borderColor = 'var(--accent-gold)';
            formContainer.style.boxShadow = '0 0 20px rgba(197, 168, 128, 0.3)';
            setTimeout(() => {
                formContainer.style.borderColor = '#2e2a27';
                formContainer.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.4)';
            }, 2000);
        }
    });
    
    // 초기 계산 실행
    calculateEstimate();

    // ----------------------------------------------------
    // 6. 상담 신청 폼 유효성 검사 및 커스텀 모달 제어
    // ----------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const modalOverlay = document.getElementById('success-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 필수 데이터 추출
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const agreeChecked = document.getElementById('agree').checked;
            
            if (!name.trim() || !phone.trim() || !agreeChecked) {
                alert('이름과 연락처 입력 및 개인정보 동의를 모두 완료해 주세요.');
                return;
            }
            
            // 성공 모달 활성화
            modalOverlay.classList.add('active');
            
            // 폼 초기화
            contactForm.reset();
            // 등급 카드 초기화 설정
            calcGradeCards.forEach(c => c.classList.remove('active'));
            const defaultGradeCard = document.querySelector('[data-grade="standard"]');
            if (defaultGradeCard) {
                defaultGradeCard.classList.add('active');
                selectedGrade = 'standard';
            }
            // 슬라이더 복원
            calcSizeRange.value = 15;
            calculateEstimate();
        });
    }
    
    // 모달 닫기
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }
    
    // 모달 바깥 영역(블러 배경) 클릭 시 모달 닫기
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }
});
