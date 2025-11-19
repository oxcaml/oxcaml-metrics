class TopHeapDataProcessor extends BaseDataProcessor {
    constructor(rawData) {
        // Use a color palette suitable for phases
        const phaseColors = [
            '#3498db', // Blue
            '#e74c3c', // Red
            '#2ecc71', // Green
            '#f39c12', // Orange
            '#9b59b6', // Purple
            '#1abc9c'  // Teal
        ];

        super(rawData, {
            dataKey: 'phases',
            filterFn: (row) => row.kind === 'top_heap_in_bytes',
            colorPalette: phaseColors,
            nameMapFn: mapPhaseName
        });
    }

    // Override getSummaryStats to provide top-heap-specific field names
    getSummaryStats() {
        const stats = super.getSummaryStats();
        if (!stats) {
            return null;
        }

        return {
            totalPhases: stats.totalItems,
            totalTopHeap: stats.total,
            latestCommit: stats.latestCommit,
            latestPrNumber: stats.latestPrNumber,
            latestTimestamp: stats.latestTimestamp,
            dataPoints: stats.dataPoints
        };
    }
}
