import React, { useState, useEffect, useMemo, useRef } from 'react';
import mermaid from 'mermaid';
import {
    ColorInfo, ComponentNode, ReconResult, PilferResult, RefactorResult,
    ComparativeResult, BlueprintResult, UnitTestResult, LiveResult, HistoryEntry,
    Theme, Layout
} from './types';

// Backend extraction components
export {
    FrameworkBadge,
    ExtractionMetadataBadge,
    AssetStats,
    ComponentAnalysisStats,
    BackendExtractionPanel
} from './src/components/BackendExtractionComponents';

mermaid.initialize({ startOnLoad: false, theme: 'dark', 'themeVariables': { 'background': '#0d0d1a' } });

export function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="code-block-wrapper">
            <button onClick={handleCopy} className="copy-code-btn">
                {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre><code>{code}</code></pre>
        </div>
    );
}

export function ComponentNodeView({ node, onNodeClick, level }: { node: ComponentNode, onNodeClick: (name: string) => void, level: number }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="tree-node" style={{ paddingLeft: `${level * 20}px` }}>
            <div className="node-content">
                {hasChildren && (
                    <button className="node-toggle" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? '▼' : '▶'}
                    </button>
                )}
                <button className="node-name" onClick={() => onNodeClick(node.name)}>
                    {node.name}
                </button>
            </div>
            {hasChildren && isExpanded && (
                <div className="node-children">
                    {node.children?.map((child, index) => (
                        <ComponentNodeView key={index} node={child} onNodeClick={onNodeClick} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ComponentTreeView({ tree, onNodeClick }: { tree: ComponentNode[], onNodeClick: (name: string) => void }) {
    return (
        <div className="component-tree">
            {tree.map((node, index) => (
                <ComponentNodeView key={index} node={node} onNodeClick={onNodeClick} level={0} />
            ))}
        </div>
    );
}

export function ReconCard({ result, onComponentSelect, onApplyTheme }: { result: ReconResult, onComponentSelect: (componentName: string) => void, onApplyTheme: (palette: ColorInfo[]) => void }) {
    return (
        <div id="recon-result" className="recon-card">
            <h3>Heist Prep: The Loot</h3>
            <p>Initial reconnaissance complete. Key design assets and potential targets identified.</p>
            <div className="heist-prep-grid">
                <div className="card-section">
                    <h4>Color Palette</h4>
                    <div className="color-palette">
                        {result.colorPalette.map((color, i) => (
                            <div key={i} className="color-swatch" title={`${color.name} - ${color.hex}`}>
                                <div className="swatch" style={{ backgroundColor: color.hex }}></div>
                                <span>{color.hex}</span>
                            </div>
                        ))}
                    </div>
                    <button className="apply-theme-btn" onClick={() => onApplyTheme(result.colorPalette)}>Apply to Pilfer UI</button>
                </div>
                <div className="card-section">
                    <h4>Typography Suite</h4>
                    <div className="typography-suite">
                        {result.typography.map((type, i) => (
                            <div key={i} className="type-item">
                                <span style={{ fontFamily: type.fontFamily.split(',')[0] }}>{type.fontFamily}</span>
                                <span>Usage: {type.usage}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="card-section">
                <h4>Core CSS Styles</h4>
                {result.coreStyles.map((style, i) => (
                    <div key={i} className="core-style-snippet">
                        <strong>{style.name}:</strong>
                        <CodeBlock code={style.code} />
                    </div>
                ))}
            </div>
            <div className="card-section">
                <h4>Page Architecture</h4>
                <ComponentTreeView tree={result.pageArchitecture} onNodeClick={onComponentSelect} />
            </div>
        </div>
    );
}


export function ResultCard({ result, onTechTagClick, onQuickHeist, onOpenSafehouse }: { 
    result: PilferResult, 
    onTechTagClick: (tech: string) => void, 
    onQuickHeist: (tech: string) => void,
    onOpenSafehouse: (result: PilferResult) => void 
}) {
    const isRunnable = result.techStack.some(t => ['react', 'vue', 'svelte', 'web_component', 'plain_js'].includes(t.toLowerCase().replace(/ /g, '_')));
    
    return (
        <div className="result-card">
            <h3>The Loot: {result.name}</h3>
            <div className="tech-stack">
                {result.techStack.map(tech => (
                    <div key={tech} className="tech-item-wrapper">
                        <button className="tech-item" onClick={() => onTechTagClick(tech)}>{tech}</button>
                        <button
                            className="quick-heist-btn"
                            title={`Start new heist using ${tech}`}
                            onClick={() => onQuickHeist(tech)}
                        >
                            ⚡
                        </button>
                    </div>
                ))}
            </div>
            <div className="card-section">
                <h4>Architectural Notes</h4>
                <p>{result.architecturalNotes}</p>
            </div>
            <div className="card-section">
                <h4>Implementation Code</h4>
                <CodeBlock code={result.code} />
            </div>
            <div className="card-section">
                <h4>Design Rationale</h4>
                <p>{result.rationale}</p>
            </div>
            <div className="tags">
                {result.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
            {isRunnable && (
                <div className="card-actions">
                    <button className="safehouse-btn" onClick={() => onOpenSafehouse(result)}>Test in Safehouse</button>
                </div>
            )}
        </div>
    );
}

export function RefactorResultCard({ result }: { result: RefactorResult }) {
    return (
        <div className="refactor-result-card">
             <h3>Laundered Code: {result.name}</h3>
            <div className="card-section">
                <h4>Explanation</h4>
                <p>{result.explanation}</p>
            </div>
            <div className="card-section">
                <h4>Refactored Code</h4>
                <CodeBlock code={result.refactoredCode} />
            </div>
             <div className="tags">
                {result.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
        </div>
    )
}

export function ComparativeResultCard({ result }: { result: ComparativeResult }) {
    return (
        <div className="comparative-result-card">
            <h3>Comparative Analysis</h3>
            <div className="card-section">
                <h4>Summary</h4>
                <p>{result.summary}</p>
            </div>
            <div className="comparison-grid">
                <div className="comparison-subject">
                    <h5>{result.subject1.title}</h5>
                    <p>{result.subject1.notes}</p>
                </div>
                <div className="comparison-subject">
                    <h5>{result.subject2.title}</h5>
                    <p>{result.subject2.notes}</p>
                </div>
            </div>
        </div>
    );
}

export function BlueprintResultCard({ result }: { result: BlueprintResult }) {
    const diagramRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (diagramRef.current && result.diagram) {
                try {
                    diagramRef.current.innerHTML = ''; // Clear previous
                    const { svg } = await mermaid.render(`mermaid-${Date.now()}`, result.diagram);
                    diagramRef.current.innerHTML = svg;
                } catch (e) {
                    console.error("Mermaid rendering failed:", e);
                    if (diagramRef.current) {
                        diagramRef.current.innerText = "Failed to render diagram. Check Mermaid syntax.";
                    }
                }
            }
        }
        renderDiagram();
    }, [result.diagram]);

    return (
        <div className="blueprint-result-card">
            <h3>Blueprint: {result.name}</h3>
            <div className="card-section">
                <h4>Explanation</h4>
                <p>{result.explanation}</p>
            </div>
            <div className="card-section">
                <h4>Diagram</h4>
                <div className="diagram-container" ref={diagramRef}>Loading diagram...</div>
            </div>
            <div className="tags">
                {result.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
        </div>
    );
}


export function StreamingResultCard({ result }: { result: LiveResult }) {
    return (
        <div className="streaming-result-card scan-in-animation">
            <h3>{result.title}</h3>
            <pre>{result.content}</pre>
        </div>
    );
}

export function HistoryPanel({ 
    history, 
    currentSession, 
    historicalSessions, 
    onJump, 
    onRestoreSession, 
    onDeleteSession, 
    isOpen, 
    onClose 
}: { 
    history: HistoryEntry[], 
    currentSession: any, 
    historicalSessions: any[], 
    onJump: (id: string) => void, 
    onRestoreSession: (sessionId: string) => void,
    onDeleteSession: (sessionId: string) => void,
    isOpen: boolean, 
    onClose: () => void 
}) {
    const [activeTab, setActiveTab] = useState<'current' | 'archived'>('current');
    
    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };
    
    return (
        <div className={`history-panel ${isOpen ? 'open' : ''}`}>
            <button onClick={onClose} className="history-panel-close-btn">&times;</button>
            <h3>Heist Logbook</h3>
            
            <div className="logbook-tabs">
                <button 
                    className={activeTab === 'current' ? 'active' : ''} 
                    onClick={() => setActiveTab('current')}
                >
                    Current Session ({currentSession.activeResults.length})
                </button>
                <button 
                    className={activeTab === 'archived' ? 'active' : ''} 
                    onClick={() => setActiveTab('archived')}
                >
                    Archived ({historicalSessions.length})
                </button>
            </div>
            
            {activeTab === 'current' && (
                <div className="current-session-panel">
                    <div className="session-header">
                        <strong>Session ID:</strong> {currentSession.sessionId.split('_')[1]}
                        <br />
                        <strong>Started:</strong> {formatTimestamp(currentSession.createdAt)}
                        {currentSession.url && (
                            <><br /><strong>Target:</strong> {currentSession.url}</>
                        )}
                    </div>
                    <ul className="history-list">
                        {currentSession.activeResults.map((entry: any) => (
                            <li key={entry.id} className="history-item" onClick={() => onJump(entry.id)}>
                                <span className="type">{entry.type}</span>
                                <span className="title">{entry.title}</span>
                                <span className="timestamp">{formatTimestamp(entry.timestamp)}</span>
                            </li>
                        ))}
                        {currentSession.activeResults.length === 0 && (
                            <li className="no-results">No results in current session</li>
                        )}
                    </ul>
                </div>
            )}
            
            {activeTab === 'archived' && (
                <div className="archived-sessions-panel">
                    {historicalSessions.map((session: any) => (
                        <div key={session.sessionId} className="archived-session">
                            <div className="session-header">
                                <strong>Session:</strong> {session.sessionId.split('_')[1]}
                                <div className="session-actions">
                                    <button 
                                        className="restore-btn" 
                                        onClick={() => onRestoreSession(session.sessionId)}
                                        title="Restore this session as current"
                                    >
                                        Restore
                                    </button>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => onDeleteSession(session.sessionId)}
                                        title="Delete this archived session"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div className="session-info">
                                <span>Created: {formatTimestamp(session.createdAt)}</span>
                                <span>Results: {session.activeResults.length}</span>
                                {session.url && <span>Target: {session.url}</span>}
                            </div>
                            <ul className="session-results">
                                {session.activeResults.slice(0, 3).map((entry: any) => (
                                    <li key={entry.id} className="mini-result">
                                        <span className="type">{entry.type}</span>
                                        <span className="title">{entry.title}</span>
                                    </li>
                                ))}
                                {session.activeResults.length > 3 && (
                                    <li className="more-indicator">+{session.activeResults.length - 3} more...</li>
                                )}
                            </ul>
                        </div>
                    ))}
                    {historicalSessions.length === 0 && (
                        <div className="no-archived">No archived sessions</div>
                    )}
                </div>
            )}
        </div>
    );
}

export function CommandPalette({ isOpen, onClose, onCommand }: { isOpen: boolean, onClose: () => void, onCommand: (cmd: string) => void }) {
    const [filter, setFilter] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands = useMemo(() => [
        { id: 'run_heist', label: 'Run Heist / Deep Dive', desc: 'Execute the current analysis' },
        { id: 'run_compare', label: 'Run Comparison', desc: 'Execute the current comparison' },
        { id: 'toggle_mode', label: 'Toggle Mode', desc: 'Switch between Single and Compare' },
        { id: 'export', label: 'Export Loot', desc: 'Export session to Markdown' },
        { id: 'reset', label: 'Reset Session', desc: 'Clear all data and start over' },
    ], []);

    const filteredCommands = useMemo(() => 
        commands.filter(cmd => cmd.label.toLowerCase().includes(filter.toLowerCase())), 
        [commands, filter]
    );

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selectedCommand = filteredCommands[selectedIndex];
            if (selectedCommand) {
                onCommand(selectedCommand.id);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter command..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <ul>
                    {filteredCommands.map((cmd, index) => (
                        <li
                            key={cmd.id}
                            className={index === selectedIndex ? 'selected' : ''}
                            onClick={() => onCommand(cmd.id)}
                        >
                            {cmd.label} <span className="cmd-desc">{cmd.desc}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function SettingsPanel({ isOpen, onClose, theme, setTheme, fontSize, setFontSize, layout, setLayout }: {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    setTheme: (t: Theme) => void;
    fontSize: number;
    setFontSize: (s: number) => void;
    layout: Layout;
    setLayout: (l: Layout) => void;
}) {
    // State for real extraction toggle
    const [useRealExtraction, setUseRealExtraction] = React.useState(
        localStorage.getItem('pilferUseRealExtraction') === 'true'
    );

    const handleRealExtractionToggle = (enabled: boolean) => {
        setUseRealExtraction(enabled);
        localStorage.setItem('pilferUseRealExtraction', String(enabled));
    };

    if (!isOpen) return null;

    return (
        <div className="settings-panel-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <h3>Heist Terminal</h3>
                <div className="form-group">
                    <label>UI Theme</label>
                    <div className="theme-buttons">
                        <button onClick={() => setTheme('default')} style={{ borderColor: theme === 'default' ? 'var(--accent-yellow)' : undefined }}>Default</button>
                        <button onClick={() => setTheme('matrix-green')} style={{ borderColor: theme === 'matrix-green' ? 'var(--accent-yellow)' : undefined }}>Matrix</button>
                        <button onClick={() => setTheme('arcade-neon')} style={{ borderColor: theme === 'arcade-neon' ? 'var(--accent-yellow)' : undefined }}>Arcade</button>
                    </div>
                </div>
                <div className="form-group">
                    <label>Font Size</label>
                    <input
                        type="range"
                        min="12"
                        max="20"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                    />
                </div>
                <div className="form-group">
                    <label>Layout</label>
                    <div className="toggle-switch">
                        <label>
                            <input type="checkbox" checked={layout === 'compact'} onChange={(e) => setLayout(e.target.checked ? 'compact' : 'default')} />
                            <span className="slider"></span>
                            Compact Mode
                        </label>
                    </div>
                </div>
                <div className="form-group">
                    <label>Extraction Engine</label>
                    <div className="toggle-switch">
                        <label>
                            <input 
                                type="checkbox" 
                                checked={useRealExtraction} 
                                onChange={(e) => handleRealExtractionToggle(e.target.checked)} 
                            />
                            <span className="slider"></span>
                            Real Web Scraping
                            <span className="setting-description">
                                {useRealExtraction ? 'Live website analysis with Puppeteer' : 'AI-based knowledge extraction'}
                            </span>
                        </label>
                    </div>
                </div>
                 <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export function SafehouseModal({ isOpen, onClose, component, onGenerateTests }: {
    isOpen: boolean;
    onClose: () => void;
    component: PilferResult | null;
    onGenerateTests: (code: string) => Promise<UnitTestResult | null>;
}) {
    const [editedCode, setEditedCode] = useState('');
    const [testResult, setTestResult] = useState<UnitTestResult | null>(null);
    const [isGeneratingTests, setIsGeneratingTests] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const updatePreview = (code: string) => {
        if (!iframeRef.current || !component) return;

        const isReact = component.techStack.some(t => t.toLowerCase().includes('react'));
        // Vue/Svelte support can be added with a similar pattern

        if (isReact) {
            // Process the code to make it browser-compatible
            let processedCode = code;
            
            // Remove ALL import statements (including multi-line imports)
            processedCode = processedCode.replace(/import\s+(?:[^;]+from\s+)?['"][^'"]+['"];?/gms, '');
            
            // Remove styled-components template literals and replace with basic React components
            // Match styled.div`...` or styled(Component)`...` patterns
            processedCode = processedCode.replace(/const\s+(\w+)\s*=\s*styled\.\w+`[^`]*`/gms, (match, componentName) => {
                return `const ${componentName} = ({ children, ...props }) => React.createElement('div', props, children)`;
            });
            processedCode = processedCode.replace(/const\s+(\w+)\s*=\s*styled\([^)]+\)`[^`]*`/gms, (match, componentName) => {
                return `const ${componentName} = ({ children, ...props }) => React.createElement('div', props, children)`;
            });
            
            // Handle template literal variables in styled-components (remove them)
            processedCode = processedCode.replace(/\$\{[^}]+\}/g, '');
            
            // Remove ALL export statements
            processedCode = processedCode.replace(/export\s+default\s+[^;\n]+;?/gm, '');
            processedCode = processedCode.replace(/export\s+\{[^}]*\};?/gm, '');
            processedCode = processedCode.replace(/export\s+(const|let|var|function|class)\s+/gm, '$1 ');
            
            // Fix React hook references that might already have React. prefix
            processedCode = processedCode.replace(/React\.React\./g, 'React.');
            
            // Ensure hooks are properly prefixed if they're not already
            const hooks = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer'];
            hooks.forEach(hook => {
                // Only add React. prefix if it's not already there
                const regex = new RegExp(`(?<!React\\.)\\b${hook}\\b`, 'g');
                processedCode = processedCode.replace(regex, `React.${hook}`);
            });
            
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Safehouse Preview</title>
                    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
                    <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>
                    <style>
                        body { margin: 0; padding: 1rem; font-family: sans-serif; background-color: #f0f2f5; color: #111; }
                        #root { min-height: calc(100vh - 2rem); }
                    </style>
                </head>
                <body>
                    <div id="root"></div>
                    <script type="text/babel">
                        (() => {
                            // Make React hooks available globally for the component
                            const { useState, useEffect, useRef, useMemo, useCallback, useContext, useReducer } = React;
                            
                            try {
                                // User's component code goes here
                                ${processedCode}
                                
                                // Render the component
                                const container = document.getElementById('root');
                                const root = ReactDOM.createRoot(container);
                                root.render(React.createElement(PilferedComponent));
                            } catch (e) {
                                const rootEl = document.getElementById('root');
                                rootEl.innerHTML = '<pre style="color: red; white-space: pre-wrap;">Render Error: ' + e.message + '\\n' + e.stack + '</pre>';
                                console.error('Component render error:', e);
                            }
                        })();
                    </script>
                </body>
                </html>
            `;
            iframeRef.current.srcdoc = html;
        } else {
            // Fallback for plain HTML/JS/Web Components
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { margin: 0; padding: 1rem; font-family: sans-serif; background-color: #f0f2f5; color: #111 }
                    </style>
                </head>
                <body>
                    ${code}
                </body>
                </html>
            `;
            iframeRef.current.srcdoc = html;
        }
    };

    useEffect(() => {
        if (component) {
            setEditedCode(component.code);
            setTestResult(null); // Reset tests when component changes
             // Defer the initial preview update to avoid a race condition with the iframe.
            setTimeout(() => updatePreview(component.code), 100);
        }
    }, [component]);

    const handleRefresh = () => {
        updatePreview(editedCode);
    };

    const handleGenTestsClick = async () => {
        setIsGeneratingTests(true);
        setTestResult(null);
        const result = await onGenerateTests(editedCode);
        if (result) {
            setTestResult(result);
        }
        setIsGeneratingTests(false);
    };

    if (!isOpen || !component) return null;

    return (
        <div className="safehouse-overlay" onClick={onClose}>
            <div className="safehouse-modal" onClick={e => e.stopPropagation()}>
                <div className="safehouse-header">
                    <h3>Safehouse: Testing "{component.name}"</h3>
                    <button onClick={onClose} className="safehouse-close-btn">&times;</button>
                </div>
                <div className="safehouse-content">
                    <div className="safehouse-pane editor-pane">
                        <h4>Code Editor</h4>
                        <textarea value={editedCode} onChange={e => setEditedCode(e.target.value)} spellCheck="false" />
                        <button onClick={handleRefresh}>Refresh Preview</button>
                    </div>
                    <div className="safehouse-pane preview-pane">
                        <h4>Live Preview</h4>
                        <iframe ref={iframeRef} title="Live Component Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-modals"></iframe>
                    </div>
                </div>
                <div className="safehouse-tests">
                    <h4>Unit Tests</h4>
                    <button onClick={handleGenTestsClick} disabled={isGeneratingTests}>
                        {isGeneratingTests ? 'Generating...' : 'Generate Unit Tests'}
                    </button>
                    {testResult && (
                        <div className="test-result-content">
                            <h5>{testResult.testFramework} Tests</h5>
                            <p>{testResult.explanation}</p>
                            <CodeBlock code={testResult.tests} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
