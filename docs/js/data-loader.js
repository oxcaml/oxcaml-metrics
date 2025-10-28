class DataLoader {
    constructor() {
        this.baseURL = 'https://api.github.com/repos';
        this.owner = null;
        this.repo = null;
        this.csvFiles = [];
        this.rawData = [];
    }

    async initialize() {
        try {
            this.updateStatus('Initializing...');
            await this.detectRepository();
            await this.discoverCSVFiles();
            await this.loadAllCSVFiles();
            this.updateStatus('Data loaded successfully');
            return this.rawData;
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, 'error');
            throw error;
        }
    }

    async detectRepository() {
        const currentURL = window.location.href;
        const match = currentURL.match(/https?:\/\/([^.]+)\.github\.io\/([^\/]+)/);

        if (match) {
            this.owner = match[1];
            this.repo = match[2];
        } else {
            // Fallback for local development or if pattern doesn't match
            // You can hardcode these values if needed
            throw new Error('Could not detect repository from URL. Please check GitHub Pages setup.');
        }
    }

    async discoverCSVFiles() {
        this.updateStatus('Discovering CSV files...');

        const url = `${this.baseURL}/${this.owner}/${this.repo}/contents/data`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Data directory not found');
                } else if (response.status === 403) {
                    throw new Error('GitHub API rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }
            }

            const contents = await response.json();

            this.csvFiles = contents
                .filter(file => file.name.endsWith('.csv') && file.type === 'file')
                .map(file => ({
                    name: file.name,
                    downloadUrl: file.download_url,
                    size: file.size
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (this.csvFiles.length === 0) {
                throw new Error('No CSV files found in data directory');
            }

            this.updateStatus(`Found ${this.csvFiles.length} CSV file(s)`);

        } catch (error) {
            if (error.name === 'TypeError') {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    }

    async loadAllCSVFiles() {
        this.updateStatus('Loading CSV files...');
        this.rawData = [];

        for (let i = 0; i < this.csvFiles.length; i++) {
            const file = this.csvFiles[i];
            this.updateStatus(`Loading ${file.name} (${i + 1}/${this.csvFiles.length})...`);

            try {
                const csvData = await this.loadCSVFile(file);
                this.rawData.push(...csvData);
            } catch (error) {
                console.warn(`Failed to load ${file.name}:`, error);
                this.updateStatus(`Warning: Failed to load ${file.name}`, 'warning');
                // Continue with other files
            }
        }

        if (this.rawData.length === 0) {
            throw new Error('No data could be loaded from CSV files');
        }

        // Sort by timestamp
        this.rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    async loadCSVFile(file) {
        try {
            const response = await fetch(file.downloadUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${file.name}: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();

            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    transform: (value, field) => {
                        // Convert numeric fields
                        if (field === 'value') {
                            return parseInt(value) || 0;
                        }
                        return value;
                    },
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            console.warn(`Parsing warnings for ${file.name}:`, results.errors);
                        }
                        resolve(results.data);
                    },
                    error: (error) => {
                        reject(new Error(`Failed to parse ${file.name}: ${error.message}`));
                    }
                });
            });
        } catch (error) {
            throw new Error(`Error loading ${file.name}: ${error.message}`);
        }
    }

    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}