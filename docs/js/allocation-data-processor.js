class AllocationDataProcessor extends BaseDataProcessor {
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
            filterFn: (row) => row.kind === 'alloc_in_bytes',
            colorPalette: phaseColors,
            nameMapFn: mapPhaseName
        });
    }

    // Override getSummaryStats to provide allocation-specific field names
    getSummaryStats() {
        const stats = super.getSummaryStats();
        if (!stats) {
            return null;
        }

        return {
            totalPhases: stats.totalItems,
            totalAllocation: stats.total,
            latestCommit: stats.latestCommit,
            latestPrNumber: stats.latestPrNumber,
            latestTimestamp: stats.latestTimestamp,
            dataPoints: stats.dataPoints
        };
    }
}
