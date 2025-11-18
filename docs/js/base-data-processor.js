class BaseDataProcessor {
    constructor(rawData, config) {
        this.rawData = rawData;
        this.processedData = null;
        this.normalizedData = null;
        this.config = config;
        // config should contain:
        // - filterFn: function to filter rows
        // - dataKey: 'extensions' or 'counters' (name of the field)
        // - colorPalette: array of colors or function to generate colors
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
        const dataKey = this.config.dataKey;

        this.rawData.forEach(row => {
            // Use the configured filter function
            if (!this.config.filterFn(row)) {
                return;
            }

            const timestamp = row.timestamp;
            const itemName = row.name;
            const value = row.value;

            if (!grouped.has(timestamp)) {
                const entry = {
                    timestamp: timestamp,
                    commit_hash: row.commit_hash,
                    pr_number: row.pr_number,
                    date: new Date(timestamp)
                };
                entry[dataKey] = new Map();
                grouped.set(timestamp, entry);
            }

            grouped.get(timestamp)[dataKey].set(itemName, value);
        });

        // Convert to array and sort by date
        const result = Array.from(grouped.values())
            .sort((a, b) => a.date - b.date);

        // Get all unique items
        const allItems = new Set();
        result.forEach(entry => {
            entry[dataKey].forEach((value, item) => allItems.add(item));
        });

        // Ensure all entries have all items (fill missing with 0)
        const itemList = Array.from(allItems).sort();
        result.forEach(entry => {
            itemList.forEach(item => {
                if (!entry[dataKey].has(item)) {
                    entry[dataKey].set(item, 0);
                }
            });
        });

        return {
            data: result,
            [dataKey]: itemList
        };
    }

    normalizeData() {
        if (!this.processedData || this.processedData.data.length === 0) {
            return null;
        }

        const { data } = this.processedData;
        const dataKey = this.config.dataKey;
        const items = this.processedData[dataKey];

        // Find baseline values (first non-zero value for each item)
        const baselines = new Map();

        items.forEach(item => {
            for (const entry of data) {
                const value = entry[dataKey].get(item);
                if (value > 0) {
                    baselines.set(item, value);
                    break;
                }
            }
            // If no non-zero value found, use 1 to avoid division by zero
            if (!baselines.has(item)) {
                baselines.set(item, 1);
            }
        });

        // Normalize data
        const normalizedData = data.map(entry => {
            const normalizedItems = new Map();

            items.forEach(item => {
                const value = entry[dataKey].get(item);
                const baseline = baselines.get(item);
                const normalizedValue = (value / baseline) * 100; // Convert to percentage
                normalizedItems.set(item, normalizedValue);
            });

            const result = {
                timestamp: entry.timestamp,
                commit_hash: entry.commit_hash,
                pr_number: entry.pr_number,
                date: entry.date
            };
            result[dataKey] = normalizedItems;
            return result;
        });

        return {
            data: normalizedData,
            [dataKey]: items,
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
        const { data } = this.processedData;
        const dataKey = this.config.dataKey;
        const items = this.processedData[dataKey];

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(items.length);

        const datasets = items.map((item, index) => ({
            label: item,
            data: data.map(entry => entry[dataKey].get(item)),
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
        const { data } = this.normalizedData;
        const dataKey = this.config.dataKey;
        const items = this.normalizedData[dataKey];

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(items.length);

        const datasets = items.map((item, index) => ({
            label: item,
            data: data.map(entry => entry[dataKey].get(item)),
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
        // Use the color palette from config
        const colors = this.config.colorPalette.slice();

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

        const { data } = this.processedData;
        const dataKey = this.config.dataKey;
        const items = this.processedData[dataKey];

        if (data.length === 0) {
            return null;
        }

        const latest = data[data.length - 1];
        const total = items.reduce((sum, item) => sum + latest[dataKey].get(item), 0);

        return {
            totalItems: items.length,
            total: total,
            latestCommit: latest.commit_hash.substring(0, 8),
            latestPrNumber: latest.pr_number,
            latestTimestamp: latest.timestamp,
            dataPoints: data.length
        };
    }
}
