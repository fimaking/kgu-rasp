import React, { useEffect, useState, useMemo } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
  groupName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinished,
  groupName = '26-ИСбо-4',
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Time-aware greeting
  const greetingData = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Доброе утро, студент!',
        emoji: '☀️',
        message: 'Продуктивного дня и лёгких пар',
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Добрый день, студент!',
        emoji: '🌤️',
        message: 'Успешной учёбы и отличного настроения',
      };
    }
    if (hour >= 17 && hour < 23) {
      return {
        greeting: 'Добрый вечер, студент!',
        emoji: '🌆',
        message: 'Время подвести итоги и отдохнуть',
      };
    }
    return {
      greeting: 'Доброй ночи, студент!',
      emoji: '🌙',
      message: 'Отличного отдыха перед новым учебным днём',
    };
  }, []);

  useEffect(() => {
    // Stage 1: Graceful 3.4s display of greeting and progress
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
    }, 3400);

    // Stage 2: 4000ms total (fade-out completes in 600ms)
    const finishTimer = setTimeout(() => {
      onFinished();
    }, 4000);

    return () => {
      clearTimeout(closeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  // Fast dismiss if user taps screen
  const handleFastDismiss = () => {
    setIsClosing(true);
    setTimeout(onFinished, 250);
  };

  return (
    <div
      onClick={handleFastDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-10 sm:py-14 select-none bg-apple-gray-100 dark:bg-[#121214] transition-all duration-600 ease-out cursor-pointer ${
        isClosing
          ? 'opacity-0 scale-[1.04] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Нажмите в любое место, чтобы пропустить"
    >
      {/* Soft Ambient Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-apple-blue/20 via-indigo-500/15 to-purple-500/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Top Header Label */}
      <div className="w-full flex justify-center pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-apple-gray-400 dark:text-apple-gray-500 font-mono">
          КГУ • Расписание занятий
        </span>
      </div>

      {/* Center Branding, Icon & Time Greeting */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-md w-full animate-splash-spring">
        {/* Floating App Icon */}
        <div className="relative mb-6 animate-splash-float">
          <div className="absolute -inset-2 rounded-3.5xl bg-gradient-to-r from-apple-blue via-apple-indigo to-purple-500 opacity-40 blur-xl transition duration-700 animate-pulse" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-apple-float overflow-hidden p-0.5 bg-gradient-to-b from-white/60 to-white/20 dark:from-white/20 dark:to-white/5 border border-white/40 dark:border-white/10">
            <svg
              className="w-full h-full rounded-2.5xl drop-shadow-md"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#007AFF" />
                  <stop offset="100%" stopColor="#5856D6" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="115" fill="url(#splashGrad)" />
              <path d="M256 120L90 200l166 80 146-70v85h20V195L256 120z" fill="#ffffff" />
              <path
                d="M140 248v90c0 50 52 94 116 94s116-44 116-94v-90l-116 56-116-56z"
                fill="#ffffff"
                opacity="0.95"
              />
            </svg>
          </div>
        </div>

        {/* Dynamic Greeting */}
        <div className="space-y-1.5 animate-splash-greeting">
          <div className="inline-flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-apple-gray-900 dark:text-white">
            <span>{greetingData.greeting}</span>
            <span className="text-2xl sm:text-3xl animate-bounce-short">{greetingData.emoji}</span>
          </div>
          <p className="text-xs sm:text-sm text-apple-gray-500 dark:text-apple-gray-400 font-medium">
            {greetingData.message}
          </p>
        </div>

        {/* Group & Subgroup Badge */}
        <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-black/5 dark:border-white/10 shadow-apple-sm text-xs font-semibold text-apple-gray-700 dark:text-apple-gray-200 backdrop-blur-md">
          <span>{groupName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
          <span>1-я подгруппа</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Немецкий язык</span>
        </div>

        {/* Apple-style Smooth 4s Progress Bar */}
        <div className="mt-8 w-44 sm:w-52 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden shadow-inner p-0.5">
          <div className="h-full bg-gradient-to-r from-apple-blue via-indigo-500 to-purple-500 rounded-full animate-splash-progress-4s" />
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-apple-gray-400 dark:text-apple-gray-500 font-medium tracking-wide">
          Коснитесь экрана для быстрого входа
        </p>
      </div>
    </div>
  );
};
