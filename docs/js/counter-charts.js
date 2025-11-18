class CounterChartManager {
    constructor() {
        this.stackedBarChart = null;
        this.lineChart = null;
        this.versionTags = null;
    }

    setVersionTags(versionTags) {
        this.versionTags = versionTags;
    }

    createCharts(chartData) {
        this.createStackedBarChart(chartData.raw);
        this.createLineChart(chartData.normalized);
    }

    createAnnotationsForChart(prNumbers) {
        if (!this.versionTags || this.versionTags.size === 0) {
            return {};
        }

        const annotations = {};

        // Iterate through version tags and find matching PR positions
        this.versionTags.forEach((prNumber, versionTag) => {
            const prIndex = prNumbers.findIndex(pr => String(pr) === String(prNumber));

            if (prIndex !== -1) {
                // Draw line after this PR (between this PR and the next one)
                const annotationKey = `version-${versionTag}`;
                annotations[annotationKey] = {
                    type: 'line',
                    xMin: prIndex + 0.5,
                    xMax: prIndex + 0.5,
                    borderColor: '#e74c3c',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    label: {
                        display: true,
                        content: versionTag,
                        position: 'start',
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        color: 'white',
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        padding: 4,
                        rotation: -90
                    }
                };
            }
        });

        return annotations;
    }

    createStackedBarChart(data) {
        const ctx = document.getElementById('counterStackedBarChart').getContext('2d');

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
                            text: 'Pull Request (click to open)'
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Counter Value'
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
                        text: 'Counter Values Over Time'
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
                                return `${label}: ${this.formatNumber(value)}`;
                            },
                            afterBody: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const total = data.datasets.reduce((sum, dataset) => {
                                    return sum + (dataset.data[index] || 0);
                                }, 0);
                                return `Total: ${this.formatNumber(total)}`;
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

    createLineChart(data) {
        const ctx = document.getElementById('counterLineChart').getContext('2d');

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
                            text: 'Pull Request (click to open)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Relative Count (%)'
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
                        text: 'Counter Trends (Normalized to First Non-Zero Value)'
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
