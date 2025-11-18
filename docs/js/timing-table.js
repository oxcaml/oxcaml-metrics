class TimingTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'timingDataTableBody',
            dataKey: 'phases',
            changeThreshold: 15.0
        });
    }
}
