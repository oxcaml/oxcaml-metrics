document.addEventListener('DOMContentLoaded', async () => {
    const dataLoader = new DataLoader();
    const artifactChartManager = new ArtifactChartManager();
    const artifactTableManager = new ArtifactTableManager();
    const counterChartManager = new CounterChartManager();
    const counterTableManager = new CounterTableManager();
    const allocationChartManager = new AllocationChartManager();
    const allocationTableManager = new AllocationTableManager();
    const topHeapChartManager = new TopHeapChartManager();
    const topHeapTableManager = new TopHeapTableManager();
    const absoluteTopHeapChartManager = new AbsoluteTopHeapChartManager();
    const absoluteTopHeapTableManager = new AbsoluteTopHeapTableManager();
    const timingChartManager = new TimingChartManager();
    const timingTableManager = new TimingTableManager();

    try {
        // Initialize and load data
        const rawData = await dataLoader.initialize();

        // Create notes loader with same owner/repo
        const notesLoader = new NotesLoader(dataLoader.owner, dataLoader.repo);

        // Load notes and version tags
        await notesLoader.loadNotes();
        await notesLoader.loadVersionTags();

        // Process artifact size data
        const artifactDataProcessor = new ArtifactDataProcessor(rawData);
        const processedData = artifactDataProcessor.process();

        // Get chart data for artifact sizes
        const chartData = artifactDataProcessor.getChartData();

        // Set version tags for chart annotations
        artifactChartManager.setVersionTags(notesLoader.versionTags);

        // Create artifact size charts
        artifactChartManager.createCharts(chartData);

        // Create artifact size table with notes
        artifactTableManager.createTable(processedData, notesLoader);

        // Display summary stats for artifact sizes
        const stats = artifactDataProcessor.getSummaryStats();
        if (stats) {
            console.log('Artifact Size Statistics:', stats);
        }

        // Process counter data
        const counterDataProcessor = new CounterDataProcessor(rawData);
        const counterProcessedData = counterDataProcessor.process();

        // Check if we have counter data
        if (counterProcessedData.processed.data.length > 0) {
            // Get chart data for counters
            const counterChartData = counterDataProcessor.getChartData();

            // Set version tags for counter chart annotations
            counterChartManager.setVersionTags(notesLoader.versionTags);

            // Create counter charts
            counterChartManager.createCharts(counterChartData);

            // Create counter table with notes
            counterTableManager.createTable(counterProcessedData, notesLoader);

            // Display summary stats for counters
            const counterStats = counterDataProcessor.getSummaryStats();
            if (counterStats) {
                console.log('Counter Statistics:', counterStats);
            }
        } else {
            console.warn('No counter data available');
        }

        // Process allocation data
        const allocationDataProcessor = new AllocationDataProcessor(rawData);
        const allocationProcessedData = allocationDataProcessor.process();

        // Check if we have allocation data
        if (allocationProcessedData.processed.data.length > 0) {
            // Get chart data for allocations
            const allocationChartData = allocationDataProcessor.getChartData();

            // Set version tags for allocation chart annotations
            allocationChartManager.setVersionTags(notesLoader.versionTags);

            // Create allocation charts
            allocationChartManager.createCharts(allocationChartData);

            // Create allocation table with notes
            allocationTableManager.createTable(allocationProcessedData, notesLoader);

            // Display summary stats for allocations
            const allocationStats = allocationDataProcessor.getSummaryStats();
            if (allocationStats) {
                console.log('Allocation Statistics:', allocationStats);
            }
        } else {
            console.warn('No allocation data available');
        }

        // Process top-heap data
        const topHeapDataProcessor = new TopHeapDataProcessor(rawData);
        const topHeapProcessedData = topHeapDataProcessor.process();

        // Check if we have top-heap data
        if (topHeapProcessedData.processed.data.length > 0) {
            // Get chart data for top-heap
            const topHeapChartData = topHeapDataProcessor.getChartData();

            // Set version tags for top-heap chart annotations
            topHeapChartManager.setVersionTags(notesLoader.versionTags);

            // Create top-heap charts
            topHeapChartManager.createCharts(topHeapChartData);

            // Create top-heap table with notes
            topHeapTableManager.createTable(topHeapProcessedData, notesLoader);

            // Display summary stats for top-heap
            const topHeapStats = topHeapDataProcessor.getSummaryStats();
            if (topHeapStats) {
                console.log('Top Heap Statistics:', topHeapStats);
            }
        } else {
            console.warn('No top-heap data available');
        }

        // Process absolute-top-heap data
        const absoluteTopHeapDataProcessor = new AbsoluteTopHeapDataProcessor(rawData);
        const absoluteTopHeapProcessedData = absoluteTopHeapDataProcessor.process();

        // Check if we have absolute-top-heap data
        if (absoluteTopHeapProcessedData.processed.data.length > 0) {
            // Get chart data for absolute-top-heap
            const absoluteTopHeapChartData = absoluteTopHeapDataProcessor.getChartData();

            // Set version tags for absolute-top-heap chart annotations
            absoluteTopHeapChartManager.setVersionTags(notesLoader.versionTags);

            // Create absolute-top-heap charts
            absoluteTopHeapChartManager.createCharts(absoluteTopHeapChartData);

            // Create absolute-top-heap table with notes
            absoluteTopHeapTableManager.createTable(absoluteTopHeapProcessedData, notesLoader);

            // Display summary stats for absolute-top-heap
            const absoluteTopHeapStats = absoluteTopHeapDataProcessor.getSummaryStats();
            if (absoluteTopHeapStats) {
                console.log('Absolute Top Heap Statistics:', absoluteTopHeapStats);
            }
        } else {
            console.warn('No absolute-top-heap data available');
        }

        // Process timing data
        const timingDataProcessor = new TimingDataProcessor(rawData);
        const timingProcessedData = timingDataProcessor.process();

        // Check if we have timing data
        if (timingProcessedData.processed.data.length > 0) {
            // Get chart data for timings
            const timingChartData = timingDataProcessor.getChartData();

            // Set version tags for timing chart annotations
            timingChartManager.setVersionTags(notesLoader.versionTags);

            // Create timing charts
            timingChartManager.createCharts(timingChartData);

            // Create timing table with notes
            timingTableManager.createTable(timingProcessedData, notesLoader);

            // Display summary stats for timings
            const timingStats = timingDataProcessor.getSummaryStats();
            if (timingStats) {
                console.log('Timing Statistics:', timingStats);
            }
        } else {
            console.warn('No timing data available');
        }

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

// Handle window resize
window.addEventListener('resize', () => {
    // Charts will automatically resize due to responsive: true option
});