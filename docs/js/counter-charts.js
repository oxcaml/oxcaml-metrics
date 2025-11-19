class CounterChartManager extends BaseChartManager {
    constructor() {
        super({
            stackedBarCanvasId: 'counterStackedBarChart',
            lineCanvasId: 'counterLineChart',
            stackedBarTitle: 'Counter Values Over Time',
            lineChartTitle: 'Counter Trends (Normalized to First Non-Zero Value)',
            yAxisLabel: 'Counter Value',
            normalizedYAxisLabel: 'Relative Count (%)',
            formatValueFn: (value) => this.formatNumber(value)
        });
    }

    // Override to create line chart for all counters
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
            borderWidth: 2,
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

    formatNumber(num) {
        if (num === 0) return '0';

        // Add thousands separators
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}
