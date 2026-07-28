import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

export const JanathaGarageLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightText = false
}) => {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', font: 'text-base', sub: 'text-xs' },
    md: { icon: 'w-10 h-10', font: 'text-xl', sub: 'text-xs' },
    lg: { icon: 'w-16 h-16', font: 'text-2xl', sub: 'text-sm' },
    xl: { icon: 'w-24 h-24', font: 'text-3xl', sub: 'text-base' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex-shrink-0 ${currentSize.icon}`}>
        <img
          src="/logo.svg"
          alt="Janatha Garage Logo"
          className="w-full h-full object-contain filter drop-shadow-sm"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none select-none">
          <span className={`font-black tracking-tight ${currentSize.font} ${lightText ? 'text-white' : 'text-slate-900'}`}>
            Janatha
          </span>
          <span className={`font-extrabold tracking-tight ${currentSize.font} ${lightText ? 'text-slate-200' : 'text-slate-700'}`}>
            Garage
          </span>
        </div>
      )}
    </div>
  );
};
