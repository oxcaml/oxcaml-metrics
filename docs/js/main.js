document.addEventListener('DOMContentLoaded', async () => {
    const dataLoader = new DataLoader();
    const chartManager = new ChartManager();
    const tableManager = new TableManager();
    const counterChartManager = new CounterChartManager();
    const counterTableManager = new CounterTableManager();

    try {
        // Initialize and load data
        const rawData = await dataLoader.initialize();

        // Create notes loader with same owner/repo
        const notesLoader = new NotesLoader(dataLoader.owner, dataLoader.repo);

        // Load notes and version tags
        await notesLoader.loadNotes();
        await notesLoader.loadVersionTags();

        // Process artifact size data
        const dataProcessor = new DataProcessor(rawData);
        const processedData = dataProcessor.process();

        // Get chart data for artifact sizes
        const chartData = dataProcessor.getChartData();

        // Set version tags for chart annotations
        chartManager.setVersionTags(notesLoader.versionTags);

        // Create artifact size charts
        chartManager.createCharts(chartData);

        // Create artifact size table with notes
        tableManager.createTable(processedData, notesLoader);

        // Display summary stats for artifact sizes
        const stats = dataProcessor.getSummaryStats();
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