class AllocationChartManager extends BaseChartManager {
    constructor() {
        super({
            stackedBarCanvasId: 'allocationStackedBarChart',
            lineCanvasId: 'allocationLineChart',
            stackedBarTitle: 'Allocation by Phase Over Time',
            lineChartTitle: 'Allocation Trends (Normalized to First Non-Zero Value)',
            yAxisLabel: 'Allocation (bytes)',
            normalizedYAxisLabel: 'Relative Allocation (%)',
            formatValueFn: (value) => this.formatBytes(value)
        });
    }

    // Override to create mixed chart with stacked bars and line overlay
    createStackedBarChart(data) {
        const ctx = document.getElementById(this.config.stackedBarCanvasId).getContext('2d');

        if (this.stackedBarChart) {
            this.stackedBarChart.destroy();
        }

        // Separate "all" from individual phases
        const allDataset = data.datasets.find(ds => ds.label === 'all');
        const phaseDatasets = data.datasets.filter(ds => ds.label !== 'all');

        // Configure phase datasets as stacked bars
        const barDatasets = phaseDatasets.map(ds => ({
            ...ds,
            type: 'bar',
            stack: 'phases'
        }));

        // Configure "all" as a line overlay
        const lineDatasets = allDataset ? [{
            label: allDataset.label,
            data: allDataset.data,
            type: 'line',
            borderColor: '#000000',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1,
            order: 0 // Draw on top
        }] : [];

        const allDatasets = [...lineDatasets, ...barDatasets];

        this.stackedBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: allDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        title: {
                            display: true,
                            text: 'Pull Request (click to open)'
                        }
                    },
                    y: {
                        stacked: false,
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
