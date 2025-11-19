class CounterDataProcessor extends BaseDataProcessor {
    constructor(rawData) {
        const countersToTrack = ['reload', 'spill', 'block', 'instruction', 'move'];

        // Use distinct colors for counters
        const counterColors = [
            '#e74c3c', // Red for first counter
            '#3498db', // Blue for second counter
            '#2ecc71', // Green for third counter (if needed)
            '#f39c12'  // Orange for fourth counter (if needed)
        ];

        super(rawData, {
            dataKey: 'counters',
            filterFn: (row) => row.kind === 'counter' && countersToTrack.includes(row.name),
            colorPalette: counterColors
        });
    }

    // Override getSummaryStats to provide counter-specific field names
    getSummaryStats() {
        const stats = super.getSummaryStats();
        if (!stats) {
            return null;
        }

        return {
            totalCounters: stats.totalItems,
            totalCount: stats.total,
            latestCommit: stats.latestCommit,
            latestPrNumber: stats.latestPrNumber,
            latestTimestamp: stats.latestTimestamp,
            dataPoints: stats.dataPoints
        };
    }
}
