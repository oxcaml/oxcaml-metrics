#!/usr/bin/env python3
"""
Convert raw artifact size data to aggregated metrics by extension.

This script takes a CSV file with individual artifact sizes and converts it
to a CSV file with aggregated sizes per file extension.

Input format (raw-data/):
  timestamp,commit_hash,pr_number,kind,name,value
  2025-11-18T09:34:49Z,hash,5004,size_in_bytes,bin/ocamlc.opt,26251088

Output format (data/):
  timestamp,commit_hash,pr_number,kind,name,value
  2025-11-18T09:34:49Z,hash,5004,size_in_bytes,opt,336187168
"""

import argparse
import csv
import sys
import os
from pathlib import Path
from collections import defaultdict
from typing import Optional, Dict


# List of extensions we're interested in tracking
TARGET_EXTENSIONS = [
    'exe', 'opt', 'a', 'cmxa', 'cma', 'cmi', 'cmx',
    'cmo', 'cms', 'cmsi', 'cmt', 'cmti', 'o'
]


def fatal(message: str) -> None:
    """Print an error message to stderr and exit with status 1."""
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)


def extract_extension(filename: str) -> Optional[str]:
    """Extract the file extension after the last dot."""
    _, ext = os.path.splitext(filename)
    return ext[1:] if ext else None  # Remove leading dot


def convert_artifact_sizes(input_path: Path, output_dir: Path) -> Path:
    """
    Convert raw artifact sizes to aggregated metrics by extension.

    Args:
        input_path: Path to the input CSV file
        output_dir: Directory where the output CSV will be written

    Returns:
        Path to the output CSV file
    """

    # Read the input CSV
    with open(input_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    if not rows:
        fatal(f"No data found in {input_path}")

    # Extract metadata from the first row
    timestamp = rows[0]['timestamp']
    commit_hash = rows[0]['commit_hash']
    pr_number = rows[0]['pr_number']
    kind = rows[0]['kind']

    # Aggregate sizes by extension
    extension_sizes = defaultdict(int)

    for row in rows:
        filename = row['name']
        size = int(row['value'])

        ext = extract_extension(filename)
        if ext in TARGET_EXTENSIONS:
            extension_sizes[ext] += size

    # Ensure all target extensions are present (with 0 if missing)
    for ext in TARGET_EXTENSIONS:
        if ext not in extension_sizes:
            extension_sizes[ext] = 0

    # Generate output filename
    # Convert: artifact-sizes-2025-11-18-d72de38c.csv -> metrics-2025-11-18-d72de38c.csv
    output_filename = input_path.name.replace('artifact-sizes-', 'metrics-')
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / output_filename

    # Write the output CSV
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'commit_hash', 'pr_number', 'kind', 'name', 'value'])

        for ext in TARGET_EXTENSIONS:
            writer.writerow([
                timestamp,
                commit_hash,
                pr_number,
                kind,
                ext,
                extension_sizes[ext]
            ])

    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Convert raw artifact size data to aggregated metrics by extension.'
    )
    parser.add_argument(
        '--input-metrics',
        type=Path,
        required=True,
        help='Path to the input CSV file with raw artifact sizes'
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        required=True,
        help='Directory where the output CSV file will be written'
    )

    args = parser.parse_args()

    if not args.input_metrics.exists():
        fatal(f"Input file '{args.input_metrics}' not found")

    output_path = convert_artifact_sizes(args.input_metrics, args.output_dir)
    print(f"Successfully converted {args.input_metrics} -> {output_path}")


if __name__ == '__main__':
    main()
