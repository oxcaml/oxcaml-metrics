class CounterTableManager extends BaseTableManager {
    constructor() {
        super({
            tableBodyId: 'counterDataTableBody',
            dataKey: 'counters'
        });
    }
}
