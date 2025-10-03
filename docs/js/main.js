document.addEventListener('DOMContentLoaded', async () => {
    const dataLoader = new DataLoader();
    const chartManager = new ChartManager();
    const tableManager = new TableManager();

    try {
        // Initialize and load data
        const rawData = await dataLoader.initialize();

        // Process data
        const dataProcessor = new DataProcessor(rawData);
        const processedData = dataProcessor.process();

        // Get chart data
        const chartData = dataProcessor.getChartData();

        // Create charts
        chartManager.createCharts(chartData);

        // Create table
        tableManager.createTable(processedData);

        // Display summary stats
        const stats = dataProcessor.getSummaryStats();
        if (stats) {
            console.log('Summary Statistics:', stats);
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