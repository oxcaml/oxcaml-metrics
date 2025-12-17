class BaseChartManager {
    constructor(config) {
        this.stackedBarChart = null;
        this.lineChart = null;
        this.versionTags = null;
        this.config = config;
        // config should contain:
        // - stackedBarCanvasId: ID of canvas element for stacked bar chart
        // - lineCanvasId: ID of canvas element for line chart
        // - stackedBarTitle: Title for stacked bar chart
        // - lineChartTitle: Title for line chart
        // - yAxisLabel: Label for Y axis in stacked bar chart
        // - normalizedYAxisLabel: Label for Y axis in line chart
        // - formatValueFn: Function to format values in tooltips
    }

    setVersionTags(versionTags) {
        this.versionTags = versionTags;
    }

    /**
     * Calculate linear regression coefficients (slope and intercept) for a dataset
     * using the least squares method.
     * @param {Array<number>} xValues - Array of x values (indices)
     * @param {Array<number>} yValues - Array of y values (data points)
     * @returns {{slope: number, intercept: number}} Regression coefficients
     */
    calculateLinearRegression(xValues, yValues) {
        const n = xValues.length;
        if (n === 0) {
            return { slope: 0, intercept: 0 };
        }

        // Calculate means
        const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
        const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

        // Calculate slope and intercept using least squares method
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
            denominator += (xValues[i] - xMean) * (xValues[i] - xMean);
        }

        const slope = denominator === 0 ? 0 : numerator / denominator;
        const intercept = yMean - slope * xMean;

        return { slope, intercept };
    }

    /**
     * Generate regression line datasets for specified intervals
     * @param {Array<number>} dataPoints - The data points to fit
     * @param {Array<{start: number, end: number}>} intervals - Array of intervals
     * @param {string} color - Base color for the regression line
     * @param {string} label - Label for the regression line
     * @returns {Array<Object>} Array of Chart.js dataset objects for regression lines
     */
    generateRegressionDatasets(dataPoints, intervals, color, label) {
        const regressionDatasets = [];

        intervals.forEach((interval, index) => {
            const { start, end } = interval;

            // Extract data for this interval
            const xValues = [];
            const yValues = [];

            for (let i = start; i <= end && i < dataPoints.length; i++) {
                xValues.push(i);
                yValues.push(dataPoints[i]);
            }

            if (xValues.length < 2) {
                // Need at least 2 points for a line
                return;
            }

            // Calculate regression coefficients
            const { slope, intercept } = this.calculateLinearRegression(xValues, yValues);

            // Generate regression line data
            const regressionData = new Array(dataPoints.length).fill(null);
            for (let i = start; i <= end && i < dataPoints.length; i++) {
                regressionData[i] = slope * i + intercept;
            }

            // Create dataset for this regression line segment
            regressionDatasets.push({
                label: intervals.length > 1 ? `${label} (Regression ${index + 1})` : `${label} (Regression)`,
                data: regressionData,
                borderColor: color,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5], // Dashed line
                pointRadius: 0, // No points
                pointHoverRadius: 0,
                fill: false,
                tension: 0, // Straight line
                order: 1000 // Draw regression lines on top
            });
        });

        return regressionDatasets;
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
        const ctx = document.getElementById(this.config.stackedBarCanvasId).getContext('2d');

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
                            },
                            afterBody: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const total = data.datasets.reduce((sum, dataset) => {
                                    return sum + (dataset.data[index] || 0);
                                }, 0);
                                return `Total: ${this.config.formatValueFn(total)}`;
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
        const ctx = document.getElementById(this.config.lineCanvasId).getContext('2d');

        if (this.lineChart) {
            this.lineChart.destroy();
        }

        // Prepare datasets with optional regression lines
        let datasets = [...data.datasets];

        // Add regression lines if enabled and 'all' dataset exists
        if (this.config.enableRegression) {
            const allDataset = data.datasets.find(ds => ds.label === 'all');
            if (allDataset && allDataset.data && allDataset.data.length > 0) {
                // Define intervals - currently using a single interval covering the whole dataset
                // This structure allows for easy future expansion to multiple intervals
                const intervals = [
                    { start: 0, end: allDataset.data.length - 1 }
                ];

                // Generate regression datasets
                const regressionDatasets = this.generateRegressionDatasets(
                    allDataset.data,
                    intervals,
                    allDataset.borderColor,
                    allDataset.label
                );

                // Add regression datasets to the chart
                datasets = datasets.concat(regressionDatasets);
            }
        }

        this.lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: datasets
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
                            text: this.config.normalizedYAxisLabel
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
                        text: this.config.lineChartTitle
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
