class AllocationTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'allocationDataTableBody',
            dataKey: 'phases'
        });
    }

    // Override to use only the 'all' phase value for comparison
    calculateComparisonValue(entry) {
        return entry.phases.get('all') || 0;
    }
}
