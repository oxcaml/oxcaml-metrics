#!/usr/bin/env python3
"""Compute PR attribution for a metrics point."""

import argparse
import csv
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def fatal(message: str) -> None:
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)


def read_artifact_metadata(path: Path) -> Dict[str, str]:
    with path.open(newline='') as f:
        rows = csv.DictReader(f)
        try:
            row = next(rows)
        except StopIteration:
            fatal(f"No data found in {path}")

    return {
        'timestamp': row['timestamp'],
        'commit_hash': row['commit_hash'],
        'pr_number': row['pr_number'],
    }


def read_metrics_metadata(path: Path) -> Optional[Dict[str, str]]:
    with path.open(newline='') as f:
        rows = csv.DictReader(f)
        for row in rows:
            return {
                'timestamp': row['timestamp'],
                'commit_hash': row['commit_hash'],
                'pr_number': row['pr_number'],
            }
    return None


def find_previous_metrics_point(
        data_dir: Path, current_metadata: Dict[str, str]
) -> Optional[Dict[str, str]]:
    previous_points: List[Tuple[str, Dict[str, str]]] = []
    current_commit = current_metadata['commit_hash']
    current_timestamp = current_metadata['timestamp']

    for path in data_dir.glob('metrics-*.csv'):
        metadata = read_metrics_metadata(path)
        if not metadata:
            continue
        if metadata['commit_hash'] == current_commit:
            continue
        if metadata['timestamp'] < current_timestamp:
            previous_points.append((metadata['timestamp'], metadata))

    if not previous_points:
        return None

    previous_points.sort(key=lambda item: item[0])
    return previous_points[-1][1]


def github_json(url: str, token: Optional[str]) -> Dict:
    headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'oxcaml-metrics',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def extract_pr_numbers_from_compare(
        owner: str, repo: str, base: str, head: str, token: Optional[str]
) -> List[str]:
    url = f'https://api.github.com/repos/{owner}/{repo}/compare/{base}...{head}'
    data = github_json(url, token)

    pr_numbers: List[str] = []
    seen = set()
    for commit in data.get('commits', []):
        message = commit.get('commit', {}).get('message', '')
        matches = re.findall(r'\(#(\d+)\)', message)
        if not matches:
            continue
        pr_number = matches[-1]
        if pr_number in seen:
            continue
        seen.add(pr_number)
        pr_numbers.append(pr_number)

    return pr_numbers


def write_github_output(path: Path, values: Dict[str, str]) -> None:
    with path.open('a') as f:
        for name, value in values.items():
            f.write(f'{name}={value}\n')


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Compute PR attribution for a metrics point.'
    )
    parser.add_argument('--artifact-sizes', type=Path, required=True)
    parser.add_argument('--data-dir', type=Path, required=True)
    parser.add_argument('--source-owner', default='oxcaml')
    parser.add_argument('--source-repo', default='oxcaml')
    parser.add_argument('--github-token', default=os.environ.get('GH_TOKEN'))
    parser.add_argument('--github-output', type=Path, default=None)
    args = parser.parse_args()

    current = read_artifact_metadata(args.artifact_sizes)
    previous = find_previous_metrics_point(args.data_dir, current)

    pr_numbers = [current['pr_number']]
    comparison_base_commit_hash = ''

    if previous:
        comparison_base_commit_hash = previous['commit_hash']
        try:
            range_pr_numbers = extract_pr_numbers_from_compare(
                args.source_owner,
                args.source_repo,
                previous['commit_hash'],
                current['commit_hash'],
                args.github_token)
            if range_pr_numbers:
                pr_numbers = range_pr_numbers
        except Exception as exn:
            print(f"Warning: failed to fetch comparison PR numbers: {exn}",
                  file=sys.stderr)

    values = {
        'pr_numbers': '/'.join(pr_numbers),
        'comparison_base_commit_hash': comparison_base_commit_hash,
    }

    github_output = args.github_output
    if github_output is None and os.environ.get('GITHUB_OUTPUT'):
        github_output = Path(os.environ['GITHUB_OUTPUT'])

    if github_output:
        write_github_output(github_output, values)
    else:
        print(json.dumps(values))


if __name__ == '__main__':
    main()
