import React, { useReducer, useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
// Browser-compatible extraction engine - HACS 5.0 compliant
import { BrowserExtractionEngine } from './src/extraction/BrowserExtractionEngine';
import { GoogleGenAI } from "@google/genai";
import {
    ReconResult, PilferResult, RefactorResult, ComparativeResult, BlueprintResult,
    UnitTestResult, LiveResult, AppState, AuditType, FrameworkTarget,
    StylingTarget, StateTarget, Persona, AppAction, Chat, ColorInfo,
    SessionWorkspace, HistoricalSession, ExportFormat
} from './types';
import {
    ReconCard, ResultCard, RefactorResultCard, ComparativeResultCard, BlueprintResultCard,
    StreamingResultCard, HistoryPanel, CommandPalette, SettingsPanel, SafehouseModal
} from './components';
import { retryWithBackoff } from './src/utils/retry';
import { PilferError, useErrorHandler } from './src/hooks/useErrorHandler';
import { ExportService } from './src/services/ExportService';
import { checkRelayHealth, requestRelayExtraction } from './src/utils/relay';


// --- HELPERS ---
function extractAndParseJson<T>(text: string): T {
    const jsonStart = text.indexOf('{');
    const arrayStart = text.indexOf('[');
    
    let startIndex = -1;
    if (jsonStart !== -1 && arrayStart !== -1) {
        startIndex = Math.min(jsonStart, arrayStart);
    } else if (jsonStart !== -1) {
        startIndex = jsonStart;
    } else {
        startIndex = arrayStart;
    }

    if (startIndex === -1) {
        console.warn("No JSON object or array found in text, returning as is.", text);
        return {} as T; 
    }

    const jsonEnd = text.lastIndexOf('}');
    const arrayEnd = text.lastIndexOf(']');
    const endIndex = Math.max(jsonEnd, arrayEnd);

    if (endIndex === -1) {
         console.warn("Incomplete JSON object or array, returning as is.", text);
         return {} as T;
    }
    
    const jsonString = text.substring(startIndex, endIndex + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse extracted JSON string:", jsonString);
        throw new Error("The AI response was not in a valid JSON format, even after extraction.");
    }
}
// --- AI & API CONFIG ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });

// Model configuration with intelligent token limits
const MODEL_CONFIG = {
    fast: 'gemini-2.5-flash',  // For quick operations and iterative refinements
    pro: 'gemini-2.5-pro',      // For complex analysis and high-quality output
    tokenLimits: {
        recon: 8192,        // Increased for comprehensive recon
        heist: 16384,       // Increased for full component code extraction
        refactor: 16384,    // Increased for robust refactoring
        blueprint: 4096,    // Diagrams need moderate space
        compare: 8192,      // Comparative analysis needs context
        unitTest: 8192,     // Test suites can be long
        plan: 4096          // Planning needs detail
    }
};

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    initialDelay: 1000,  // 1 second
    maxDelay: 10000,     // 10 seconds
    backoffFactor: 2
};

const reconSchema = {
    type: 'object' as const,
    properties: {
        colorPalette: { type: 'array' as const, items: { type: 'object' as const, properties: { hex: { type: 'string' }, name: { type: 'string' } } } },
        typography: { type: 'array' as const, items: { type: 'object' as const, properties: { fontFamily: { type: 'string' }, usage: { type: 'string' } } } },
        coreStyles: { type: 'array' as const, items: { type: 'object' as const, properties: { name: { type: 'string' }, code: { type: 'string' } } } },
        pageArchitecture: {
            type: 'string' as const,
            description: "A stringified JSON array representing a nested tree of identified page components. Each node in the tree should be an object with a 'name' (string) and an optional 'children' (array of nodes) property."
        }
    }
};
// Schemas for other operations...
const pilferSchema = { type: 'object' as const, properties: { name: { type: 'string' as const }, techStack: { type: 'array' as const, items: { type: 'string' as const } }, architecturalNotes: { type: 'string' as const }, code: { type: 'string' as const }, rationale: { type: 'string' as const }, tags: { type: 'array' as const, items: { type: 'string' as const } } } };
const refactorSchema = { type: 'object' as const, properties: { name: { type: 'string' as const }, explanation: { type: 'string' as const }, refactoredCode: { type: 'string' as const }, tags: { type: 'array' as const, items: { type: 'string' as const } } } };
const comparativeSchema = { type: 'object' as const, properties: { summary: { type: 'string' as const }, subject1: { type: 'object' as const, properties: { title: { type: 'string' as const }, notes: { type: 'string' as const } } }, subject2: { type: 'object' as const, properties: { title: { type: 'string' as const }, notes: { type: 'string' as const } } } } };
const blueprintSchema = { type: 'object' as const, properties: { name: { type: 'string' as const }, explanation: { type: 'string' as const }, diagram: { type: 'string' as const, description: "A Mermaid.js graph syntax string for a flowchart (graph TD)." }, tags: { type: 'array' as const, items: { type: 'string' as const } } } };
const unitTestSchema = { type: 'object' as const, properties: { testFramework: { type: 'string' as const }, tests: { type: 'string' as const }, explanation: { type: 'string' as const } } };


// --- STATE MANAGEMENT (useReducer) ---
const createInitialSession = (url: string = ''): SessionWorkspace => ({
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    url,
    activeResults: []
});

const initialState: AppState = {
    appState: 'IDLE',
    url: '',
    reconResult: null,
    deepDiveResults: {},
    comparativeResults: {},
    refactorResults: {},
    blueprintResults: {},
    sessionHistory: [],
    theme: 'default',
    fontSize: 16,
    layout: 'default',
    directive: '',
    pageSource: '',
    code: '',
    apiDocs: '',
    compareCode1: '',
    compareCode2: '',
    compareDirective: '',
    analysisMode: 'single',
    auditType: 'heist',
    frameworkTarget: 'auto',
    stylingTarget: 'tailwind',
    stateTarget: 'hooks',
    persona: 'professor',
    useCoT: true, // Chain of Thought toggle
    error: null,
    chat: null,
    chatHistory: [],
    isHistoryOpen: false,
    isCommandPaletteOpen: false,
    isSettingsOpen: false,
    safehouseState: { isOpen: false, component: null },
    liveResult: null,
    heistPlan: null,
    // Session Management
    currentSession: createInitialSession(),
    historicalSessions: [],
    showOnlyCurrentSession: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.payload.field]: action.payload.value };
        case 'SET_APP_STATE':
            return { ...state, appState: action.payload };
        case 'SET_CHAT':
            return { ...state, chat: action.payload };
        case 'LOAD_SESSION':
            return { ...state, ...action.payload };
        case 'STREAM_START':
            return { ...state, appState: 'HEISTING', error: null, liveResult: { ...action.payload, content: '' } };
        case 'STREAM_UPDATE':
            return state.liveResult ? { ...state, liveResult: { ...state.liveResult, content: action.payload } } : state;
        case 'STREAM_END':
            return { ...state, liveResult: null, appState: 'IDLE' };
        case 'SET_RECON_RESULT':
            return { ...state, reconResult: action.payload };
        case 'ADD_RESULT':
            const { id, type, result } = action.payload;
            // Check if this ID already exists in history to avoid duplicates
            const existingEntry = state.sessionHistory.find(entry => entry.id === id);
            if (existingEntry) {
                // Update existing results without adding duplicate history entry
                switch (type) {
                    case 'heist': return { ...state, deepDiveResults: { ...state.deepDiveResults, [id]: result } };
                    case 'refactor': return { ...state, refactorResults: { ...state.refactorResults, [id]: result } };
                    case 'blueprint': return { ...state, blueprintResults: { ...state.blueprintResults, [id]: result } };
                    case 'Compare': return { ...state, comparativeResults: { ...state.comparativeResults, [id]: result } };
                    default: return state;
                }
            }
            const newHistoryEntry = { 
                id, 
                type, 
                title: result.name || `Compare: ${state.compareDirective.substring(0,20)}...`,
                timestamp: Date.now(),
                url: state.url
            };
            const newHistory = [...state.sessionHistory, newHistoryEntry];
            const updatedCurrentSession = {
                ...state.currentSession,
                activeResults: [...state.currentSession.activeResults, newHistoryEntry],
                lastActivity: Date.now(),
                url: state.url || state.currentSession.url
            };
            switch (type) {
                case 'heist': return { ...state, sessionHistory: newHistory, currentSession: updatedCurrentSession, deepDiveResults: { ...state.deepDiveResults, [id]: result } };
                case 'refactor': return { ...state, sessionHistory: newHistory, currentSession: updatedCurrentSession, refactorResults: { ...state.refactorResults, [id]: result } };
                case 'blueprint': return { ...state, sessionHistory: newHistory, currentSession: updatedCurrentSession, blueprintResults: { ...state.blueprintResults, [id]: result } };
                case 'Compare': return { ...state, sessionHistory: newHistory, currentSession: updatedCurrentSession, comparativeResults: { ...state.comparativeResults, [id]: result } };
                default: return state;
            }
        case 'ADD_HISTORY_ENTRY': {
            const entryWithTimestamp = { ...action.payload, timestamp: Date.now(), url: state.url };
            const updatedCurrentSession = {
                ...state.currentSession,
                activeResults: [...state.currentSession.activeResults, entryWithTimestamp],
                lastActivity: Date.now(),
                url: state.url || state.currentSession.url
            };
            return { ...state, sessionHistory: [...state.sessionHistory, entryWithTimestamp], currentSession: updatedCurrentSession };
        }
        case 'SET_ERROR':
            return { ...state, error: action.payload, appState: 'IDLE' };
        case 'TOGGLE_PANEL':
            switch(action.payload.panel) {
                case 'history': return { ...state, isHistoryOpen: action.payload.isOpen };
                case 'command': return { ...state, isCommandPaletteOpen: action.payload.isOpen };
                case 'settings': return { ...state, isSettingsOpen: action.payload.isOpen };
            }
        case 'OPEN_SAFEHOUSE':
            return { ...state, safehouseState: { isOpen: true, component: action.payload } };
        case 'CLOSE_SAFEHOUSE':
            return { ...state, safehouseState: { isOpen: false, component: null } };
        case 'RESET_SESSION':
            return { ...initialState };
        case 'SET_HEIST_PLAN':
            return { ...state, heistPlan: action.payload };
        case 'CLEAR_HEIST_PLAN':
            return { ...state, heistPlan: null, appState: 'IDLE' };
        // Session Management Cases
        case 'START_NEW_SESSION': {
            const newUrl = action.payload?.url || state.url;
            // Archive current session if it has any results
            const hasResults = state.currentSession.activeResults.length > 0;
            const historicalSessions = hasResults ? [
                ...state.historicalSessions,
                {
                    ...state.currentSession,
                    reconResult: state.reconResult,
                    deepDiveResults: state.deepDiveResults,
                    comparativeResults: state.comparativeResults,
                    refactorResults: state.refactorResults,
                    blueprintResults: state.blueprintResults,
                }
            ] : state.historicalSessions;
            
            return {
                ...state,
                currentSession: createInitialSession(newUrl),
                historicalSessions,
                url: newUrl,
                reconResult: null,
                deepDiveResults: {},
                comparativeResults: {},
                refactorResults: {},
                blueprintResults: {},
                sessionHistory: [],
                error: null,
                directive: '',
                code: '',
            };
        }
        case 'CLEAR_CURRENT_SESSION':
            return {
                ...state,
                currentSession: {
                    ...state.currentSession,
                    activeResults: [],
                    lastActivity: Date.now()
                },
                reconResult: null,
                deepDiveResults: {},
                comparativeResults: {},
                refactorResults: {},
                blueprintResults: {},
                sessionHistory: [],
                error: null,
            };
        case 'ARCHIVE_CURRENT_SESSION': {
            if (state.currentSession.activeResults.length === 0) return state;
            const archivedSession: HistoricalSession = {
                ...state.currentSession,
                reconResult: state.reconResult,
                deepDiveResults: state.deepDiveResults,
                comparativeResults: state.comparativeResults,
                refactorResults: state.refactorResults,
                blueprintResults: state.blueprintResults,
            };
            return {
                ...state,
                historicalSessions: [...state.historicalSessions, archivedSession],
                currentSession: createInitialSession(),
                reconResult: null,
                deepDiveResults: {},
                comparativeResults: {},
                refactorResults: {},
                blueprintResults: {},
                sessionHistory: [],
            };
        }
        case 'RESTORE_HISTORICAL_SESSION': {
            const sessionToRestore = state.historicalSessions.find(s => s.sessionId === action.payload);
            if (!sessionToRestore) return state;
            
            // Archive current session if it has results
            const hasResults = state.currentSession.activeResults.length > 0;
            const updatedHistorical = hasResults ? [
                ...state.historicalSessions.filter(s => s.sessionId !== action.payload),
                {
                    ...state.currentSession,
                    reconResult: state.reconResult,
                    deepDiveResults: state.deepDiveResults,
                    comparativeResults: state.comparativeResults,
                    refactorResults: state.refactorResults,
                    blueprintResults: state.blueprintResults,
                }
            ] : state.historicalSessions.filter(s => s.sessionId !== action.payload);
            
            return {
                ...state,
                currentSession: {
                    sessionId: sessionToRestore.sessionId,
                    createdAt: sessionToRestore.createdAt,
                    lastActivity: Date.now(),
                    url: sessionToRestore.url,
                    activeResults: sessionToRestore.activeResults
                },
                historicalSessions: updatedHistorical,
                url: sessionToRestore.url,
                reconResult: sessionToRestore.reconResult,
                deepDiveResults: sessionToRestore.deepDiveResults,
                comparativeResults: sessionToRestore.comparativeResults,
                refactorResults: sessionToRestore.refactorResults,
                blueprintResults: sessionToRestore.blueprintResults,
                sessionHistory: sessionToRestore.activeResults,
            };
        }
        case 'TOGGLE_SESSION_VIEW':
            return { ...state, showOnlyCurrentSession: !state.showOnlyCurrentSession };
        case 'DELETE_HISTORICAL_SESSION':
            return {
                ...state,
                historicalSessions: state.historicalSessions.filter(s => s.sessionId !== action.payload)
            };
        default:
            return state;
    }
}

// --- ASYNC HELPERS ---


async function streamAndProcess<T>(
    prompt: string,
    config: any,
    type: LiveResult['type'],
    title: string,
    chat: Chat,
    dispatch: React.Dispatch<AppAction>,
    onError: (error: unknown, severity?: PilferError['severity']) => void,
    useProModel: boolean = false
): Promise<(T & { id: string }) | null> {
    // Generate more unique ID with timestamp and random component to prevent duplicates
    const resultId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({ type: 'STREAM_START', payload: { id: resultId, type, title } });
    
    try {
        // Set appropriate token limit based on operation type
        const tokenLimit = MODEL_CONFIG.tokenLimits[type.toLowerCase() as keyof typeof MODEL_CONFIG.tokenLimits] || 4096;
        const enhancedConfig = {
            ...config,
            maxOutputTokens: tokenLimit,
            temperature: type === 'heist' || type === 'refactor' ? 0.3 : 0.5, // Lower temp for code generation
            topP: 0.95,
            topK: 40
        };
        
        const streamOperation = async () => {
            const stream = await chat.sendMessageStream({ message: prompt, config: enhancedConfig });
            let accumulatedText = "";
            for await (const chunk of stream) {
                // Handle undefined text gracefully
                if (chunk.text) {
                    accumulatedText += chunk.text;
                    dispatch({ type: 'STREAM_UPDATE', payload: accumulatedText });
                }
            }
            return accumulatedText;
        };
        
        const accumulatedText = await retryWithBackoff(streamOperation);
        
        const newHistory = await chat.getHistory();
        dispatch({ type: 'SET_FIELD', payload: { field: 'chatHistory', value: newHistory }});

        const parsedResult = extractAndParseJson<T>(accumulatedText);
        
        if(type !== 'Recon') { // Recon has its own history/result update logic
            const historyEntry = { id: resultId, type, title, timestamp: Date.now(), url: '' };
            dispatch({ type: 'ADD_HISTORY_ENTRY', payload: historyEntry });
        }
        
        return { ...parsedResult, id: resultId };

    } catch (e: any) {
        console.error('AI Operation Failed:', e);
        onError(e);
        return null;
    } finally {
        dispatch({ type: 'STREAM_END' });
    }
}

// --- APP COMPONENT ---
function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const {
        appState, url, reconResult, deepDiveResults, comparativeResults, refactorResults, blueprintResults,
        sessionHistory, theme, fontSize, layout, directive, pageSource, code, apiDocs, compareCode1, compareCode2,
        compareDirective, analysisMode, auditType, frameworkTarget, stylingTarget, stateTarget, persona,
        error, chat, isHistoryOpen, isCommandPaletteOpen, isSettingsOpen, safehouseState, liveResult, heistPlan,
        currentSession, historicalSessions, showOnlyCurrentSession, useCoT
    } = state;

    const { error: hookError, handleError, clearError } = useErrorHandler();
    const [planRefinement, setPlanRefinement] = useState('');

    // --- EFFECTS ---
    useEffect(() => {
        try {
            const savedSession = localStorage.getItem('pilferSession');
            if (savedSession) {
                const parsed = JSON.parse(savedSession);
                dispatch({ type: 'LOAD_SESSION', payload: parsed });
            }
        } catch (e) {
            console.error("Failed to parse saved session", e);
            localStorage.removeItem('pilferSession');
        }
    }, []);

    useEffect(() => {
        const persistableState = {
            url, reconResult, deepDiveResults, comparativeResults, refactorResults,
            blueprintResults, sessionHistory, theme, fontSize, layout,
            chatHistory: state.chatHistory,
            currentSession, historicalSessions,
        };
        localStorage.setItem('pilferSession', JSON.stringify(persistableState));
    }, [url, reconResult, deepDiveResults, comparativeResults, refactorResults, blueprintResults, sessionHistory, theme, fontSize, layout, state.chatHistory, currentSession, historicalSessions]);

    useEffect(() => {
        if (!chat) {
            // Use gemini-2.5-flash as default for chat, can switch to pro for complex operations
            const newChat = ai.chats.create({ 
                model: MODEL_CONFIG.fast, 
                history: state.chatHistory || [],
                config: {
                    temperature: 0.5,
                    topP: 0.95,
                    topK: 40
                }
            });
            dispatch({ type: 'SET_CHAT', payload: newChat });
        }
    }, [chat, state.chatHistory]);
    
     useEffect(() => {
        document.body.dataset.theme = theme;
        document.body.dataset.layout = layout;
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [theme, fontSize, layout]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'command', isOpen: !isCommandPaletteOpen }});
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen]);







    // --- HANDLERS ---
    const setField = (field: keyof AppState, value: any) => dispatch({ type: 'SET_FIELD', payload: { field, value } });

    const handleCommand = (cmd: string) => {
        switch (cmd) {
            case 'run_heist': analysisMode === 'single' && handleDeepDive(); break;
            case 'run_compare': analysisMode === 'compare' && handleCompare(); break;
            case 'toggle_mode': setField('analysisMode', analysisMode === 'single' ? 'compare' : 'single'); break;
            case 'export': handleExportMarkdown(); break;
            case 'reset': handleResetSession(); break;
        }
        dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'command', isOpen: false } });
    };

    const handleQuickHeist = (tech: string) => {
        const newDirective = `Based on your knowledge of ${url || 'the target site'}, deconstruct another interesting component that uses ${tech}.`;
        setField('directive', newDirective);
        document.getElementById('directive')?.focus();
    };
    
    const handleComponentSelect = (componentName: string) => {
        setField('directive', `Deconstruct the "${componentName}" component from the target.`);
        document.getElementById('directive')?.focus();
    }
    
    const handleApplyTheme = (palette: ColorInfo[]) => {
        // Apply the extracted color palette to the Pilfer UI
        const root = document.documentElement;
        if (palette.length >= 4) {
            // Map extracted colors to CSS variables
            root.style.setProperty('--accent-cyan', palette[0].hex);
            root.style.setProperty('--accent-magenta', palette[1].hex);
            root.style.setProperty('--accent-green', palette[2].hex);
            root.style.setProperty('--accent-yellow', palette[3].hex);
            
            // If there are more colors, use them for other elements
            if (palette.length >= 5) {
                root.style.setProperty('--primary-text', palette[4].hex);
            }
            if (palette.length >= 6) {
                root.style.setProperty('--background-color', palette[5].hex);
            }
        }
    }
    
    const getPersonaInstruction = () => ({
        ghost: "You are 'The Ghost'. Stealthy, precise, and minimal. Your code is highly optimized, modern, and stripped of anything unnecessary. You prefer functional patterns and immutable state. Do not explain unless asked, just deliver the raw, efficient code.",
        professor: "You are 'The Professor'. You are here to educate. Every architectural choice you make must be explained. Use detailed comments to break down complex logic. Focus on best practices, design patterns, and the 'why' behind the code. Your output should be a masterclass in software engineering.",
        cleaner: "You are 'The Cleaner'. You fix messes. Your code is robust, production-ready, and defensive. You prioritize error handling, type safety (TypeScript), and performance. You meticulously document edge cases and use industry-standard practices. No shortcuts.",
    })[persona];

    // Maps a detected framework string from the extraction engine to a known FrameworkTarget
    const resolveFrameworkTarget = (detected: string | undefined): FrameworkTarget | null => {
        if (!detected) return null;
        const map: Record<string, FrameworkTarget> = {
            next: 'next', remix: 'remix', react: 'react',
            nuxt: 'nuxt', vue: 'vue',
            svelte: 'svelte', angular: 'angular',
            astro: 'astro', alpine: 'alpine', htmx: 'htmx',
            vanilla: 'plain_js', 'plain_js': 'plain_js', 'plain-js': 'plain_js',
        };
        return map[detected.toLowerCase()] ?? null;
    };

    const handleRecon = async () => {
        if (!chat) return;
        dispatch({ type: 'SET_APP_STATE', payload: 'CASING' });

        const useRealExtraction = localStorage.getItem('pilferUseRealExtraction') === 'true';

        // --- PATH A: Page source provided by user (always valid — real HTML) ---
        if (pageSource) {
            const prompt = `You are Pilfer's reconnaissance analyst. The user has provided raw HTML source from "${url || 'a target page'}". Your task is to extract the real design system from this actual HTML.

**Persona:** ${getPersonaInstruction()}

**Raw HTML Source:**
\`\`\`html
${pageSource.slice(0, 40000)}
\`\`\`

Analyze the HTML above and extract the REAL values — do not invent or guess anything not present in the code above.
Return a single JSON object with:
- colorPalette: real hex values found in inline styles, CSS vars, or class names
- typography: real font-family declarations found in the HTML/style tags
- coreStyles: real CSS rule blocks extracted verbatim from <style> tags
- pageArchitecture: a stringified JSON array representing the actual DOM component hierarchy as node objects with 'name' and optional 'children'`;

            const result = await streamAndProcess<any>(prompt, { responseMimeType: 'application/json', responseSchema: reconSchema }, 'Recon', `Recon (Source): ${url || 'pasted HTML'}`, chat, dispatch, handleError);
            if (result) {
                let pageArchitecture = [];
                try {
                    pageArchitecture = JSON.parse(result.pageArchitecture || '[]');
                } catch {
                    console.warn('[Pilfer] pageArchitecture was not valid JSON, defaulting to empty tree.');
                }
                const parsedResult: ReconResult = { ...result, pageArchitecture };
                dispatch({ type: 'ADD_HISTORY_ENTRY', payload: { id: result.id, type: 'Recon', title: `Recon (Source): ${url || 'pasted HTML'}`, timestamp: Date.now(), url } });
                dispatch({ type: 'SET_RECON_RESULT', payload: parsedResult });
            }
            return;
        }

        // --- PATH B: Real extraction via Relay (Puppeteer) or Browser Engine ---
        if (useRealExtraction && url) {
            let extractionSucceeded = false;

            // Tier 1: Puppeteer relay server
            const relayAvailable = await checkRelayHealth();
            if (relayAvailable) {
                try {
                    console.log('[Pilfer] 🟢 Relay online — delegating to Puppeteer...');
                    const response = await requestRelayExtraction({
                        url,
                        options: { timeout: 60000, extractAssets: true },
                        context: { persona, targetFramework: frameworkTarget },
                    });
                    if (response.ok) {
                        const relayResult = await response.json();
                        if (relayResult?.success && relayResult.reconResult) {
                            console.log('[Pilfer] ✅ Relay extraction succeeded.', relayResult);
                            dispatch({ type: 'ADD_HISTORY_ENTRY', payload: { id: relayResult.reconResult.id, type: 'Recon', title: `Recon (Puppeteer): ${url}`, timestamp: Date.now(), url } });
                            dispatch({ type: 'SET_RECON_RESULT', payload: relayResult.reconResult });
                            if (frameworkTarget === 'auto') {
                                const resolved = resolveFrameworkTarget(relayResult.reconResult.detectedFramework);
                                if (resolved) dispatch({ type: 'SET_FIELD', payload: { field: 'frameworkTarget', value: resolved } });
                            }
                            dispatch({ type: 'SET_APP_STATE', payload: 'IDLE' });
                            extractionSucceeded = true;
                        }
                    }
                } catch (relayError) {
                    console.warn('[Pilfer] ⚠️ Relay failed after health check passed:', relayError);
                }
            } else {
                console.log('[Pilfer] 🔴 Relay offline — trying browser engine...');
            }

            // Tier 2: Browser engine (CORS proxy cascade) — best for static/SSR sites
            if (!extractionSucceeded) {
                try {
                    console.log('[Pilfer] Initiating browser-based extraction...');
                    const browserEngine = new BrowserExtractionEngine();
                    const extractionRequest = {
                        url,
                        sessionId: `session-${Date.now()}`,
                        requestId: `req-${Date.now()}`,
                        mode: 'balanced' as const,
                        options: {
                            preferredEngine: 'real' as const,
                            fallbackEngines: [],
                            timeout: 30000,
                            enableJavaScript: false,
                            captureScreenshots: false,
                            analyzePerformance: false,
                            extractAssets: true,
                            generateInsights: false,
                            analysisDepth: 'moderate' as const,
                            confidenceThreshold: 0.5,
                            enableCaching: true,
                            cacheStrategy: 'conservative' as const,
                        },
                        context: {
                            persona,
                            targetFramework: frameworkTarget,
                            targetStyling: stylingTarget,
                            previousExtractions: [],
                            userInsights: [],
                            aiEnhancementLevel: 'basic' as const,
                        },
                        onProgress: (progress: any) => console.log(`[Pilfer] Browser engine: ${progress.phase} (${progress.percentage}%)`),
                        onError: (error: any) => console.warn('[Pilfer] Browser engine error:', error),
                    };
                    const extractionPromise = browserEngine.extract(extractionRequest);
                    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Extraction timed out after 35s')), 35000));
                    const extractionResult: any = await Promise.race([extractionPromise, timeoutPromise]);

                    if (extractionResult?.success && extractionResult.reconResult) {
                        console.log('[Pilfer] ✅ Browser extraction succeeded.', extractionResult);
                        const warningNote = extractionResult.confidence < 0.5
                            ? ' ⚠️ Low confidence — site may be a JavaScript SPA. Consider using the relay server for full accuracy.'
                            : '';
                        dispatch({ type: 'ADD_HISTORY_ENTRY', payload: { id: extractionResult.reconResult.id, type: 'Recon', title: `Recon (Browser): ${url}`, timestamp: Date.now(), url } });
                        dispatch({ type: 'SET_RECON_RESULT', payload: extractionResult.reconResult });
                        if (frameworkTarget === 'auto') {
                            const resolved = resolveFrameworkTarget(extractionResult.reconResult.detectedFramework);
                            if (resolved) dispatch({ type: 'SET_FIELD', payload: { field: 'frameworkTarget', value: resolved } });
                        }
                        if (warningNote) dispatch({ type: 'SET_ERROR', payload: warningNote });
                        dispatch({ type: 'SET_APP_STATE', payload: 'IDLE' });
                        extractionSucceeded = true;
                    }
                } catch (browserError: any) {
                    console.warn('[Pilfer] ⚠️ Browser extraction failed:', browserError?.message);
                }
            }

            // Tier 3: Both tiers failed — honest error, no silent fallback to hallucination
            if (!extractionSucceeded) {
                dispatch({
                    type: 'SET_ERROR',
                    payload: `Extraction failed for "${url}". ` +
                        `This site may block CORS requests or require JavaScript to render. ` +
                        `For full accuracy: run the relay server (npm run relay), or paste the page HTML manually into the Page Source field.`,
                });
            }
            return;
        }

        // --- PATH C: No real extraction, no page source — guide the user ---
        dispatch({
            type: 'SET_ERROR',
            payload: `Pilfer needs real data to work. Enable "Real Web Scraping" in Settings to activate live extraction, or paste the target page's HTML into the Page Source field for analysis.`,
        });
    };

    const handlePlanHeist = async () => {
        if (!chat) return;
        dispatch({ type: 'SET_APP_STATE', payload: 'PLANNING_HEIST' });

        // Build real extraction context block — this is the ground truth the AI works from
        const hasRealData = !!reconResult;
        const extractionContext = hasRealData ? `
## EXTRACTED SITE DATA (Ground Truth — Do Not Invent Values)
The following data was extracted directly from "${url}" via live web scraping.
Use these values verbatim in your reconstruction. Do not substitute or guess.

### Color Palette (extracted)
${reconResult!.colorPalette.map(c => `- ${c.name}: ${c.hex}`).join('\n')}

### Typography (extracted)
${reconResult!.typography.map(t => `- ${t.fontFamily} — used for: ${t.usage}`).join('\n')}

### Core CSS Rules (extracted)
${reconResult!.coreStyles.map(s => `**${s.name}:**\n\`\`\`css\n${s.code}\n\`\`\``).join('\n')}

### Page Component Architecture (extracted)
${JSON.stringify(reconResult!.pageArchitecture, null, 2)}
` : `
## NO EXTRACTION DATA
Reconnaissance has not been performed yet. Run "Case The Joint" first to extract real data before planning a heist.
`;

        const prompt = `You are planning a component reconstruction heist. Your job is to outline exactly how to rebuild the requested component using ONLY the real extracted data below.

**Persona:** ${getPersonaInstruction()}
${useCoT ? '\n**Reasoning:** Think step by step — 1) identify which extracted values apply to this component, 2) decide the implementation strategy, 3) list any dependencies needed.\n' : ''}
**Target URL:** ${url || 'N/A'}
**Component Requested:** ${directive}
**Output Framework:** ${frameworkTarget}
**Styling Approach:** ${stylingTarget}
**State Management:** ${stateTarget}
**User Notes:** ${planRefinement || 'None'}

${extractionContext}

Write a concise implementation plan (not code). State which extracted colors, fonts, and CSS patterns map to this component. Name the exact values you will use. The main component must be named \`PilferedComponent\`.`;

        try {
            const response = await chat.sendMessage({ message: prompt });
            const planText = response.text || 'Unable to generate plan. Please try again.';
            dispatch({ type: 'SET_HEIST_PLAN', payload: { plan: planText, isAwaitingConfirmation: true } });
            dispatch({ type: 'SET_APP_STATE', payload: 'AWAITING_CONFIRMATION' });
            const newHistory = await chat.getHistory();
            dispatch({ type: 'SET_FIELD', payload: { field: 'chatHistory', value: newHistory } });
        } catch (e: any) {
            console.error(e);
            dispatch({ type: 'SET_ERROR', payload: `Planning Failed: ${e.message}` });
            dispatch({ type: 'SET_APP_STATE', payload: 'IDLE' });
        }
    };
    
    const handleExecuteHeist = async () => {
        if (!chat) return;

        const title = `Heist: ${directive.substring(0, 30)}...`;
        const userMessage = planRefinement || "Proceed with the plan as written.";
        const executionPrompt = `${userMessage}

${useCoT ? '**Implementation Notes:** Briefly explain key decisions before the code block.\n' : ''}
Execute the reconstruction plan and return the final component code as a single JSON object matching the required schema.

CRITICAL RULES:
1. The main exported component MUST be named exactly \`PilferedComponent\` — no other name.
2. Use ONLY the extracted color values, font families, and CSS patterns from the plan above. Do not invent values.
3. All styles must be self-contained: inline styles, a <style> block inside the component, or Tailwind classes. No external CSS file imports.
4. Do not import from external libraries beyond React itself. If you need icons, use inline SVG. If you need animations, use CSS keyframes.
5. The component must be renderable in isolation with zero dependencies beyond React.`;

        const result = await streamAndProcess<PilferResult>(executionPrompt, { responseMimeType: 'application/json', responseSchema: pilferSchema }, 'heist', title, chat, dispatch, handleError);
        
        if (result) {
            dispatch({ type: 'ADD_RESULT', payload: { id: result.id, type: 'heist', result } });
        }
        dispatch({ type: 'CLEAR_HEIST_PLAN' });
        setPlanRefinement('');
    };


    const handleDeepDive = async () => {
        if (!chat) return;
        let currentAuditType = (auditType === 'heist' && code) ? 'refactor' : auditType;
        if (currentAuditType === 'refactor') setField('auditType', 'refactor');
        
        switch (currentAuditType) {
            case 'heist':
                // Check if we have real extraction data to enhance the plan
                if (reconResult && reconResult.pageArchitecture) {
                    console.log('[Deep Dive] Enhancing heist plan with real extraction data');
                    // We don't change the call, but handlePlanHeist should use reconResult which is already in scope
                }
                await handlePlanHeist();
                break;
            case 'refactor': {
                const title = `Refactor: ${directive.substring(0, 30)}...`;
                const prompt = `You are an expert code reviewer...
                **Persona:** ${getPersonaInstruction()}
                ${useCoT ? "**Analysis:** First, analyze the existing code logic. Second, identify areas for improvement. Third, apply the refactoring patterns." : ""}
                **Code to Refactor:** \`\`\`${code}\`\`\`
                **Refactoring Directive:** ${directive}
                ${apiDocs ? `**Contextual Documentation:**\n\`\`\`\n${apiDocs}\n\`\`\`` : ''}
                **Deliverables:** Return a single JSON object with the refactored code and a clear explanation...`;
                const result = await streamAndProcess<any>(prompt, { responseMimeType: 'application/json', responseSchema: refactorSchema }, currentAuditType, title, chat, dispatch, handleError);
                if (result) {
                    dispatch({ type: 'ADD_RESULT', payload: { id: result.id, type: currentAuditType, result } });
                }
                break;
            }
            case 'blueprint': {
                const title = `Blueprint: ${directive.substring(0, 30)}...`;
                const prompt = `You are a software architect...
                **Persona:** ${getPersonaInstruction()}
                ${useCoT ? "**Thought Process:** Step 1: Identify system components. Step 2: Define relationships. Step 3: Structure the diagram." : ""}
                **Architectural Objective:** ${directive}
                 ${apiDocs ? `**Contextual Documentation:**\n\`\`\`\n${apiDocs}\n\`\`\`` : ''}
                **Deliverables:** Return a single JSON object... a 'diagram' field containing ONLY the Mermaid.js graph syntax...`;
                const result = await streamAndProcess<any>(prompt, { responseMimeType: 'application/json', responseSchema: blueprintSchema }, currentAuditType, title, chat, dispatch, handleError);
                if (result) {
                    dispatch({ type: 'ADD_RESULT', payload: { id: result.id, type: currentAuditType, result } });
                }
                break;
            }
            default:
                dispatch({ type: 'SET_ERROR', payload: `Audit type '${currentAuditType}' is not implemented.` });
                return;
        }
    };
    
    const handleCompare = async () => {
        if (!chat) return;
        const title = `Compare: ${compareDirective.substring(0, 30)}...`;
        const prompt = `You are a principal engineer specializing in comparative code analysis...
        **Persona:** ${getPersonaInstruction()}
        ${useCoT ? "**Methdology:** 1. Analyze Subject 1. 2. Analyze Subject 2. 3. Identify commonalities and critical differences. 4. Synthesize conclusion." : ""}
        **Comparison Directive:** ${compareDirective}
        **Subject 1:**\n\`\`\`\n${compareCode1}\n\`\`\`
        **Subject 2:**\n\`\`\`\n${compareCode2}\n\`\`\`
        **Deliverables:** Return a single JSON object.`;
        
        const result = await streamAndProcess<ComparativeResult>(prompt, { responseMimeType: 'application/json', responseSchema: comparativeSchema }, 'Compare', title, chat, dispatch, handleError);
        if (result) {
            dispatch({ type: 'ADD_RESULT', payload: { id: result.id, type: 'Compare', result } });
        }
    };

    const handleGenerateTests = async (codeToTest: string): Promise<UnitTestResult | null> => {
        const prompt = `You are a testing expert. Analyze the provided component code and generate a suite of unit tests using Jest and React Testing Library...
        **Component Code:** \`\`\`${codeToTest}\`\`\`
        **Deliverables:** Return a single JSON object...`;
        
        const generateOperation = async () => {
            const response = await ai.models.generateContent({ 
                model: MODEL_CONFIG.fast, 
                contents: prompt, 
                config: { 
                    responseMimeType: 'application/json', 
                    responseSchema: unitTestSchema,
                    maxOutputTokens: MODEL_CONFIG.tokenLimits.unitTest,
                    temperature: 0.3,
                    topP: 0.95,
                    topK: 40
                }
            });
            return response;
        };
        
        try {
            const response = await retryWithBackoff(generateOperation);
            return extractAndParseJson<UnitTestResult>(response.text || '');
        } catch (e: any) {
            console.error('Test generation failed:', e);
            let errorMessage = 'Failed to generate tests: ';
            if (e.message?.includes('429')) {
                errorMessage += 'Rate limit exceeded. Please wait and try again.';
            } else if (e.message?.includes('parse')) {
                errorMessage += 'Invalid response format from AI.';
            } else {
                errorMessage += e.message || 'Unknown error.';
            }
            handleError(e);
            return null;
        }
    };
    
    const handleResetSession = () => {
        if (window.confirm("Are you sure you want to reset the entire session? This cannot be undone.")) {
            localStorage.removeItem('pilferSession');
            dispatch({ type: 'RESET_SESSION' });
        }
    };

    const handleExport = (result: PilferResult, format: ExportFormat) => {
        try {
            ExportService.export(result, format);
        } catch (e) {
            console.error("Export failed:", e);
            handleError(e);
        }
    };

    const handleExportMarkdown = () => {
        const lines: string[] = [
            `# Pilfer Session Export`,
            `**Target:** ${url || 'N/A'}`,
            `**Date:** ${new Date().toLocaleString()}`,
            `**Results:** ${sessionHistory.length}`,
            '',
            '---',
            '',
        ];

        if (reconResult) {
            lines.push('## Reconnaissance Results');
            lines.push(`### Color Palette`);
            reconResult.colorPalette.forEach(c => lines.push(`- **${c.name}**: \`${c.hex}\``));
            lines.push('');
            lines.push('### Typography');
            reconResult.typography.forEach(t => lines.push(`- **${t.fontFamily}** — ${t.usage}`));
            lines.push('');
        }

        Object.values(deepDiveResults).forEach((result: PilferResult) => {
            lines.push(`## Heist: ${result.name}`);
            lines.push(`**Tech Stack:** ${result.techStack.join(', ')}`);
            lines.push('');
            lines.push('### Architectural Notes');
            lines.push(result.architecturalNotes);
            lines.push('');
            lines.push('### Implementation Code');
            lines.push('```tsx');
            lines.push(result.code);
            lines.push('```');
            lines.push('');
            lines.push('### Design Rationale');
            lines.push(result.rationale);
            lines.push('');
            lines.push(`**Tags:** ${result.tags.join(', ')}`);
            lines.push('');
            lines.push('---');
            lines.push('');
        });

        Object.values(refactorResults).forEach((result: RefactorResult) => {
            lines.push(`## Refactor: ${result.name}`);
            lines.push(result.explanation);
            lines.push('');
            lines.push('```tsx');
            lines.push(result.refactoredCode);
            lines.push('```');
            lines.push('');
            lines.push('---');
            lines.push('');
        });

        const markdown = lines.join('\n');
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pilfer-session-${Date.now()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const renderedHistory = useMemo(() => sessionHistory.slice().reverse(), [sessionHistory]);

    const getHeistButtonText = () => {
        if (appState === 'PLANNING_HEIST') return 'Planning...';
        if (appState === 'AWAITING_CONFIRMATION') return 'Awaiting Confirmation';
        if (appState === 'HEISTING') return 'Heisting...';
        if (auditType === 'heist') return 'Plan Heist';
        return 'Run Deep Dive';
    };
    
    const isFormDisabled = appState !== 'IDLE' || heistPlan?.isAwaitingConfirmation;

    return (
        <>
            {/* --- MAIN UI --- */}
            <h1 className="cyber-glitch" data-text="PILFER">PILFER</h1>
            <p className="subtitle">Digital Heist Platform</p>

            <div className={`main-interface ${appState !== 'IDLE' ? 'active-heist' : ''}`}>
                <div className="top-controls">
                    <div className="mode-toggle">
                        <button className={analysisMode === 'single' ? 'active' : ''} onClick={() => setField('analysisMode', 'single')}>Single</button>
                        <button className={analysisMode === 'compare' ? 'active' : ''} onClick={() => setField('analysisMode', 'compare')}>Compare</button>
                    </div>
                    <div className="utility-buttons">
                        <button onClick={() => dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'history', isOpen: true } })}>Logbook</button>
                        <button onClick={() => dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'command', isOpen: true } })}>Cmd (⌘K)</button>
                        <button onClick={() => dispatch({ type: 'TOGGLE_PANEL', payload: { panel: 'settings', isOpen: true } })}>Settings</button>
                    </div>
                <div className="session-controls">
                    <button 
                        className="new-session-btn" 
                        onClick={() => dispatch({ type: 'START_NEW_SESSION' })} 
                        title="Start fresh heist (archives current session)"
                    >
                        New Heist
                    </button>
                    <button 
                        className="clear-session-btn" 
                        onClick={() => dispatch({ type: 'CLEAR_CURRENT_SESSION' })}
                        disabled={sessionHistory.length === 0}
                        title="Clear current results (keeps in logbook)"
                    >
                        Clear Results
                    </button>
                    <span className="session-info">
                        Session: {currentSession.activeResults.length} results
                        {historicalSessions.length > 0 && ` | ${historicalSessions.length} archived`}
                    </span>
                </div>
            </div>
            </div>

            <div className={`main-content ${appState === 'HEISTING' ? 'heisting' : ''}`}>
                 {heistPlan?.isAwaitingConfirmation && (
                    <div className="heist-plan-card scan-in-animation">
                        <h3>Heist Plan Proposed</h3>
                        <p>{heistPlan.plan}</p>
                        <div className="form-group">
                            <label htmlFor="planRefinement">Refine Plan (Optional)</label>
                            <textarea
                                id="planRefinement"
                                value={planRefinement}
                                onChange={e => setPlanRefinement(e.target.value)}
                                placeholder="e.g., No, use a CSS class for the open state instead of JS."
                            />
                        </div>
                        <div className="heist-plan-actions">
                            <button onClick={handleExecuteHeist} disabled={appState !== 'AWAITING_CONFIRMATION'}>
                                {planRefinement ? 'Proceed with Refinements' : 'Proceed with Plan'}
                            </button>
                            <button className="cancel-btn" onClick={() => dispatch({ type: 'CLEAR_HEIST_PLAN' })} disabled={appState !== 'AWAITING_CONFIRMATION'}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                <div className={`input-form ${isFormDisabled ? 'disabled' : ''}`}>
                    {analysisMode === 'single' ? (
                        <>
                            <div className="form-group"><label htmlFor="url">Target URL</label><input type="text" id="url" value={url} onChange={e => setField('url', e.target.value)} placeholder="https://example.com, https://another.com" /></div>
                            <div className="form-group"><label htmlFor="pageSource">Page Source (HTML - Optional)</label><textarea id="pageSource" value={pageSource} onChange={e => setField('pageSource', e.target.value)} placeholder="Paste HTML source for high-fidelity recon..." /></div>
                            <button onClick={handleRecon} disabled={!url || isFormDisabled}>{appState === 'CASING' ? 'Casing...' : 'Case The Joint'}</button>
                            
                            <div className="section-title">Deep Dive</div>
                            <div className="form-group"><label htmlFor="directive">Heist Objective</label><textarea id="directive" value={directive} onChange={e => setField('directive', e.target.value)} placeholder="e.g., Yoink the hero section..." /></div>
                            <div className="form-group"><label htmlFor="code">Code (For Refactor/Blueprint)</label><textarea id="code" value={code} onChange={e => setField('code', e.target.value)} placeholder="Paste code here to refactor..." /></div>
                            <div className="form-group"><label htmlFor="apiDocs">API Context / Docs (Optional)</label><textarea id="apiDocs" value={apiDocs} onChange={e => setField('apiDocs', e.target.value)} placeholder="Paste relevant library docs here for higher accuracy..." /></div>
                            <div className="form-group-inline">
                                <div className="form-group"><label>Audit Type</label><select value={auditType} onChange={e => setField('auditType', e.target.value as AuditType)}><option value="heist">Heist</option><option value="refactor">Refactor</option><option value="blueprint">Blueprint</option></select></div>
                                <div className="form-group"><label>Persona</label><select value={persona} onChange={e => setField('persona', e.target.value as Persona)}><option value="professor">Professor</option><option value="ghost">Ghost</option><option value="cleaner">Cleaner</option></select></div>
                            </div>
                             <div className="section-title">Target Tech</div>
                             <div className="form-group-inline">
                                 <div className="form-group">
                                    <label>Framework{reconResult?.detectedFramework ? ` — detected: ${reconResult.detectedFramework}` : ''}</label>
                                    <select value={frameworkTarget} onChange={e => setField('frameworkTarget', e.target.value as FrameworkTarget)}>
                                        <option value="auto">Auto (match detected)</option>
                                        <optgroup label="React Family">
                                            <option value="react">React</option>
                                            <option value="next">Next.js</option>
                                            <option value="remix">Remix</option>
                                        </optgroup>
                                        <optgroup label="Vue Family">
                                            <option value="vue">Vue</option>
                                            <option value="nuxt">Nuxt</option>
                                        </optgroup>
                                        <optgroup label="Other Frameworks">
                                            <option value="svelte">Svelte</option>
                                            <option value="angular">Angular</option>
                                            <option value="astro">Astro</option>
                                            <option value="alpine">Alpine.js</option>
                                            <option value="htmx">HTMX</option>
                                        </optgroup>
                                        <optgroup label="No Framework">
                                            <option value="web_component">Web Components</option>
                                            <option value="plain_js">Plain HTML/JS</option>
                                        </optgroup>
                                    </select>
                                </div>
                                 <div className="form-group"><label>Styling</label><select value={stylingTarget} onChange={e => setField('stylingTarget', e.target.value as StylingTarget)}><option value="tailwind">Tailwind</option><option value="plain_css">Plain CSS</option><option value="styled_components">Styled Components</option></select></div>
                                 <div className="form-group"><label>State</label><select value={stateTarget} onChange={e => setField('stateTarget', e.target.value as StateTarget)}><option value="hooks">Hooks</option><option value="redux">Redux</option></select></div>
                             </div>
                            <button onClick={handleDeepDive} disabled={!directive || isFormDisabled}>{getHeistButtonText()}</button>
                        </>
                    ) : (
                        <>
                            <div className="form-group"><label htmlFor="compareDirective">Comparison Directive</label><textarea id="compareDirective" value={compareDirective} onChange={e => setField('compareDirective', e.target.value)} placeholder="e.g., Compare these two components..." /></div>
                            <div className="comparative-grid">
                                <div className="form-group"><label htmlFor="compareCode1">Subject 1</label><textarea id="compareCode1" value={compareCode1} onChange={e => setField('compareCode1', e.target.value)} /></div>
                                <div className="form-group"><label htmlFor="compareCode2">Subject 2</label><textarea id="compareCode2" value={compareCode2} onChange={e => setField('compareCode2', e.target.value)} /></div>
                            </div>
                            <button onClick={handleCompare} disabled={!compareDirective || !compareCode1 || !compareCode2 || appState !== 'IDLE'}>{appState === 'HEISTING' ? 'Analyzing...' : 'Run Comparison'}</button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {liveResult && <StreamingResultCard result={liveResult} />}

            <div className="results-container">
                {currentSession.activeResults.length > 0 && (
                    <div className="current-session-header">
                        <h3>Current Session Results</h3>
                        <button 
                            className="toggle-view-btn" 
                            onClick={() => dispatch({ type: 'TOGGLE_SESSION_VIEW' })}
                            title={showOnlyCurrentSession ? 'Show all historical results' : 'Show only current session'}
                        >
                            {showOnlyCurrentSession ? 'Show All' : 'Current Only'}
                        </button>
                    </div>
                )}
                 {(showOnlyCurrentSession ? currentSession.activeResults : sessionHistory).map(entry => {
                    let content = null;
                    if (entry.type === 'Recon' && reconResult && reconResult.id === entry.id) {
                        content = <ReconCard result={reconResult} onComponentSelect={handleComponentSelect} onApplyTheme={handleApplyTheme} />;
                    } else if (entry.type === 'heist' && deepDiveResults[entry.id]) {
                        content = <ResultCard result={deepDiveResults[entry.id]} onTechTagClick={() => {}} onQuickHeist={handleQuickHeist} onOpenSafehouse={(result) => dispatch({ type: 'OPEN_SAFEHOUSE', payload: result })} onExport={handleExport} />;
                    } else if (entry.type === 'refactor' && refactorResults[entry.id]) {
                        content = <RefactorResultCard result={refactorResults[entry.id]} />;
                    } else if (entry.type === 'Compare' && comparativeResults[entry.id]) {
                        content = <ComparativeResultCard result={comparativeResults[entry.id]} />;
                    } else if (entry.type === 'blueprint' && blueprintResults[entry.id]) {
                        content = <BlueprintResultCard result={blueprintResults[entry.id]} />;
                    }
                    return content ? <div key={entry.id} id={entry.id}>{content}</div> : null;
                })}
                {!showOnlyCurrentSession && historicalSessions.length > 0 && (
                    <div className="historical-sessions-note">
                        <p>📚 Historical results shown. Use Logbook to manage archived sessions.</p>
                    </div>
                )}
            </div>

            <HistoryPanel 
                history={renderedHistory} 
                currentSession={currentSession}
                historicalSessions={historicalSessions}
                isOpen={isHistoryOpen} 
                onClose={() => dispatch({type: 'TOGGLE_PANEL', payload: {panel: 'history', isOpen: false}})}
                onJump={(id: string) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.style.outline = '2px solid var(--accent-cyan)';
                        setTimeout(() => element.style.outline = '', 2000);
                    }
                }}
                onRestoreSession={(sessionId: string) => {
                    dispatch({ type: 'RESTORE_HISTORICAL_SESSION', payload: sessionId });
                    dispatch({type: 'TOGGLE_PANEL', payload: {panel: 'history', isOpen: false}});
                }}
                onDeleteSession={(sessionId: string) => {
                    if (window.confirm('Are you sure you want to delete this archived session? This cannot be undone.')) {
                        dispatch({ type: 'DELETE_HISTORICAL_SESSION', payload: sessionId });
                    }
                }}
            />
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => dispatch({type: 'TOGGLE_PANEL', payload: {panel: 'command', isOpen: false}})} onCommand={handleCommand} />
            <SettingsPanel 
                isOpen={isSettingsOpen} 
                onClose={() => dispatch({type: 'TOGGLE_PANEL', payload: {panel: 'settings', isOpen: false}})}
                theme={theme}
                setTheme={(t) => setField('theme', t)}
                fontSize={fontSize}
                setFontSize={(s) => setField('fontSize', s)}
                layout={layout}
                setLayout={(l) => setField('layout', l)}
            />
            <SafehouseModal
                isOpen={safehouseState.isOpen}
                onClose={() => dispatch({ type: 'CLOSE_SAFEHOUSE' })}
                component={safehouseState.component}
                onGenerateTests={handleGenerateTests}
                onExport={handleExport}
            />
        </>
    );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);