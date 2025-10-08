class NotesLoader {
    constructor(owner, repo) {
        this.notes = new Map();
        this.versionTags = new Map();
        this.baseURL = 'https://api.github.com/repos';
        this.owner = owner;
        this.repo = repo;
    }

    async loadNotes() {
        try {
            const url = `${this.baseURL}/${this.owner}/${this.repo}/contents/notes/size-changes.txt`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Notes file not found');
                } else {
                    console.warn(`Failed to load notes: ${response.status} ${response.statusText}`);
                }
                return this.notes;
            }

            const data = await response.json();

            // GitHub API returns base64 encoded content
            const text = atob(data.content);
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

    async loadVersionTags() {
        try {
            const url = `${this.baseURL}/${this.owner}/${this.repo}/contents/notes/last-pr-when-tagging.txt`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn('Version tags file not found');
                } else {
                    console.warn(`Failed to load version tags: ${response.status} ${response.statusText}`);
                }
                return this.versionTags;
            }

            const data = await response.json();

            // GitHub API returns base64 encoded content
            const text = atob(data.content);
            this.parseVersionTags(text);

            return this.versionTags;
        } catch (error) {
            console.warn('Failed to load version tags:', error);
            return this.versionTags;
        }
    }

    parseVersionTags(text) {
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            line = line.trim();

            // Skip empty lines
            if (!line) {
                return;
            }

            // Parse line format: "version_tag: PR_NUMBER"
            const colonIndex = line.indexOf(':');

            if (colonIndex === -1) {
                console.warn(`Invalid version tag format on line ${index + 1}: ${line}`);
                return;
            }

            const versionTag = line.substring(0, colonIndex).trim();
            const prNumber = line.substring(colonIndex + 1).trim();

            if (versionTag && prNumber) {
                this.versionTags.set(versionTag, prNumber);
            }
        });

        console.log(`Loaded ${this.versionTags.size} version tags`);
    }

    getVersionTag(versionTag) {
        return this.versionTags.get(String(versionTag)) || null;
    }

    getPRForVersion(versionTag) {
        return this.versionTags.get(String(versionTag)) || null;
    }
}
