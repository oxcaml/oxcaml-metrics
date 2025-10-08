class DataProcessor {
    constructor(rawData) {
        this.rawData = rawData;
        this.processedData = null;
        this.normalizedData = null;
    }

    process() {
        this.processedData = this.groupDataByTimestamp();
        this.normalizedData = this.normalizeData();
        return {
            processed: this.processedData,
            normalized: this.normalizedData
        };
    }

    groupDataByTimestamp() {
        const grouped = new Map();

        this.rawData.forEach(row => {
            const timestamp = row.timestamp;
            const extension = row.extension;
            const size = row.total_size_bytes;

            if (!grouped.has(timestamp)) {
                grouped.set(timestamp, {
                    timestamp: timestamp,
                    commit_hash: row.commit_hash,
                    pr_number: row.pr_number,
                    date: new Date(timestamp),
                    extensions: new Map()
                });
            }

            grouped.get(timestamp).extensions.set(extension, size);
        });

        // Convert to array and sort by date
        const result = Array.from(grouped.values())
            .sort((a, b) => a.date - b.date);

        // Get all unique extensions
        const allExtensions = new Set();
        result.forEach(entry => {
            entry.extensions.forEach((size, ext) => allExtensions.add(ext));
        });

        // Ensure all entries have all extensions (fill missing with 0)
        const extensionList = Array.from(allExtensions).sort();
        result.forEach(entry => {
            extensionList.forEach(ext => {
                if (!entry.extensions.has(ext)) {
                    entry.extensions.set(ext, 0);
                }
            });
        });

        return {
            data: result,
            extensions: extensionList
        };
    }

    normalizeData() {
        if (!this.processedData || this.processedData.data.length === 0) {
            return null;
        }

        const { data, extensions } = this.processedData;

        // Find baseline values (first non-zero value for each extension)
        const baselines = new Map();

        extensions.forEach(ext => {
            for (const entry of data) {
                const value = entry.extensions.get(ext);
                if (value > 0) {
                    baselines.set(ext, value);
                    break;
                }
            }
            // If no non-zero value found, use 1 to avoid division by zero
            if (!baselines.has(ext)) {
                baselines.set(ext, 1);
            }
        });

        // Normalize data
        const normalizedData = data.map(entry => {
            const normalizedExtensions = new Map();

            extensions.forEach(ext => {
                const value = entry.extensions.get(ext);
                const baseline = baselines.get(ext);
                const normalizedValue = (value / baseline) * 100; // Convert to percentage
                normalizedExtensions.set(ext, normalizedValue);
            });

            return {
                timestamp: entry.timestamp,
                commit_hash: entry.commit_hash,
                pr_number: entry.pr_number,
                date: entry.date,
                extensions: normalizedExtensions
            };
        });

        return {
            data: normalizedData,
            extensions: extensions,
            baselines: baselines
        };
    }

    getChartData() {
        if (!this.processedData || !this.normalizedData) {
            throw new Error('Data must be processed first');
        }

        return {
            raw: this.getStackedBarChartData(),
            normalized: this.getLineChartData()
        };
    }

    getStackedBarChartData() {
        const { data, extensions } = this.processedData;

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(extensions.length);

        const datasets = extensions.map((ext, index) => ({
            label: ext,
            data: data.map(entry => entry.extensions.get(ext)),
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        }));

        return {
            labels: labels,
            datasets: datasets,
            commits: data.map(entry => entry.commit_hash),
            prNumbers: data.map(entry => entry.pr_number),
            timestamps: data.map(entry => entry.timestamp)
        };
    }

    getLineChartData() {
        const { data, extensions } = this.normalizedData;

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(extensions.length);

        const datasets = extensions.map((ext, index) => ({
            label: ext,
            data: data.map(entry => entry.extensions.get(ext)),
            borderColor: colors[index],
            backgroundColor: colors[index] + '20', // Add transparency
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        }));

        return {
            labels: labels,
            datasets: datasets,
            commits: data.map(entry => entry.commit_hash),
            prNumbers: data.map(entry => entry.pr_number),
            timestamps: data.map(entry => entry.timestamp)
        };
    }

    generateColors(count) {
        // D3 Chromatic schemePaired (12 colors) + black as 13th
        const colors = [
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
            '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a',
            '#ffff99', '#b15928', '#000000'
        ];

        // If we need more colors than predefined, generate them
        if (count > colors.length) {
            for (let i = colors.length; i < count; i++) {
                const hue = (i * 137.508) % 360; // Golden angle approximation
                colors.push(`hsl(${hue}, 70%, 50%)`);
            }
        }

        return colors.slice(0, count);
    }

    getSummaryStats() {
        if (!this.processedData) {
            return null;
        }

        const { data, extensions } = this.processedData;

        if (data.length === 0) {
            return null;
        }

        const latest = data[data.length - 1];
        const totalSize = extensions.reduce((sum, ext) => sum + latest.extensions.get(ext), 0);

        return {
            totalFiles: extensions.length,
            totalSize: totalSize,
            latestCommit: latest.commit_hash.substring(0, 8),
            latestPrNumber: latest.pr_number,
            latestTimestamp: latest.timestamp,
            dataPoints: data.length
        };
    }
}