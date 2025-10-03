class NotesLoader {
    constructor() {
        this.notes = new Map();
    }

    async loadNotes() {
        try {
            const response = await fetch('../notes/size-changes.txt');

            if (!response.ok) {
                console.warn('Notes file not found or not accessible');
                return this.notes;
            }

            const text = await response.text();
            this.parseNotes(text);

            return this.notes;
        } catch (error) {
            console.warn('Failed to load notes:', error);
            return this.notes;
        }
    }

    parseNotes(text) {
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            line = line.trim();

            // Skip empty lines
            if (!line) {
                return;
            }

            // Parse line format: "PR_NUMBER: note text"
            const colonIndex = line.indexOf(':');

            if (colonIndex === -1) {
                console.warn(`Invalid note format on line ${index + 1}: ${line}`);
                return;
            }

            const prNumber = line.substring(0, colonIndex).trim();
            const noteText = line.substring(colonIndex + 1).trim();

            if (prNumber && noteText) {
                this.notes.set(prNumber, noteText);
            }
        });

        console.log(`Loaded ${this.notes.size} notes`);
    }

    getNote(prNumber) {
        return this.notes.get(String(prNumber)) || null;
    }
}
