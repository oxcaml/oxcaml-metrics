// Select whole measurements before computing baselines, deltas, or trends.
function filterHistory(rawData, range, versionTags) {
    if (range === 'all' || rawData.length === 0) {
        return rawData;
    }

    if (range === 'releases') {
        const releasePRs = new Set(Array.from(versionTags.values(), String));
        const timestamps = new Map();

        // DataLoader sorts by timestamp. Keep the first measurement for each
        // release PR, matching the existing chart annotation positions.
        rawData.forEach(row => {
            const pr = String(row.pr_number);
            if (releasePRs.has(pr) && !timestamps.has(pr)) {
                timestamps.set(pr, row.timestamp);
            }
        });
        return rawData.filter(row => timestamps.get(String(row.pr_number)) === row.timestamp);
    }

    const latest = rawData.reduce((time, row) => Math.max(time, Date.parse(row.timestamp)), -Infinity);
    const cutoff = latest - Number(range) * 24 * 60 * 60 * 1000;
    return rawData.filter(row => Date.parse(row.timestamp) >= cutoff);
}

function showMetricData(tabId, hasData) {
    const tab = document.getElementById(tabId);
    tab.querySelectorAll('.chart-section').forEach(section => {
        section.hidden = !hasData;
    });
    tab.querySelector('.empty-state').hidden = hasData;
}

document.addEventListener('DOMContentLoaded', async () => {
    const dataLoader = new DataLoader();
    const historyRange = document.getElementById('history-range');
    const views = [
        {
            tabId: 'overview',
            Processor: ArtifactDataProcessor,
            charts: new ArtifactChartManager(),
            table: new ArtifactTableManager()
        },
        {
            tabId: 'details',
            Processor: CounterDataProcessor,
            charts: new CounterChartManager(),
            table: new CounterTableManager()
        },
        {
            tabId: 'allocations',
            Processor: AllocationDataProcessor,
            charts: new AllocationChartManager(),
            table: new AllocationTableManager()
        },
        {
            tabId: 'topheap',
            Processor: TopHeapDataProcessor,
            charts: new TopHeapChartManager(),
            table: new TopHeapTableManager()
        },
        {
            tabId: 'absolutetopheap',
            Processor: AbsoluteTopHeapDataProcessor,
            charts: new AbsoluteTopHeapChartManager(),
            table: new AbsoluteTopHeapTableManager()
        },
        {
            tabId: 'timings',
            Processor: TimingDataProcessor,
            charts: new TimingChartManager(),
            table: new TimingTableManager()
        }
    ];
    const ratioChartManager = new RatioChartManager();

    try {
        // Initialize and load data
        const rawData = await dataLoader.initialize();

        // Create notes loader with same owner/repo
        const notesLoader = new NotesLoader(dataLoader.owner, dataLoader.repo);

        // Load notes and version tags
        await notesLoader.loadNotes();
        await notesLoader.loadVersionTags();

        views.forEach(view => view.charts.setVersionTags(notesLoader.versionTags));
        ratioChartManager.setVersionTags(notesLoader.versionTags);

        function renderHistory() {
            const visibleData = filterHistory(rawData, historyRange.value, notesLoader.versionTags);

            views.forEach(({ tabId, Processor, charts, table }) => {
                const processor = new Processor(visibleData);
                const processedData = processor.process();
                const hasData = processedData.processed.data.length > 0;

                // Clear old charts and rows even when the new selection is empty.
                charts.destroy();
                table.createTable(processedData, notesLoader);
                showMetricData(tabId, hasData);
                if (hasData) {
                    charts.createCharts(processor.getChartData());
                    console.log(`${tabId} statistics:`, processor.getSummaryStats());
                }
            });

            // Derived trends must also be recomputed from visible measurements.
            const ratioDataProcessor = new RatioDataProcessor(visibleData);
            const ratioData = ratioDataProcessor.process();
            ratioChartManager.destroy();
            showMetricData('ratio', ratioData.length > 0);
            if (ratioData.length > 0) {
                ratioChartManager.createChart(ratioDataProcessor.getChartData());
                console.log('Ratio Statistics:', ratioDataProcessor.getSummaryStats());
            }

            const timestamps = [...new Set(visibleData.map(row => row.timestamp))];
            const summary = document.getElementById('history-summary');
            summary.textContent = timestamps.length === 0
                ? 'No matching measurements'
                : `${timestamps.length} measurements · ${timestamps[0].slice(0, 10)} – ${timestamps[timestamps.length - 1].slice(0, 10)}`;
        }

        renderHistory();
        historyRange.disabled = false;
        historyRange.addEventListener('change', renderHistory);

    } catch (error) {
        console.error('Failed to load and display data:', error);

        // Show error message to user
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.className = 'status error';
        }
    }
});
