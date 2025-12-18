class RatioDataProcessor {
    constructor(rawData) {
        this.rawData = rawData;
        this.processedData = null;
    }

    process() {
        // Extract timing data for <all>
        const timingData = new Map(); // timestamp -> value
        this.rawData.forEach(row => {
            if (row.kind === 'time_in_seconds' && row.name === '<all>') {
                timingData.set(row.timestamp, {
                    timing: row.value,
                    commit_hash: row.commit_hash,
                    pr_number: row.pr_number,
                    date: new Date(row.timestamp)
                });
            }
        });

        // Extract instruction counter data
        const instructionData = new Map(); // timestamp -> value
        this.rawData.forEach(row => {
            if (row.kind === 'counter' && row.name === 'instruction') {
                if (timingData.has(row.timestamp)) {
                    timingData.get(row.timestamp).instructions = row.value;
                }
            }
        });

        // Calculate ratios for entries that have both timing and instruction data
        const ratioData = [];
        timingData.forEach((entry, timestamp) => {
            if (entry.instructions && entry.instructions > 0) {
                ratioData.push({
                    timestamp: timestamp,
                    commit_hash: entry.commit_hash,
                    pr_number: entry.pr_number,
                    date: entry.date,
                    timing: entry.timing,
                    instructions: entry.instructions,
                    ratio: entry.timing / entry.instructions * 1e9 // nanoseconds per instruction
                });
            }
        });

        // Sort by date
        ratioData.sort((a, b) => a.date - b.date);

        this.processedData = ratioData;
        return ratioData;
    }

    getChartData() {
        if (!this.processedData) {
            throw new Error('Data must be processed first');
        }

        const data = this.processedData;
        const labels = data.map(entry => `PR #${entry.pr_number}`);
        const ratios = data.map(entry => entry.ratio);

        // Calculate regression line using least squares
        const regression = this.calculateRegression(data);

        const datasets = [
            {
                label: 'Time per Instruction (ns)',
                data: ratios,
                borderColor: '#3498db',
                backgroundColor: '#3498db20',
                fill: false,
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                order: 2
            },
            {
                label: 'Regression Line',
                data: regression.values,
                borderColor: '#e74c3c',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            }
        ];

        return {
            labels: labels,
            datasets: datasets,
            commits: data.map(entry => entry.commit_hash),
            prNumbers: data.map(entry => entry.pr_number),
            timestamps: data.map(entry => entry.timestamp),
            regression: regression
        };
    }

    calculateRegression(data) {
        const n = data.length;
        if (n === 0) {
            return { slope: 0, intercept: 0, values: [] };
        }

        // Use indices as x values for simplicity
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        data.forEach((entry, index) => {
            const x = index;
            const y = entry.ratio;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate predicted values
        const values = data.map((_, index) => slope * index + intercept);

        return {
            slope: slope,
            intercept: intercept,
            values: values
        };
    }

    getSummaryStats() {
        if (!this.processedData || this.processedData.length === 0) {
            return null;
        }

        const latest = this.processedData[this.processedData.length - 1];
        const ratios = this.processedData.map(d => d.ratio);
        const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
        const minRatio = Math.min(...ratios);
        const maxRatio = Math.max(...ratios);

        return {
            latestRatio: latest.ratio,
            latestTiming: latest.timing,
            latestInstructions: latest.instructions,
            avgRatio: avgRatio,
            minRatio: minRatio,
            maxRatio: maxRatio,
            latestCommit: latest.commit_hash.substring(0, 8),
            latestPrNumber: latest.pr_number,
            latestTimestamp: latest.timestamp,
            dataPoints: this.processedData.length
        };
    }
}
