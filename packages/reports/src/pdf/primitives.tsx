import {
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import React from 'react';
import type {
  ReactElement,
  ReactNode,
} from 'react';
import type { ScaleDisplayRow } from '../models/report-model.js';

export const reportStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 32,
    paddingBottom: 40,
    fontSize: 10,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 12,
    color: '#4b5563',
  },
  sectionContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 700,
    color: '#111827',
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#1f2937',
  },
  keyValueGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keyValueCell: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
  keyLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  keyValue: {
    fontSize: 10,
    color: '#111827',
  },
  scaleTable: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 3,
  },
  scaleHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scaleRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scaleRowLast: {
    borderBottomWidth: 0,
  },
  colScale: {
    width: '42%',
  },
  colRaw: {
    width: '14%',
    textAlign: 'center',
  },
  colT: {
    width: '14%',
    textAlign: 'center',
  },
  colElevated: {
    width: '15%',
    textAlign: 'center',
  },
  colSignificant: {
    width: '15%',
    textAlign: 'center',
  },
});

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({
  title,
  children,
}: SectionProps): ReactElement {
  void React;

  return (
    <View style={reportStyles.sectionContainer}>
      <Text style={reportStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export interface KeyValueItem {
  key: string;
  label: string;
  value: string;
}

interface KeyValueGridProps {
  items: KeyValueItem[];
}

export function KeyValueGrid({ items }: KeyValueGridProps): ReactElement {
  void React;

  return (
    <View style={reportStyles.keyValueGrid}>
      {items.map((item) => (
        <View key={item.key} style={reportStyles.keyValueCell}>
          <Text style={reportStyles.keyLabel}>{item.label}</Text>
          <Text style={reportStyles.keyValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

interface ScaleTableProps {
  rows: ScaleDisplayRow[];
}

export function ScaleTable({ rows }: ScaleTableProps): ReactElement {
  void React;

  return (
    <View style={reportStyles.scaleTable}>
      <View style={reportStyles.scaleHeaderRow}>
        <Text style={reportStyles.colScale}>Scale</Text>
        <Text style={reportStyles.colRaw}>Raw</Text>
        <Text style={reportStyles.colT}>T</Text>
        <Text style={reportStyles.colElevated}>Elevated</Text>
        <Text style={reportStyles.colSignificant}>Significant</Text>
      </View>
      {rows.map((row, index) => {
        const rowStyle =
          index === rows.length - 1
            ? [reportStyles.scaleRow, reportStyles.scaleRowLast]
            : reportStyles.scaleRow;

        return (
          <View key={row.scaleKey} style={rowStyle}>
            <Text style={reportStyles.colScale}>{row.scaleName}</Text>
            <Text style={reportStyles.colRaw}>{row.rawScore}</Text>
            <Text style={reportStyles.colT}>{row.tScore ?? '-'}</Text>
            <Text style={reportStyles.colElevated}>{row.isElevated ? 'Yes' : 'No'}</Text>
            <Text style={reportStyles.colSignificant}>{row.isClinicallySignificant ? 'Yes' : 'No'}</Text>
          </View>
        );
      })}
    </View>
  );
}
