class TopHeapChartManager extends BaseChartManager {
    constructor() {
        super({
            stackedBarCanvasId: 'topHeapStackedBarChart',
            lineCanvasId: 'topHeapLineChart',
            stackedBarTitle: 'Top Heap by Phase Over Time',
            lineChartTitle: 'Top Heap Trends (Normalized to First Non-Zero Value)',
            yAxisLabel: 'Top Heap (bytes)',
            normalizedYAxisLabel: 'Relative Top Heap (%)',
            formatValueFn: (value) => this.formatBytes(value)
        });
    }

    // Override to create line chart for all phases
    createStackedBarChart(data) {
        const ctx = document.getElementById(this.config.stackedBarCanvasId).getContext('2d');

        if (this.stackedBarChart) {
            this.stackedBarChart.destroy();
        }

        // Convert all datasets to line format
        const lineDatasets = data.datasets.map((ds, index) => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.borderColor,
            backgroundColor: ds.backgroundColor + '20', // Add transparency
            borderWidth: ds.label === 'all' ? 3 : 2, // Make 'all' thicker
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.1
        }));

        this.stackedBarChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: lineDatasets
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
                            text: this.config.yAxisLabel
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    annotation: {
                        annotations: this.createAnnotationsForChart(data.prNumbers)
                    },
                    title: {
                        display: true,
                        text: this.config.stackedBarTitle
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
                                const prNumber = data.prNumbers[index];
                                const commit = data.commits[index];
                                const timestamp = data.timestamps[index];
                                return `PR #${prNumber}\nCommit: ${commit.substring(0, 8)}\n${timestamp}`;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${this.config.formatValueFn(value)}`;
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
                        const prNumber = data.prNumbers[index];
                        const prUrl = `https://github.com/oxcaml/oxcaml/pull/${prNumber}`;
                        window.open(prUrl, '_blank');
                    }
                }
            }
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
