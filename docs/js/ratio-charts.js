class RatioChartManager {
    constructor() {
        this.ratioChart = null;
        this.versionTags = null;
    }

    setVersionTags(versionTags) {
        this.versionTags = versionTags;
    }

    createChart(chartData) {
        const ctx = document.getElementById('ratioChart').getContext('2d');

        if (this.ratioChart) {
            this.ratioChart.destroy();
        }

        this.ratioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: chartData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Pull Request (click to open)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Time per Instruction (nanoseconds)'
                        },
                        beginAtZero: false
                    }
                },
                plugins: {
                    annotation: {
                        annotations: this.createAnnotations(chartData.prNumbers)
                    },
                    title: {
                        display: true,
                        text: 'Time per Instruction Ratio Over Time'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const prNumbers = chartData.prNumberLists
                                    ? chartData.prNumberLists[index]
                                    : chartData.prNumbers[index];
                                const commit = chartData.commits[index];
                                const timestamp = chartData.timestamps[index];
                                return `PR(s): ${this.formatPrNumbers(prNumbers)}\nCommit: ${commit.substring(0, 8)}\n${timestamp}`;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toFixed(4)} ns/instruction`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const prNumber = chartData.prNumbers[index];
                        const prUrl = `https://github.com/oxcaml/oxcaml/pull/${prNumber}`;
                        window.open(prUrl, '_blank');
                    }
                }
            }
        });
    }

    createAnnotations(prNumbers) {
        return BaseChartManager.createVersionAnnotations(this.versionTags, prNumbers);
    }

    destroy() {
        if (this.ratioChart) {
            this.ratioChart.destroy();
            this.ratioChart = null;
        }
    }

    formatPrNumbers(prNumbers) {
        return String(prNumbers || '')
            .split('/')
            .map(prNumber => prNumber.trim())
            .filter(prNumber => prNumber.length > 0)
            .map(prNumber => `#${prNumber}`)
            .join(', ');
    }
}
