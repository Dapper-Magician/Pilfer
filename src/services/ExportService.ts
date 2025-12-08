import { PilferResult, ExportFormat } from '../../types';

export class ExportService {
    
    static export(result: PilferResult, format: ExportFormat): void {
        let content = '';
        let extension = '';
        let mimeType = '';

        switch (format) {
            case 'markdown':
                content = this.toMarkdown(result);
                extension = 'md';
                mimeType = 'text/markdown';
                break;
            case 'json':
                content = this.toJSON(result);
                extension = 'json';
                mimeType = 'application/json';
                break;
            case 'html':
                content = this.toHTML(result);
                extension = 'html';
                mimeType = 'text/html';
                break;
            case 'tailwind':
                // For now, Tailwind export is just the code, assuming it's already Tailwind
                // In a future iteration, this could involve AI conversion
                content = result.code;
                extension = 'tsx';
                mimeType = 'text/plain';
                break;
        }

        this.downloadFile(content, `${result.name.replace(/\s+/g, '_').toLowerCase()}.${extension}`, mimeType);
    }

    private static toMarkdown(result: PilferResult): string {
        return `# ${result.name}

## Architectural Notes
${result.architecturalNotes}

## Design Rationale
${result.rationale}

## Tech Stack
${result.techStack.join(', ')}

## Code
\`\`\`tsx
${result.code}
\`\`\`

## Tags
${result.tags.join(', ')}
`;
    }

    private static toJSON(result: PilferResult): string {
        return JSON.stringify(result, null, 2);
    }

    private static toHTML(result: PilferResult): string {
        // Basic HTML wrapper for the component code
        // This assumes the code is somewhat self-contained or just dumps it
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.name}</title>
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${result.name}</h1>
    <section>
        <h2>Notes</h2>
        <p>${result.architecturalNotes}</p>
    </section>
    <section>
        <h2>Code</h2>
        <pre><code>${result.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    </section>
</body>
</html>`;
    }

    private static downloadFile(content: string, filename: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
