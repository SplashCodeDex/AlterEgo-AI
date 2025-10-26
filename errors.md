Welcome to Metro v0.83.3
Fast - Scalable - Integrated


INFO  Dev server ready. Press Ctrl+C to exit.
INFO  Key commands available:

r  - reload app(s)
d  - open Dev Menu
j  - open DevTools

BUNDLE  ./index.ts
ERROR  SyntaxError: W:\CodeDeX\AlterEgo-AI\mobile\src\state\AppContext.tsx: Unexpected token (207:12)

205 |         dispatch({ type: 'SET_APP_STATE', payload: 'generating' });
206 |
> 207 |             .filter(style => state.selectedStyles.has(style.caption
|             ^
208 |         const stylesToGenerate = state.currentStyles))
209 |             .map(s => s.caption);
210 |         dispatch({ type: 'SET_ACTIVE_SESSION_STYLES', payload: stylesToGenerate });
