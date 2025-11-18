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

    formatNumber(num) {
        if (num === 0) return '0';

        // Add thousands separators
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}
