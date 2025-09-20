/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
    size?: 'small' | 'large';
    className?: string;
    bgClass?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'small', className, bgClass = 'bg-zinc-900' }) => {
    const sizeClasses = {
        small: 'h-8 text-xl gap-2.5', // For header
        large: 'h-20 text-5xl sm:text-6xl md:text-7xl gap-4' // For splash/dashboard
    };

    return (
        <div className={cn('flex items-center', sizeClasses[size], className)} aria-label="AlterEgo AI Logo">
            {/* CSS-based logo mark */}
            <div className="relative w-[1em] h-[1em] flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-90 logo-gradient-animate"></div>
                <div className={cn("absolute inset-[15%] rounded-full", bgClass)}></div>
                <div className="absolute w-[25%] h-[25%] bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <span className="font-sora font-bold text-neutral-100 tracking-tighter">
                AlterEgo AI
            </span>
        </div>
    );
};

export default Logo;