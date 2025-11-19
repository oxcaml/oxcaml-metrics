class TopHeapTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'topHeapDataTableBody',
            dataKey: 'phases'
        });
    }

    // Override to use only the 'all' phase value for comparison
    calculateComparisonValue(entry) {
        return entry.phases.get('all') || 0;
    }
}
