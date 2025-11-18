class TimingChartManager extends BaseChartManager {
    constructor() {
        super({
            stackedBarCanvasId: 'timingStackedBarChart',
            lineCanvasId: 'timingLineChart',
            stackedBarTitle: 'Execution Time by Phase Over Time',
            lineChartTitle: 'Timing Trends (Normalized to First Non-Zero Value)',
            yAxisLabel: 'Time (seconds)',
            normalizedYAxisLabel: 'Relative Time (%)',
            formatValueFn: (value) => this.formatTime(value)
        });
    }

    formatTime(seconds) {
        if (seconds === 0) return '0 s';

        if (seconds < 0.001) {
            return (seconds * 1000000).toFixed(2) + ' μs';
        } else if (seconds < 1) {
            return (seconds * 1000).toFixed(2) + ' ms';
        } else if (seconds < 60) {
            return seconds.toFixed(2) + ' s';
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = (seconds % 60).toFixed(2);
            return `${minutes}m ${remainingSeconds}s`;
        }
    }
}
