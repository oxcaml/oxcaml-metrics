class CounterDataProcessor {
    constructor(rawData) {
        this.rawData = rawData;
        this.processedData = null;
        this.normalizedData = null;
        this.countersToTrack = ['reload', 'spill'];
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
            // Only process rows with kind='counter' and names in countersToTrack
            if (row.kind !== 'counter' || !this.countersToTrack.includes(row.name)) {
                return;
            }

            const timestamp = row.timestamp;
            const counterName = row.name;
            const value = row.value;

            if (!grouped.has(timestamp)) {
                grouped.set(timestamp, {
                    timestamp: timestamp,
                    commit_hash: row.commit_hash,
                    pr_number: row.pr_number,
                    date: new Date(timestamp),
                    counters: new Map()
                });
            }

            grouped.get(timestamp).counters.set(counterName, value);
        });

        // Convert to array and sort by date
        const result = Array.from(grouped.values())
            .sort((a, b) => a.date - b.date);

        // Get all unique counters
        const allCounters = new Set();
        result.forEach(entry => {
            entry.counters.forEach((value, counter) => allCounters.add(counter));
        });

        // Ensure all entries have all counters (fill missing with 0)
        const counterList = Array.from(allCounters).sort();
        result.forEach(entry => {
            counterList.forEach(counter => {
                if (!entry.counters.has(counter)) {
                    entry.counters.set(counter, 0);
                }
            });
        });

        return {
            data: result,
            counters: counterList
        };
    }

    normalizeData() {
        if (!this.processedData || this.processedData.data.length === 0) {
            return null;
        }

        const { data, counters } = this.processedData;

        // Find baseline values (first non-zero value for each counter)
        const baselines = new Map();

        counters.forEach(counter => {
            for (const entry of data) {
                const value = entry.counters.get(counter);
                if (value > 0) {
                    baselines.set(counter, value);
                    break;
                }
            }
            // If no non-zero value found, use 1 to avoid division by zero
            if (!baselines.has(counter)) {
                baselines.set(counter, 1);
            }
        });

        // Normalize data
        const normalizedData = data.map(entry => {
            const normalizedCounters = new Map();

            counters.forEach(counter => {
                const value = entry.counters.get(counter);
                const baseline = baselines.get(counter);
                const normalizedValue = (value / baseline) * 100; // Convert to percentage
                normalizedCounters.set(counter, normalizedValue);
            });

            return {
                timestamp: entry.timestamp,
                commit_hash: entry.commit_hash,
                pr_number: entry.pr_number,
                date: entry.date,
                counters: normalizedCounters
            };
        });

        return {
            data: normalizedData,
            counters: counters,
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
        const { data, counters } = this.processedData;

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(counters.length);

        const datasets = counters.map((counter, index) => ({
            label: counter,
            data: data.map(entry => entry.counters.get(counter)),
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
        const { data, counters } = this.normalizedData;

        const labels = data.map(entry => `PR #${entry.pr_number}`);

        const colors = this.generateColors(counters.length);

        const datasets = counters.map((counter, index) => ({
            label: counter,
            data: data.map(entry => entry.counters.get(counter)),
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
        // Use distinct colors for counters
        const colors = [
            '#e74c3c', // Red for first counter
            '#3498db', // Blue for second counter
            '#2ecc71', // Green for third counter (if needed)
            '#f39c12'  // Orange for fourth counter (if needed)
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

        const { data, counters } = this.processedData;

        if (data.length === 0) {
            return null;
        }

        const latest = data[data.length - 1];
        const totalCount = counters.reduce((sum, counter) => sum + latest.counters.get(counter), 0);

        return {
            totalCounters: counters.length,
            totalCount: totalCount,
            latestCommit: latest.commit_hash.substring(0, 8),
            latestPrNumber: latest.pr_number,
            latestTimestamp: latest.timestamp,
            dataPoints: data.length
        };
    }
}
