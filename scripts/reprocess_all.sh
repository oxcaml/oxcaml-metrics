#!/bin/bash

# Script to reprocess all raw data by running convert_metrics.py
# for each pair of artifact-sizes and profiles files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RAW_DATA_DIR="$PROJECT_ROOT/raw-data"
OUTPUT_DIR="$PROJECT_ROOT/data"

echo "Reprocessing all raw data..."
echo "Raw data directory: $RAW_DATA_DIR"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Counter for processed files
processed=0
skipped=0

# Iterate over all artifact-sizes-*.csv files
for artifact_file in "$RAW_DATA_DIR"/artifact-sizes-*.csv; do
    # Check if any files matched (avoid error if no files exist)
    [ -e "$artifact_file" ] || continue

    # Extract the identifier (part after "artifact-sizes-" and before ".csv")
    basename=$(basename "$artifact_file")
    identifier="${basename#artifact-sizes-}"
    identifier="${identifier%.csv}"

    # Construct the corresponding profiles filename
    profiles_file="$RAW_DATA_DIR/profiles-${identifier}.tar.gz"

    # Check if the profiles file exists
    if [ -f "$profiles_file" ]; then
        echo "Processing: $identifier"
        echo "  Artifact sizes: $artifact_file"
        echo "  Profiles: $profiles_file"

        # Run the conversion script
        python3 "$SCRIPT_DIR/convert_metrics.py" \
            --artifact-sizes "$artifact_file" \
            --profiles "$profiles_file" \
            --output-dir "$OUTPUT_DIR"

        processed=$((processed + 1))
        echo "  ✓ Done"
        echo ""
    else
        echo "Skipping: $identifier (no matching profiles file)"
        skipped=$((skipped + 1))
    fi
done

echo "======================================"
echo "Reprocessing complete!"
echo "Processed: $processed"
echo "Skipped: $skipped"
echo "======================================"
