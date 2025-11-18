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

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
