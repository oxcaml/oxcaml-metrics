class AbsoluteTopHeapTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'absoluteTopHeapDataTableBody',
            dataKey: 'phases'
        });
    }

    // Override to use only the 'all' phase value for comparison
    calculateComparisonValue(entry) {
        return entry.phases.get('all') || 0;
    }
}
