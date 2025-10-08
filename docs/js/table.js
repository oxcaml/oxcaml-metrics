class TableManager {
    constructor() {
        this.tableBody = null;
        this.notesLoader = null;
    }

    createTable(processedData, notesLoader) {
        this.notesLoader = notesLoader;
        this.tableBody = document.getElementById('dataTableBody');

        if (!this.tableBody) {
            console.error('Table body element not found');
            return;
        }

        if (!processedData || !processedData.processed || !processedData.processed.data) {
            console.error('Invalid data structure:', processedData);
            return;
        }

        const { data } = processedData.processed;

        // Clear existing content
        this.tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            console.warn('No data to display in table');
            return;
        }

        // Iterate through data and create rows
        data.forEach((entry, index) => {
            const row = document.createElement('tr');

            // Calculate total size for this entry
            const totalSize = Array.from(entry.extensions.values()).reduce((sum, size) => sum + size, 0);

            // Calculate percentage change from previous entry
            let changePercent = null;
            let changeClass = 'neutral';
            if (index > 0) {
                const prevEntry = data[index - 1];
                const prevTotalSize = Array.from(prevEntry.extensions.values()).reduce((sum, size) => sum + size, 0);

                if (prevTotalSize > 0) {
                    changePercent = ((totalSize - prevTotalSize) / prevTotalSize) * 100;

                    if (changePercent > 2.50) {
                        changeClass = 'positive';
                    } else if (changePercent < -2.50) {
                        changeClass = 'negative';
                    }
                }
            }

            // Apply class to the row
            row.className = changeClass;

            // Create PR number cell (clickable)
            const prCell = document.createElement('td');
            prCell.textContent = `#${entry.pr_number}`;
            prCell.style.cursor = 'pointer';
            prCell.addEventListener('click', () => {
                const prUrl = `https://github.com/oxcaml/oxcaml/pull/${entry.pr_number}`;
                window.open(prUrl, '_blank');
            });

            // Create change percentage cell
            const changeCell = document.createElement('td');
            if (changePercent === null) {
                changeCell.textContent = '—';
            } else {
                const sign = changePercent >= 0 ? '+' : '';
                changeCell.textContent = `${sign}${changePercent.toFixed(2)}%`;
            }

            // Create note cell
            const noteCell = document.createElement('td');
            const note = this.notesLoader ? this.notesLoader.getNote(entry.pr_number) : null;
            noteCell.textContent = note || '—';

            row.appendChild(prCell);
            row.appendChild(changeCell);
            row.appendChild(noteCell);

            this.tableBody.appendChild(row);

            // Check if this PR has a version tag
            if (this.notesLoader && this.notesLoader.versionTags) {
                const versionTag = this.findVersionTagForPR(entry.pr_number);
                if (versionTag) {
                    const versionRow = this.createVersionTagRow(versionTag);
                    this.tableBody.appendChild(versionRow);
                }
            }
        });
    }

    findVersionTagForPR(prNumber) {
        if (!this.notesLoader || !this.notesLoader.versionTags) {
            return null;
        }

        // Search through version tags to find one matching this PR
        for (const [versionTag, taggedPR] of this.notesLoader.versionTags) {
            if (String(taggedPR) === String(prNumber)) {
                return versionTag;
            }
        }

        return null;
    }

    createVersionTagRow(versionTag) {
        const row = document.createElement('tr');
        row.className = 'version-tag-row';

        // Create a single cell that spans all three columns
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.style.textAlign = 'center';
        cell.style.fontWeight = 'bold';

        // Create a link to the version tag
        const link = document.createElement('a');
        link.href = `https://github.com/oxcaml/oxcaml/tree/${versionTag}`;
        link.textContent = `Version: ${versionTag}`;
        link.target = '_blank';
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';

        cell.appendChild(link);
        row.appendChild(cell);

        return row;
    }
}
