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
                                const prNumber = chartData.prNumbers[index];
                                const commit = chartData.commits[index];
                                const timestamp = chartData.timestamps[index];
                                return `PR #${prNumber}\nCommit: ${commit.substring(0, 8)}\n${timestamp}`;
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

    destroy() {
        if (this.ratioChart) {
            this.ratioChart.destroy();
            this.ratioChart = null;
        }
    }
}
