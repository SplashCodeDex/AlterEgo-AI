/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const SplashScreen = () => {
    return (
        <motion.div
            key="splash"
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
                transition: { duration: 0.5 },
            }}
            className="fixed inset-0 bg-zinc-900 flex items-center justify-center z-[100]"
        >
            <motion.div
                {...{
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1 },
                    transition: { duration: 0.5, delay: 0.2, type: 'spring', stiffness: 120, damping: 10 },
                }}
            >
                <Logo size="large" />
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;