class ChartManager {
    constructor() {
        this.stackedBarChart = null;
        this.lineChart = null;
    }

    createCharts(chartData) {
        this.createStackedBarChart(chartData.raw);
        this.createLineChart(chartData.normalized);
    }

    createStackedBarChart(data) {
        const ctx = document.getElementById('stackedBarChart').getContext('2d');

        if (this.stackedBarChart) {
            this.stackedBarChart.destroy();
        }

        this.stackedBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Pull Request'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'File Size (bytes)'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'File Sizes by Extension Over Time'
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
                                return `${label}: ${this.formatBytes(value)}`;
                            },
                            afterBody: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const total = data.datasets.reduce((sum, dataset) => {
                                    return sum + (dataset.data[index] || 0);
                                }, 0);
                                return `Total: ${this.formatBytes(total)}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
    }

    createLineChart(data) {
        const ctx = document.getElementById('lineChart').getContext('2d');

        if (this.lineChart) {
            this.lineChart.destroy();
        }

        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Pull Request'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Relative Size (%)'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'File Size Trends (Normalized to First Non-Zero Value)'
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
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
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

    destroy() {
        if (this.stackedBarChart) {
            this.stackedBarChart.destroy();
            this.stackedBarChart = null;
        }
        if (this.lineChart) {
            this.lineChart.destroy();
            this.lineChart = null;
        }
    }
}