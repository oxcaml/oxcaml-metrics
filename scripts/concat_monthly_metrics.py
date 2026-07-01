#!/usr/bin/env python3
"""
Concatenate monthly metrics CSV files.

Usage: python3 concat_monthly_metrics.py <year> <month>
Example: python3 concat_monthly_metrics.py 2025 09
"""

import sys
import glob
import csv
from pathlib import Path


def concat_csv_files(year, month):
    """Concatenate all metrics CSV files for a given year and month."""
    # Format month with leading zero if needed
    month_str = f"{int(month):02d}"

    # Pattern to match input files
    pattern = f"data/metrics-{year}-{month_str}-*.csv"
    input_files = sorted(glob.glob(pattern))

    if not input_files:
        print(f"No files found matching pattern: {pattern}")
        return 1

    # Output file path
    output_file = f"data/metrics-{year}-{month_str}.csv"

    print(f"Found {len(input_files)} files to concatenate")
    print(f"Output: {output_file}")

    # Read and concatenate. Some historical files may have fewer metadata
    # columns than newer files, so preserve the first file's column order and
    # append any new columns discovered later.
    rows = []
    fieldnames = []
    seen_fieldnames = set()

    for input_file in input_files:
        with open(input_file, 'r', newline='') as inf:
            reader = csv.DictReader(inf)
            for fieldname in reader.fieldnames or []:
                if fieldname not in seen_fieldnames:
                    fieldnames.append(fieldname)
                    seen_fieldnames.add(fieldname)
            rows.extend(reader)

    rows_written = 0
    with open(output_file, 'w', newline='') as outf:
        writer = csv.DictWriter(outf, fieldnames=fieldnames)
        writer.writeheader()

        for row in rows:
            writer.writerow(row)
            rows_written += 1

    print(f"Successfully wrote {rows_written} rows to {output_file}")
    return 0


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 concat_monthly_metrics.py <year> <month>")
        print("Example: python3 concat_monthly_metrics.py 2025 09")
        return 1

    year = sys.argv[1]
    month = sys.argv[2]

    return concat_csv_files(year, month)


if __name__ == "__main__":
    sys.exit(main())
