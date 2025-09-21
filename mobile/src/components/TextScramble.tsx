/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

interface TextScrambleProps {
    text: string;
    style?: StyleProp<TextStyle>;
}

const TextScramble: React.FC<TextScrambleProps> = ({ text, style }) => {
    const [displayText, setDisplayText] = useState('');
    const isMounted = useRef(true);
    
    useEffect(() => {
        isMounted.current = true;
        const scramble = async () => {
            const chars = '!<>-_\\/[]{}—=+*^?#________';
            
            // Set initial blank text
            setDisplayText(text.replace(/./g, ' '));
            await new Promise(res => setTimeout(res, 100));

            if (!isMounted.current) return;

            let output = text.split('').map(() => '');

            for (let i = 0; i < text.length; i++) {
                const cycles = 2; 
                for (let j = 0; j < cycles; j++) {
                    let newText = '';
                    for (let k = 0; k < text.length; k++) {
                        if (k < i) {
                            newText += text[k];
                        } else {
                            newText += chars[Math.floor(Math.random() * chars.length)];
                        }
                    }
                     if (!isMounted.current) return;
                    setDisplayText(newText);
                    await new Promise(res => setTimeout(res, 50));
                }
                 if (!isMounted.current) return;
                 output[i] = text[i];
                setDisplayText(output.join(''));
            }
        };
        
        scramble();

        return () => { 
            isMounted.current = false;
        };
    }, [text]);

    return <Text style={style} numberOfLines={1}>{displayText}</Text>;
};

export default TextScramble;