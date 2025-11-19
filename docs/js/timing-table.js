class TimingTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'timingDataTableBody',
            dataKey: 'phases',
            changeThreshold: 15.0
        });
    }

    // Override to use only the '<all>' phase value for comparison
    calculateComparisonValue(entry) {
        return entry.phases.get('<all>') || 0;
    }
}
