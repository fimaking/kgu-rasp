import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinished: () => void;
  groupName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinished,
  groupName = '26-ИСбо-4',
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // 650ms smooth display, then start fade out transition
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, 650);

    // 1000ms total: fade out takes 350ms, then unmount
    const finishTimer = setTimeout(() => {
      onFinished();
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  // Click or tap to dismiss immediately
  const handleFastDismiss = () => {
    setIsClosing(true);
    setTimeout(onFinished, 200);
  };

  return (
    <div
      onClick={handleFastDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none bg-apple-gray-100 dark:bg-[#121214] transition-all duration-350 ease-out cursor-pointer ${
        isClosing
          ? 'opacity-0 scale-[1.03] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      title="Нажмите в любое место, чтобы пропустить"
    >
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-apple-blue/20 dark:bg-apple-blue/15 blur-3xl pointer-events-none animate-pulse" />

      {/* Main branding & icon */}
      <div className="relative flex flex-col items-center text-center px-6 animate-splash-spring">
        {/* App Icon */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-apple-blue via-apple-indigo to-purple-600 opacity-40 blur-lg transition duration-500 group-hover:opacity-75" />
          
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-apple-float overflow-hidden p-0.5 bg-gradient-to-b from-white/40 to-white/10 dark:from-white/20 dark:to-white/5 border border-white/20 dark:border-white/10">
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

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-apple-gray-900 dark:text-white">
          КГУ Расписание
        </h1>

        {/* Subtitle Badge */}
        <div className="mt-2.5 flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 text-xs font-semibold text-apple-gray-600 dark:text-apple-gray-300">
          <span>{groupName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
          <span>1-я подгруппа</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Немецкий</span>
        </div>

        {/* Apple-style Smooth Micro Progress Bar */}
        <div className="mt-7 w-32 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-apple-blue to-apple-indigo rounded-full animate-splash-progress" />
        </div>
      </div>
    </div>
  );
};
