import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="flex flex-col items-center gap-6"
            >
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                y: [0, -6, 0],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                            className="w-2 h-2 rounded-full bg-orange-600"
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
