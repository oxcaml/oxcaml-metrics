// Register the annotation plugin
if (typeof chartjs_plugin_annotation !== 'undefined') {
    Chart.register(chartjs_plugin_annotation.default || chartjs_plugin_annotation);
}

class ArtifactChartManager extends BaseChartManager {
    constructor() {
        super({
            stackedBarCanvasId: 'stackedBarChart',
            lineCanvasId: 'lineChart',
            stackedBarTitle: 'File Sizes by Extension Over Time',
            lineChartTitle: 'File Size Trends (Normalized to First Non-Zero Value)',
            yAxisLabel: 'File Size (bytes)',
            normalizedYAxisLabel: 'Relative Size (%)',
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
