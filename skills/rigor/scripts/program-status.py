"""Derive a project status from its canonical TSV tables; never dispatch agents."""
from pathlib import Path
import argparse
import csv
from collections import Counter
import os
import tempfile

VERDICTS = {'live-ui-verified', 'unit-test-verified', 'type-check-only',
            'verifier-blocked', 'verifier-failed'}
STATES = {'planned', 'active', 'needs-verify', 'done', 'failed', 'abandoned',
          'zombie-reconciled'}


def read_table(path, fields):
    with path.open(newline='', encoding='utf-8') as source:
        reader = csv.DictReader(source, delimiter='\t')
        if reader.fieldnames != fields:
            raise ValueError(f'{path.name}: expected tab-separated header {fields}')
        rows = list(reader)
    if any(None in row or any(value is None for value in row.values()) for row in rows):
        raise ValueError(f'{path.name}: malformed row')
    return rows


def render(store):
    units = read_table(store / 'units.tsv', ['id', 'track', 'state', 'branch', 'pr', 'head', 'brief'])
    ledger = read_table(store / 'ledger.tsv', ['pr', 'head', 'verdict', 'origin', 'evidence'])
    ids = [unit['id'] for unit in units]
    if len(set(ids)) != len(ids) or '' in ids:
        raise ValueError('units.tsv: empty or duplicate unit id')
    if any(unit['state'] not in STATES for unit in units):
        raise ValueError('units.tsv: unknown state')
    by_key = {}
    for row in ledger:
        if row['verdict'] not in VERDICTS or row['origin'] not in {'self', 'verifier'}:
            raise ValueError('ledger.tsv: unknown verdict or origin')
        if not row['pr'] or not row['head'] or not row['evidence']:
            raise ValueError('ledger.tsv: missing PR, head or evidence')
        by_key.setdefault((row['pr'], row['head']), {})[row['origin']] = row
    counts = Counter(unit['state'] for unit in units)
    lines = ['# Derived project status', '',
             'Owner reports are not independent verification. Evidence must still be read.', '',
             'States: ' + ', '.join(f'{state}={counts[state]}' for state in sorted(STATES)), '',
             '| Unit | Track | State | PR | Head | Current verdict | Evidence |',
             '|---|---|---|---|---|---|---|']
    verified = 0
    for unit in units:
        origins = by_key.get((unit['pr'], unit['head']), {})
        verdict = origins.get('verifier', origins.get('self', {}))
        label = verdict.get('verdict', 'unverified')
        if unit['state'] == 'done' and label in {'live-ui-verified', 'unit-test-verified'}:
            verified += 1
        cells = [unit['id'], unit['track'], unit['state'], unit['pr'], unit['head'],
                 label, verdict.get('evidence', '')]
        lines.append('| ' + ' | '.join(c.replace('|', '\\|').replace('\n', ' ') for c in cells) + ' |')
    gates = (store / 'gates.md').read_text(encoding='utf-8')
    open_gates = sum(line.lstrip().startswith('- [ ] ') for line in gates.splitlines())
    lines += ['', f'Done with a current passing ledger receipt: {verified}/{len(units)}.',
              f'Open gates: {open_gates}.', '',
              'Changes and decisions: see overview.md and decisions.tsv.', '']
    return '\n'.join(lines), counts, verified, len(units), open_gates


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('store', type=Path)
    args = parser.parse_args()
    try:
        text, counts, verified, total, gates = render(args.store)
        # Validate all inputs first; failed validation must preserve the previous report.
        fd, path = tempfile.mkstemp(prefix='.status-', dir=args.store)
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as output:
                output.write(text)
            os.replace(path, args.store / 'status.md')
        finally:
            Path(path).unlink(missing_ok=True)
    except (ValueError, OSError) as error:
        parser.exit(1, f'{error}\n')
    print('States: ' + ', '.join(f'{state}={counts[state]}' for state in sorted(STATES)))
    print(f'Current passing receipts: {verified}/{total}; changes: overview.md / decisions.tsv')
    print(f'Open gates: {gates}')


if __name__ == '__main__':
    main()
