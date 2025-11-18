class ArtifactDataProcessor extends BaseDataProcessor {
    constructor(rawData) {
        // D3 Chromatic schemePaired (12 colors) + black as 13th
        const artifactColors = [
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
            '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a',
            '#ffff99', '#b15928', '#000000'
        ];

        super(rawData, {
            dataKey: 'extensions',
            filterFn: (row) => row.kind === 'size_in_bytes',
            colorPalette: artifactColors
        });
    }

    // Override getSummaryStats to provide artifact-specific field names
    getSummaryStats() {
        const stats = super.getSummaryStats();
        if (!stats) {
            return null;
        }

        return {
            totalFiles: stats.totalItems,
            totalSize: stats.total,
            latestCommit: stats.latestCommit,
            latestPrNumber: stats.latestPrNumber,
            latestTimestamp: stats.latestTimestamp,
            dataPoints: stats.dataPoints
        };
    }
}
